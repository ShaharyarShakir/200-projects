package main

import (
	"context"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"

	"github.com/ShaharyarShakir/academy-os/internal/cache"
	"github.com/ShaharyarShakir/academy-os/internal/config"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
	videoworker "github.com/ShaharyarShakir/academy-os/internal/video/worker"
)

func main() {
	_ = godotenv.Load("../.env", ".env")

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.Load()
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	logger.Info("starting video worker service")

	db, err := database.NewPostgres(ctx, cfg.Postgres)
	if err != nil {
		log.Fatalf("postgres initialization failed: %v", err)
	}
	defer db.Close()

	redisClient, err := cache.NewRedis(ctx, cfg.Redis)
	if err != nil {
		log.Fatalf("redis initialization failed: %v", err)
	}
	defer redisClient.Close()

	s3Service, err := storage.NewS3(ctx, cfg.S3)
	if err != nil {
		log.Fatalf("S3 initialization failed: %v", err)
	}

	assetRepo := database.NewAssetRepository(db)
	jobQueue := jobs.NewQueue(redisClient)

	w := videoworker.New(
		logger,
		assetRepo,
		s3Service,
		jobQueue,
	)

	if err := w.Run(ctx); err != nil && ctx.Err() == nil {
		logger.Error("video worker terminated with error", "error", err)
		os.Exit(1)
	}

	logger.Info("video worker service shut down cleanly")
}
