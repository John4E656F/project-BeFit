package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/MicahParks/keyfunc/v2"
)

type ctxKey string

const UserIDKey ctxKey = "user_id"

type ClerkClaims struct {
	jwt.RegisteredClaims
}

var (
	globalJWKS   *keyfunc.JWKS
	jwksMu       sync.RWMutex
	jwksURL      string
	jwksIssuer   string
	jwksAudience string
	lastRefresh  time.Time
	refreshMu    sync.Mutex
)

func InitAuth(jwksURL, issuer, audience string) error {
	jwksMu.Lock()
	defer jwksMu.Unlock()

	jwksURL = jwksURL
	jwksIssuer = issuer
	jwksAudience = audience

	k, err := keyfunc.Get(jwksURL, keyfunc.Options{
		RefreshInterval: 10 * time.Minute,
	})
	if err != nil {
		return fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	globalJWKS = k
	lastRefresh = time.Now()
	return nil
}

func ensureJWKS() error {
	jwksMu.RLock()
	if globalJWKS != nil {
		jwksMu.RUnlock()
		return nil
	}
	jwksMu.RUnlock()

	refreshMu.Lock()
	defer refreshMu.Unlock()

	// Double-check after acquiring write lock
	jwksMu.RLock()
	if globalJWKS != nil {
		jwksMu.RUnlock()
		return nil
	}
	jwksMu.RUnlock()

	k, err := keyfunc.Get(jwksURL, keyfunc.Options{
		RefreshInterval: 10 * time.Minute,
	})
	if err != nil {
		return err
	}
	jwksMu.Lock()
	globalJWKS = k
	jwksMu.Unlock()
	return nil
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenStr == authHeader {
			http.Error(w, `{"error":"invalid authorization format"}`, http.StatusUnauthorized)
			return
		}

		if err := ensureJWKS(); err != nil {
			log.Printf("JWKS error: %v", err)
			http.Error(w, `{"error":"authentication service unavailable"}`, http.StatusServiceUnavailable)
			return
		}

		jwksMu.RLock()
		jwks := globalJWKS
		jwksMu.RUnlock()

		token, err := jwt.ParseWithClaims(tokenStr, &ClerkClaims{}, jwks.Keyfunc)
		if err != nil {
			log.Printf("JWT error: %v", err)
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(*ClerkClaims)
		if !ok || !token.Valid {
			http.Error(w, `{"error":"invalid token claims"}`, http.StatusUnauthorized)
			return
		}

		// Verify issuer
		if claims.Issuer != jwksIssuer {
			http.Error(w, `{"error":"invalid token issuer"}`, http.StatusUnauthorized)
			return
		}

		// Verify audience
		validAud := false
		for _, aud := range claims.Audience {
			if aud == jwksAudience {
				validAud = true
				break
			}
		}
		if !validAud {
			http.Error(w, `{"error":"invalid token audience"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.Subject)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserID(r *http.Request) string {
	if uid, ok := r.Context().Value(UserIDKey).(string); ok {
		return uid
	}
	return ""
}
