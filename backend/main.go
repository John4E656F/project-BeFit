package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/John4E656F/project-BeFit/backend/config"
	"github.com/John4E656F/project-BeFit/backend/database"
	"github.com/John4E656F/project-BeFit/backend/handlers"
	"github.com/John4E656F/project-BeFit/backend/middleware"
	"github.com/joho/godotenv"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("🏋️ project-BeFit backend starting...")

	// Load .env file — check current dir, then backend/ subdir
	envErr := godotenv.Load()
	if envErr != nil {
		envErr = godotenv.Load("backend/.env")
	}
	if envErr != nil {
		log.Println("⚠️ No .env file found, using environment variables")
	}

	// Load config
	cfg := config.Load()

	// Connect to MongoDB
	if err := database.Connect(cfg.MongoURI, cfg.MongoDB); err != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v", err)
	}
	defer database.Disconnect()

	// Initialize Clerk JWT auth
	if err := middleware.InitAuth(cfg.ClerkJWKSUrl, cfg.ClerkIssuer, cfg.ClerkAudience); err != nil {
		log.Fatalf("❌ Failed to init Clerk auth: %v", err)
	}
	log.Println("✅ Clerk JWT auth initialized")

	// Set up routes
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("GET /api/health", handlers.HealthCheck)

	// Protected routes — wrap with auth middleware
	mux.Handle("GET /api/profile", middleware.AuthMiddleware(http.HandlerFunc(NewUserHandler().GetProfile)))
	mux.Handle("PUT /api/profile", middleware.AuthMiddleware(http.HandlerFunc(NewUserHandler().UpdateProfile)))

	workoutHandler := handlers.NewWorkoutHandler()
	mux.Handle("GET /api/workouts", middleware.AuthMiddleware(http.HandlerFunc(workoutHandler.List)))
	mux.Handle("POST /api/workouts", middleware.AuthMiddleware(http.HandlerFunc(workoutHandler.Create)))
	mux.Handle("GET /api/workouts/{id}", middleware.AuthMiddleware(http.HandlerFunc(workoutHandler.Get)))
	mux.Handle("PUT /api/workouts/{id}", middleware.AuthMiddleware(http.HandlerFunc(workoutHandler.Update)))
	mux.Handle("DELETE /api/workouts/{id}", middleware.AuthMiddleware(http.HandlerFunc(workoutHandler.Delete)))

	// CORS middleware wrapper
	handler := corsMiddleware(mux)

	// Start server
	addr := ":" + cfg.Port
	server := &http.Server{
		Addr:    addr,
		Handler: handler,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("🛑 Shutting down...")
		server.Close()
	}()

	log.Printf("🚀 Server listening on %s", addr)
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("❌ Server error: %v", err)
	}
	log.Println("👋 Server stopped")
}

func NewUserHandler() *handlers.UserHandler {
	return handlers.NewUserHandler()
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}