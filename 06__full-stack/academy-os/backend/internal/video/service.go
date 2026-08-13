package video

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
)

type Service struct {
	assets   *database.AssetRepository
	courses  *database.CourseRepository
	sections *database.SectionRepository
	lessons  *database.LessonRepository
	storage  storage.ObjectStorage
	jobs     jobs.Queue
}

func NewService(
	assets *database.AssetRepository,
	courses *database.CourseRepository,
	sections *database.SectionRepository,
	lessons *database.LessonRepository,
	storage storage.ObjectStorage,
	queue jobs.Queue,
) *Service {
	return &Service{
		assets:   assets,
		courses:  courses,
		sections: sections,
		lessons:  lessons,
		storage:  storage,
		jobs:     queue,
	}
}

type CreateUploadRequest struct {
	CourseID  uuid.UUID `json:"course_id"`
	SectionID uuid.UUID `json:"section_id"`
	LessonID  uuid.UUID `json:"lesson_id"`
	Filename  string    `json:"filename"`
	MimeType  string    `json:"mime_type"`
}

type CreateUploadResponse struct {
	AssetID   uuid.UUID `json:"asset_id"`
	UploadURL string    `json:"upload_url"`
	Status    string    `json:"status"`
}

func (s *Service) CreateUpload(
	ctx context.Context,
	tenantID uuid.UUID,
	req CreateUploadRequest,
) (CreateUploadResponse, error) {
	course, err := s.courses.Find(ctx, tenantID, req.CourseID)
	if err != nil {
		return CreateUploadResponse{}, fmt.Errorf("course not found: %w", err)
	}

	section, err := s.sections.Find(ctx, req.SectionID)
	if err != nil {
		return CreateUploadResponse{}, fmt.Errorf("section not found: %w", err)
	}
	if section.CourseID != course.ID {
		return CreateUploadResponse{}, fmt.Errorf("section does not belong to course")
	}

	lesson, err := s.lessons.Find(ctx, req.LessonID)
	if err != nil {
		return CreateUploadResponse{}, fmt.Errorf("lesson not found: %w", err)
	}
	if lesson.SectionID != section.ID {
		return CreateUploadResponse{}, fmt.Errorf("lesson does not belong to section")
	}

	assetID := uuid.New()

	ext := filepath.Ext(req.Filename)
	if ext == "" {
		ext = ".mp4"
	}

	actualAcademyID := course.AcademyID
	if actualAcademyID == uuid.Nil {
		actualAcademyID = tenantID
	}

	objectKey := fmt.Sprintf(
		"academies/%s/courses/%s/lessons/%s/%s/original%s",
		actualAcademyID.String(),
		req.CourseID.String(),
		req.LessonID.String(),
		assetID.String(),
		ext,
	)

	asset, err := s.assets.CreateWithID(
		ctx,
		assetID,
		objectKey,
		req.Filename,
		req.MimeType,
	)
	if err != nil {
		return CreateUploadResponse{}, fmt.Errorf("create asset: %w", err)
	}

	if err := s.lessons.AttachVideoAsset(ctx, req.LessonID, assetID); err != nil {
		return CreateUploadResponse{}, fmt.Errorf("attach video asset: %w", err)
	}

	uploadURL, err := s.storage.PresignUpload(ctx, objectKey, req.MimeType)
	if err != nil {
		return CreateUploadResponse{}, fmt.Errorf("presign upload: %w", err)
	}

	return CreateUploadResponse{
		AssetID:   asset.ID,
		UploadURL: uploadURL,
		Status:    asset.Status,
	}, nil
}

func (s *Service) CompleteUpload(
	ctx context.Context,
	tenantID uuid.UUID,
	assetID uuid.UUID,
) error {
	asset, err := s.assets.GetByID(ctx, assetID)
	if err != nil {
		return fmt.Errorf("asset not found: %w", err)
	}

	exists, err := s.storage.Exists(ctx, asset.ObjectKey)
	if err != nil {
		return fmt.Errorf("check object storage: %w", err)
	}
	if !exists {
		return fmt.Errorf("uploaded file not found in storage")
	}

	if err := s.assets.MarkProcessing(ctx, assetID); err != nil {
		return fmt.Errorf("mark processing: %w", err)
	}

	jobData, err := json.Marshal(map[string]string{
		"asset_id":   assetID.String(),
		"tenant_id":  tenantID.String(),
		"object_key": asset.ObjectKey,
	})
	if err != nil {
		return fmt.Errorf("marshal job data: %w", err)
	}

	if err := s.jobs.Enqueue(ctx, jobs.Job{
		Type: jobs.JobVideoProcess,
		Data: jobData,
	}); err != nil {
		return fmt.Errorf("enqueue job: %w", err)
	}

	return nil
}

func (s *Service) GetAsset(
	ctx context.Context,
	tenantID uuid.UUID,
	assetID uuid.UUID,
) (database.Asset, error) {
	return s.assets.GetByID(ctx, assetID)
}

func (s *Service) DirectUpload(
	ctx context.Context,
	tenantID uuid.UUID,
	assetID uuid.UUID,
	body io.Reader,
	contentType string,
) error {
	asset, err := s.assets.GetByID(ctx, assetID)
	if err != nil {
		return fmt.Errorf("asset not found: %w", err)
	}

	if contentType == "" {
		contentType = asset.MimeType
	}

	if err := s.storage.Put(ctx, asset.ObjectKey, body, contentType); err != nil {
		return fmt.Errorf("upload to storage failed: %w", err)
	}

	return nil
}

func (s *Service) GetStreamURL(
	ctx context.Context,
	tenantID uuid.UUID,
	assetID uuid.UUID,
) (string, error) {
	asset, err := s.assets.GetByID(ctx, assetID)
	if err != nil {
		return "", fmt.Errorf("asset not found: %w", err)
	}

	if asset.Status != database.AssetStatusReady {
		return "", fmt.Errorf("asset is not ready")
	}

	manifestKey := ""
	if asset.MasterPlaylistKey != nil && *asset.MasterPlaylistKey != "" {
		manifestKey = *asset.MasterPlaylistKey
	} else if asset.HLSManifestKey != nil && *asset.HLSManifestKey != "" {
		manifestKey = *asset.HLSManifestKey
	} else if asset.OutputPrefix != nil {
		manifestKey = *asset.OutputPrefix + "/master.m3u8"
	}

	if manifestKey == "" {
		return "", fmt.Errorf("manifest key not available")
	}

	return s.storage.PresignDownload(ctx, manifestKey)
}


