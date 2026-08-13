package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
)

type Rendition struct {
	Name         string
	Width        int
	Height       int
	Bitrate      string
	AudioBitrate string
	Bandwidth    int
}

var renditionProfiles = []Rendition{
	{Name: "360p", Width: 640, Height: 360, Bitrate: "800k", AudioBitrate: "96k", Bandwidth: 900000},
	{Name: "480p", Width: 854, Height: 480, Bitrate: "1400k", AudioBitrate: "128k", Bandwidth: 1500000},
	{Name: "720p", Width: 1280, Height: 720, Bitrate: "2800k", AudioBitrate: "128k", Bandwidth: 3000000},
	{Name: "1080p", Width: 1920, Height: 1080, Bitrate: "5000k", AudioBitrate: "192k", Bandwidth: 5500000},
	{Name: "2160p", Width: 3840, Height: 2160, Bitrate: "12000k", AudioBitrate: "256k", Bandwidth: 13000000},
}

type Worker struct {
	logger  *slog.Logger
	assets  *database.AssetRepository
	storage storage.ObjectStorage
	queue   jobs.Queue
}

func New(
	logger *slog.Logger,
	assets *database.AssetRepository,
	storage storage.ObjectStorage,
	queue jobs.Queue,
) *Worker {
	if logger == nil {
		logger = slog.Default()
	}
	return &Worker{
		logger:  logger,
		assets:  assets,
		storage: storage,
		queue:   queue,
	}
}

func (w *Worker) Run(ctx context.Context) error {
	w.logger.Info("AcademyOS video worker initialized, listening for jobs")

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("worker context cancelled, stopping worker loop")
			return ctx.Err()
		default:
			job, err := w.queue.Consume(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return ctx.Err()
				}
				w.logger.Error("failed to consume job from queue", "error", err)
				time.Sleep(time.Second)
				continue
			}

			if err := w.handleJob(ctx, job); err != nil {
				w.logger.Error("job processing failed", "jobType", job.Type, "error", err)
			}
		}
	}
}

func (w *Worker) handleJob(ctx context.Context, job jobs.Job) error {
	w.logger.Info("received job", "type", job.Type)

	var payload struct {
		AssetID   string `json:"asset_id"`
		TenantID  string `json:"tenant_id"`
		CourseID  string `json:"course_id"`
		LessonID  string `json:"lesson_id"`
		ObjectKey string `json:"object_key"`
		// Fallbacks for alternate key names
		AssetId   string `json:"assetId"`
		ObjectKey2 string `json:"objectKey"`
	}

	if err := json.Unmarshal(job.Data, &payload); err != nil {
		return fmt.Errorf("unmarshal job payload: %w", err)
	}

	assetIDStr := payload.AssetID
	if assetIDStr == "" {
		assetIDStr = payload.AssetId
	}
	if assetIDStr == "" {
		return fmt.Errorf("missing asset_id in job payload")
	}

	assetID, err := uuid.Parse(assetIDStr)
	if err != nil {
		return fmt.Errorf("invalid asset_id UUID: %w", err)
	}

	return w.ProcessVideoAsset(ctx, assetID, payload.TenantID, payload.CourseID, payload.LessonID, payload.ObjectKey)
}

type ffprobeStream struct {
	Width    int    `json:"width"`
	Height   int    `json:"height"`
	Duration string `json:"duration"`
}

type ffprobeFormat struct {
	Duration string `json:"duration"`
}

type ffprobeOutput struct {
	Streams []ffprobeStream `json:"streams"`
	Format  ffprobeFormat   `json:"format"`
}

func (w *Worker) ProcessVideoAsset(
	ctx context.Context,
	assetID uuid.UUID,
	tenantIDStr, courseIDStr, lessonIDStr, rawObjectKey string,
) error {
	w.logger.Info("starting video processing", "assetID", assetID)

	// Fetch asset from DB
	asset, err := w.assets.GetByID(ctx, assetID)
	if err != nil {
		return fmt.Errorf("fetch asset %s: %w", assetID, err)
	}

	// Update asset status to processing
	if err := w.assets.MarkProcessing(ctx, assetID); err != nil {
		w.logger.Warn("could not mark processing (may already be processing)", "assetID", assetID, "error", err)
	}

	objectKey := asset.OriginalKey
	if objectKey == "" {
		objectKey = asset.ObjectKey
	}
	if objectKey == "" {
		objectKey = rawObjectKey
	}
	if objectKey == "" {
		errMsg := "asset missing original_key / object_key"
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	// Create isolated per-job workspace
	workspace, err := os.MkdirTemp("", fmt.Sprintf("academy-%s-", assetID.String()))
	if err != nil {
		errMsg := fmt.Sprintf("create workspace: %v", err)
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}
	defer os.RemoveAll(workspace)

	inputPath := filepath.Join(workspace, "original.mp4")
	outputDir := filepath.Join(workspace, "output")

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		errMsg := fmt.Sprintf("create output dir: %v", err)
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	// Download original video from Garage storage
	w.logger.Info("downloading original video", "objectKey", objectKey, "destination", inputPath)
	if err := w.storage.Download(ctx, objectKey, inputPath); err != nil {
		errMsg := fmt.Sprintf("download original video failed: %v", err)
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	// Inspect video with ffprobe
	w.logger.Info("running ffprobe on original video", "inputPath", inputPath)
	probeCmd := exec.CommandContext(
		ctx,
		"ffprobe",
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "stream=width,height,duration:format=duration",
		"-of", "json",
		inputPath,
	)

	var probeStdout, probeStderr bytes.Buffer
	probeCmd.Stdout = &probeStdout
	probeCmd.Stderr = &probeStderr

	if err := probeCmd.Run(); err != nil {
		errMsg := fmt.Sprintf("ffprobe failed: %v, stderr: %s", err, probeStderr.String())
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	var probeRes ffprobeOutput
	if err := json.Unmarshal(probeStdout.Bytes(), &probeRes); err != nil {
		errMsg := fmt.Sprintf("parse ffprobe JSON output: %v", err)
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	sourceWidth := 1920
	sourceHeight := 1080
	var durationSec float64

	if len(probeRes.Streams) > 0 {
		if probeRes.Streams[0].Width > 0 {
			sourceWidth = probeRes.Streams[0].Width
		}
		if probeRes.Streams[0].Height > 0 {
			sourceHeight = probeRes.Streams[0].Height
		}
		if probeRes.Streams[0].Duration != "" {
			durationSec, _ = strconv.ParseFloat(probeRes.Streams[0].Duration, 64)
		}
	}
	if durationSec == 0 && probeRes.Format.Duration != "" {
		durationSec, _ = strconv.ParseFloat(probeRes.Format.Duration, 64)
	}

	w.logger.Info("source video inspected",
		"width", sourceWidth,
		"height", sourceHeight,
		"durationSeconds", int(durationSec),
	)

	// Determine matching renditions without upscaling
	targetRenditions := selectRenditions(sourceHeight)
	w.logger.Info("selected renditions for encoding", "count", len(targetRenditions))

	// Transcode each rendition with FFmpeg
	var activeRenditions []Rendition
	for _, rend := range targetRenditions {
		rendDir := filepath.Join(outputDir, rend.Name)
		if err := os.MkdirAll(rendDir, 0755); err != nil {
			errMsg := fmt.Sprintf("mkdir rendition %s: %v", rend.Name, err)
			_ = w.assets.MarkFailed(ctx, assetID, errMsg)
			return fmt.Errorf("%s", errMsg)
		}

		m3u8Path := filepath.Join(rendDir, "index.m3u8")
		segmentPattern := filepath.Join(rendDir, "segment_%03d.ts")

		w.logger.Info("encoding rendition with ffmpeg", "rendition", rend.Name, "scaleHeight", rend.Height)

		ffmpegCmd := exec.CommandContext(
			ctx,
			"ffmpeg",
			"-y",
			"-i", inputPath,
			"-vf", fmt.Sprintf("scale=-2:%d", rend.Height),
			"-c:v", "libx264",
			"-b:v", rend.Bitrate,
			"-c:a", "aac",
			"-b:a", rend.AudioBitrate,
			"-hls_time", "6",
			"-hls_playlist_type", "vod",
			"-hls_segment_filename", segmentPattern,
			m3u8Path,
		)

		var ffmpegStderr bytes.Buffer
		ffmpegCmd.Stderr = &ffmpegStderr

		if err := ffmpegCmd.Run(); err != nil {
			w.logger.Error("ffmpeg rendition encoding failed", "rendition", rend.Name, "stderr", ffmpegStderr.String(), "error", err)
			continue
		}

		activeRenditions = append(activeRenditions, rend)
	}

	if len(activeRenditions) == 0 {
		errMsg := "all FFmpeg rendition encodings failed"
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	// Generate master.m3u8
	masterPath := filepath.Join(outputDir, "master.m3u8")
	if err := generateMasterPlaylist(masterPath, activeRenditions); err != nil {
		errMsg := fmt.Sprintf("generate master playlist: %v", err)
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	// Construct HLS S3 destination path with tenant isolation
	// Pattern: tenants/{tenantID}/courses/{courseID}/lessons/{lessonID}/hls/master.m3u8
	var hlsPrefix string
	if tenantIDStr != "" && courseIDStr != "" && lessonIDStr != "" {
		hlsPrefix = fmt.Sprintf("tenants/%s/courses/%s/lessons/%s/hls", tenantIDStr, courseIDStr, lessonIDStr)
	} else if parts := strings.Split(objectKey, "/"); len(parts) >= 5 && (parts[0] == "tenants" || parts[0] == "uploads") {
		hlsPrefix = fmt.Sprintf("tenants/%s/courses/%s/lessons/%s/hls", parts[1], parts[2], parts[3])
	} else {
		hlsPrefix = fmt.Sprintf("tenants/default/hls/%s", assetID.String())
	}

	masterManifestKey := fmt.Sprintf("%s/master.m3u8", hlsPrefix)
	w.logger.Info("uploading HLS outputs to storage", "hlsPrefix", hlsPrefix)

	// Walk and upload all output files
	err = filepath.Walk(outputDir, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(outputDir, path)
		if err != nil {
			return err
		}

		destKey := filepath.ToSlash(filepath.Join(hlsPrefix, relPath))
		contentType := "application/octet-stream"

		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".m3u8" {
			contentType = "application/vnd.apple.mpegurl"
		} else if ext == ".ts" {
			contentType = "video/mp2t"
		}

		return w.storage.UploadFile(ctx, destKey, path, contentType)
	})

	if err != nil {
		errMsg := fmt.Sprintf("upload HLS files: %v", err)
		_ = w.assets.MarkFailed(ctx, assetID, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	// Update asset status to ready in database
	durationInt := int(durationSec)
	w.logger.Info("marking asset ready in database", "assetID", assetID, "hlsManifestKey", masterManifestKey, "durationSeconds", durationInt)
	if err := w.assets.MarkReady(ctx, assetID, hlsPrefix, masterManifestKey); err != nil {
		// Also update hls_manifest_key & duration_seconds via direct SQL if needed
		w.logger.Error("error calling MarkReady", "error", err)
	}

	w.logger.Info("video asset processing completed successfully", "assetID", assetID)
	return nil
}

func selectRenditions(sourceHeight int) []Rendition {
	var selected []Rendition
	for _, r := range renditionProfiles {
		if r.Height <= sourceHeight || len(selected) == 0 {
			selected = append(selected, r)
		}
	}
	return selected
}

func generateMasterPlaylist(masterPath string, renditions []Rendition) error {
	var sb strings.Builder
	sb.WriteString("#EXTM3U\n#EXT-X-VERSION:3\n\n")

	for _, r := range renditions {
		sb.WriteString(fmt.Sprintf("#EXT-X-STREAM-INF:BANDWIDTH=%d,RESOLUTION=%dx%d\n", r.Bandwidth, r.Width, r.Height))
		sb.WriteString(fmt.Sprintf("%s/index.m3u8\n\n", r.Name))
	}

	return os.WriteFile(masterPath, []byte(sb.String()), 0644)
}
