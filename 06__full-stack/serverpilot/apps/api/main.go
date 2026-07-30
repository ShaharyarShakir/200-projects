package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/config"
	"github.com/ShaharyarShakir/serverpilot/apps/api/database"
	"github.com/ShaharyarShakir/serverpilot/apps/api/handlers"
	"github.com/ShaharyarShakir/serverpilot/apps/api/middleware"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
	"github.com/gorilla/mux"
)

func main() {
	log.Println("Starting ServerPilot API...")

	// 1. Load config
	cfg := config.LoadConfig()

	// 2. Connect DB
	db, err := database.Connect(cfg.DBURL, cfg.DBAuthToken)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// 3. Run Migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	// 4. Repositories
	userRepo := repository.NewUserRepository(db)
	tokenRepo := repository.NewTokenRepository(db)

	// 5. Services
	authService := services.NewAuthService(userRepo, tokenRepo, cfg.JWTAccessSecret, cfg.JWTRefreshSecret)

	// 6. Handlers
	authHandler := handlers.NewAuthHandler(authService)

	// 7. Router setup
	router := mux.NewRouter()

	// Global Middlewares (Executed in order)
	router.Use(middleware.RequestID)
	router.Use(middleware.CORS(cfg.AllowedOrigin)) // CORS needs to run early to handle OPTIONS
	router.Use(middleware.Logger)
	router.Use(middleware.Recovery)
	router.Use(middleware.Auth(cfg.JWTAccessSecret))

	// Routes
	api := router.PathPrefix("/api").Subrouter()

	// Public Auth routes
	authRouter := api.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/register", authHandler.Register).Methods("POST", "OPTIONS")
	authRouter.HandleFunc("/login", authHandler.Login).Methods("POST", "OPTIONS")
	authRouter.HandleFunc("/logout", authHandler.Logout).Methods("POST", "OPTIONS")
	authRouter.HandleFunc("/refresh", authHandler.Refresh).Methods("POST", "OPTIONS")

	// Protected routes subrouter
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.Authenticate)
	protected.HandleFunc("/auth/me", authHandler.Me).Methods("GET", "OPTIONS")

	// Start server with graceful shutdown
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      router,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server listening on http://localhost%s", serverAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server ListenAndServe failed: %v", err)
		}
	}()

	// Graceful shutdown channel listening
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("Shutting down server gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	log.Println("ServerPilot API stopped")
}
