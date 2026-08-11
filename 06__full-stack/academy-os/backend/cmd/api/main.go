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

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		_ = json.NewEncoder(w).Encode(HealthResponse{
			Status: "ok",
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