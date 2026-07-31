package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/config"
	"github.com/ShaharyarShakir/serverpilot/apps/api/container"
	"github.com/ShaharyarShakir/serverpilot/apps/api/logging"
	"github.com/ShaharyarShakir/serverpilot/apps/api/middleware"
	"github.com/gorilla/mux"
)

var startTime time.Time

func main() {
	startTime = time.Now()
	log.Println("Initializing ServerPilot API...")

	// 1. Load config with startup validation
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Configuration loading failed: %v", err)
	}

	// 2. Initialize Structured Logger
	logger := logging.New("serverpilot-api")
	if cfg.IsProduction() {
		logger.SetLevel(logging.LevelInfo)
	} else {
		logger.SetLevel(logging.LevelDebug)
	}

	// 3. Initialize Dependency Container
	appContainer, err := container.NewContainer(cfg, logger)
	if err != nil {
		logger.Error("failed to initialize application container", map[string]any{
			"error": err.Error(),
		})
		log.Fatalf("Application container setup failed: %v", err)
	}
	defer appContainer.Close()

	logger.Info("application container successfully initialized", nil)

	// 4. Router setup
	router := mux.NewRouter()

	// Global Middlewares (Executed in order)
	router.Use(middleware.Recovery(logger)) // Recover first to handle panics
	router.Use(middleware.RequestID)
	
	// Create rate limiter: 20 requests/sec limit, 50 request burst capacity, clean every 10 min
	limiter := middleware.NewRateLimiter(20.0, 50.0, 10*time.Minute)
	router.Use(limiter.Limit)

	router.Use(middleware.CORS(cfg.AllowedOrigin)) // Set CORS headers (preflight OPTIONS returns OK)
	router.Use(middleware.Security)                // Set safety security headers
	router.Use(middleware.BodyLimit(1024 * 1024))   // Max 1MB body payloads
	router.Use(middleware.Timeout(30 * time.Second)) // Request deadline propagation
	router.Use(middleware.Logger(logger))           // Log completed requests
	router.Use(middleware.Auth(cfg.JWTAccessSecret)) // Parse claims from Authorization Bearer token

	// API Router
	api := router.PathPrefix("/api").Subrouter()

	// Public Auth routes
	authRouter := api.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/register", appContainer.AuthHandler.Register).Methods("POST", "OPTIONS")
	authRouter.HandleFunc("/login", appContainer.AuthHandler.Login).Methods("POST", "OPTIONS")
	authRouter.HandleFunc("/logout", appContainer.AuthHandler.Logout).Methods("POST", "OPTIONS")
	authRouter.HandleFunc("/refresh", appContainer.AuthHandler.Refresh).Methods("POST", "OPTIONS")

	// Protected routes subrouter
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.Authenticate)
	protected.HandleFunc("/auth/me", appContainer.AuthHandler.Me).Methods("GET", "OPTIONS")

	// Dashboard & Server management endpoints
	protected.HandleFunc("/dashboard", appContainer.DashboardHandler.GetDashboard).Methods("GET", "OPTIONS")
	protected.HandleFunc("/servers", appContainer.DashboardHandler.GetServers).Methods("GET", "OPTIONS")
	protected.HandleFunc("/servers/create", appContainer.DashboardHandler.CreateServer).Methods("POST", "OPTIONS")
	protected.HandleFunc("/servers/power", appContainer.DashboardHandler.PowerAction).Methods("POST", "OPTIONS")
	protected.HandleFunc("/servers/delete", appContainer.DashboardHandler.BulkDelete).Methods("POST", "OPTIONS")
	protected.HandleFunc("/activity", appContainer.DashboardHandler.GetActivity).Methods("GET", "OPTIONS")
	protected.HandleFunc("/notifications", appContainer.DashboardHandler.GetNotifications).Methods("GET", "OPTIONS")
	protected.HandleFunc("/notifications/read", appContainer.DashboardHandler.MarkRead).Methods("POST", "OPTIONS")

	// Public Observability Routes
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		dbErr := appContainer.DB.Ping()
		
		status := "healthy"
		dbStatus := "connected"
		statusCode := http.StatusOK

		if dbErr != nil {
			status = "unhealthy"
			dbStatus = fmt.Sprintf("disconnected: %v", dbErr)
			statusCode = http.StatusServiceUnavailable
		}

		w.WriteHeader(statusCode)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":         status,
			"database":       dbStatus,
			"uptime_seconds": time.Since(startTime).Seconds(),
			"environment":    cfg.Env,
		})
	}).Methods("GET", "OPTIONS")

	router.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		var ms runtime.MemStats
		runtime.ReadMemStats(&ms)

		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"goroutines":      runtime.NumGoroutine(),
			"memory_alloc_mb": float64(ms.Alloc) / 1024 / 1024,
			"memory_sys_mb":   float64(ms.Sys) / 1024 / 1024,
			"num_cpu":         runtime.NumCPU(),
			"uptime_seconds":  time.Since(startTime).Seconds(),
		})
	}).Methods("GET", "OPTIONS")

	// Start server with graceful shutdown
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      router,
		WriteTimeout: 35 * time.Second,
		ReadTimeout:  15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info(fmt.Sprintf("Server listening on http://localhost%s", serverAddr), nil)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server listener encountered failure", map[string]any{"error": err.Error()})
			log.Fatalf("Server ListenAndServe failed: %v", err)
		}
	}()

	// Graceful shutdown channel listening
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	logger.Info("shutting down server gracefully...", nil)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("graceful server shutdown failed", map[string]any{"error": err.Error()})
		log.Fatalf("Server shutdown failed: %v", err)
	}

	logger.Info("ServerPilot API stopped successfully", nil)
}
