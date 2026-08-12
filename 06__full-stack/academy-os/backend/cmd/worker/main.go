package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/ShaharyarShakir/academy-os/internal/cache"
	"github.com/ShaharyarShakir/academy-os/internal/config"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/processor"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

const maxAttempts = 3

func main() {
	_ = godotenv.Load("../.env", ".env")

	cfg := config.Load()
	ctx := context.Background()

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

	storageService, err := storage.NewS3(ctx, cfg.S3)
	if err != nil {
		log.Fatalf("S3 initialization failed: %v", err)
	}

	repository := database.NewAssetRepository(db)
	jobQueue := jobs.NewQueue(redisClient)
	videoProcessor := processor.New()

	log.Println("AcademyOS video worker started")

	for {
		result, err := redisClient.BRPop(
			ctx,
			0,
			jobs.VideoProcessingQueue,
		).Result()

		if err != nil {
			log.Printf("queue error: %v", err)
			time.Sleep(time.Second)
			continue
		}

		if len(result) != 2 {
			continue
		}

		var job jobs.VideoProcessingJob

		if err := json.Unmarshal(
			[]byte(result[1]),
			&job,
		); err != nil {
			log.Printf("invalid job payload: %v", err)
			continue
		}

		assetID, err := uuid.Parse(job.AssetID)
		if err != nil {
			log.Printf("invalid asset UUID %s: %v", job.AssetID, err)
			continue
		}

		// Concurrency guard & attempt tracking
		if err := repository.StartProcessing(ctx, assetID); err != nil {
			log.Printf("skipping job for asset %s: %v", job.AssetID, err)
			continue
		}

		if err := processVideo(
			ctx,
			job,
			repository,
			storageService,
			videoProcessor,
		); err != nil {
			asset, fetchErr := repository.GetByID(ctx, assetID)
			attempts := 0
			if fetchErr == nil {
				attempts = asset.ProcessingAttempts
			}

			if attempts < maxAttempts {
				log.Printf("video processing failed for asset %s (attempt %d/%d), re-queueing: %v", job.AssetID, attempts, maxAttempts, err)
				_ = repository.MarkFailed(ctx, assetID, err.Error())
				if transitionErr := repository.TransitionStatus(ctx, assetID, database.AssetStatusFailed, database.AssetStatusQueued); transitionErr == nil {
					_ = jobQueue.EnqueueVideoProcessing(ctx, job)
				}
			} else {
				log.Printf("video processing failed permanently for asset %s after %d attempts: %v", job.AssetID, attempts, err)
				_ = repository.MarkFailed(ctx, assetID, fmt.Sprintf("failed after %d attempts: %v", attempts, err))
			}
		}
	}
}

func processVideo(
	ctx context.Context,
	job jobs.VideoProcessingJob,
	repository *database.AssetRepository,
	storageService *storage.Service,
	videoProcessor *processor.Processor,
) error {
	assetID, err := uuid.Parse(job.AssetID)
	if err != nil {
		return err
	}

	workDir := filepath.Join(
		os.TempDir(),
		"academy-os",
		job.AssetID,
	)

	// Pre-processing idempotency: clear workDir if it exists from a previous attempt
	_ = os.RemoveAll(workDir)
	// Guaranteed cleanup on exit
	defer os.RemoveAll(workDir)

	inputDir := filepath.Join(workDir, "input")
	outputDir := filepath.Join(workDir, "output")

	if err := os.MkdirAll(inputDir, 0755); err != nil {
		return fmt.Errorf("create input dir: %w", err)
	}

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}

	inputFile := filepath.Join(inputDir, "original.mp4")

	log.Printf("Downloading %s to %s", job.ObjectKey, inputFile)

	if err := storageService.Download(
		ctx,
		job.ObjectKey,
		inputFile,
	); err != nil {
		return fmt.Errorf("download error: %w", err)
	}

	log.Printf("Starting FFmpeg transcoding for asset %s", job.AssetID)

	if err := videoProcessor.Process(
		ctx,
		inputFile,
		outputDir,
	); err != nil {
		return fmt.Errorf("transcode error: %w", err)
	}

	log.Printf("Uploading HLS output for asset %s", job.AssetID)

	outputPrefix := "videos/" + job.AssetID + "/hls"

	err = filepath.Walk(
		outputDir,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if info.IsDir() {
				return nil
			}

			relativePath, err := filepath.Rel(
				outputDir,
				path,
			)
			if err != nil {
				return err
			}

			objectKey := filepath.ToSlash(
				filepath.Join(
					outputPrefix,
					relativePath,
				),
			)

			contentType := "application/octet-stream"

			if filepath.Ext(path) == ".m3u8" {
				contentType = "application/vnd.apple.mpegurl"
			}

			if filepath.Ext(path) == ".ts" {
				contentType = "video/mp2t"
			}

			return storageService.UploadFile(
				ctx,
				objectKey,
				path,
				contentType,
			)
		},
	)

	if err != nil {
		return fmt.Errorf("upload HLS files error: %w", err)
	}

	masterPlaylistKey := outputPrefix + "/master.m3u8"
	if err := repository.MarkReady(
		ctx,
		assetID,
		outputPrefix,
		masterPlaylistKey,
	); err != nil {
		return fmt.Errorf("mark ready error: %w", err)
	}

	log.Printf("Video processing completed successfully for asset %s", job.AssetID)

	return nil
}
