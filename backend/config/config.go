package config

import (
	"os"
)

type Config struct {
	Port                 string
	MongoURI             string
	MongoDB              string
	ClerkJWKSUrl        string
	ClerkIssuer          string
	ClerkAudience        string
	AllowedOrigins       string
}

func Load() *Config {
	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		MongoURI:        getEnv("MONGODB_URI", ""),
		MongoDB:         getEnv("MONGODB_DB", "befit"),
		ClerkIssuer:     getEnv("CLERK_JWT_ISSUER_DEV", "https://great-quail-7.clerk.accounts.dev"),
		ClerkAudience:   getEnv("CLERK_JWT_AUDIENCE", "backend"),
		AllowedOrigins:  getEnv("ALLOWED_ORIGINS", "*"),
	}
	cfg.ClerkJWKSUrl = cfg.ClerkIssuer + "/.well-known/jwks.json"
	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
