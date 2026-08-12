package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/ShaharyarShakir/academy-os/internal/cache"
	"github.com/ShaharyarShakir/academy-os/internal/config"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	httpapi "github.com/ShaharyarShakir/academy-os/internal/http"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
	"github.com/joho/godotenv"
)

type HealthResponse struct {
	Status string `json:"status"`
}

type ReadinessResponse struct {
	Status       string            `json:"status"`
	Dependencies map[string]string `json:"dependencies"`
}

func main() {
	_ = godotenv.Load("../.env", ".env")

	cfg := config.Load()

	ctx := context.Background()

	db, err := database.NewPostgres(ctx, cfg.Postgres)
	if err != nil {
		log.Fatalf("database initialization failed: %v", err)
	}
	defer db.Close()

	redis, err := cache.NewRedis(ctx, cfg.Redis)
	if err != nil {
		log.Fatalf("redis initialization failed: %v", err)
	}
	defer redis.Close()

	s3Service, err := storage.NewS3(ctx, cfg.S3)
	if err != nil {
		log.Fatalf("S3 initialization failed: %v", err)
	}

	if err := storage.TestConnection(ctx, s3Service); err != nil {
		log.Fatalf("S3 connection failed: %v", err)
	}

	log.Println("S3 connection established")

	assetRepo := database.NewAssetRepository(db)
	jobQueue := jobs.NewQueue(redis)
	uploadHandler := httpapi.NewUploadHandler(s3Service, assetRepo, jobQueue)

	mux := http.NewServeMux()

	// Process Liveness Check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(HealthResponse{
			Status: "ok",
		})
	})

	// Service Readiness Check
	mux.HandleFunc("GET /health/ready", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		deps := map[string]string{
			"postgres": "ok",
			"redis":    "ok",
			"storage":  "ok",
		}
		allOk := true

		if err := db.Ping(r.Context()); err != nil {
			deps["postgres"] = "error: " + err.Error()
			allOk = false
		}

		if err := redis.Ping(r.Context()).Err(); err != nil {
			deps["redis"] = "error: " + err.Error()
			allOk = false
		}

		if err := storage.TestConnection(r.Context(), s3Service); err != nil {
			deps["storage"] = "error: " + err.Error()
			allOk = false
		}

		status := "ok"
		statusCode := http.StatusOK
		if !allOk {
			status = "degraded"
			statusCode = http.StatusServiceUnavailable
		}

		w.WriteHeader(statusCode)
		_ = json.NewEncoder(w).Encode(ReadinessResponse{
			Status:       status,
			Dependencies: deps,
		})
	})

	mux.HandleFunc("POST /api/uploads/presign", uploadHandler.Presign)
	mux.HandleFunc("POST /api/uploads/{assetID}/complete", uploadHandler.Complete)

	port := cfg.Server.Port

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("AcademyOS API listening on :%s", port)

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}

	_ = os.Stdout
}