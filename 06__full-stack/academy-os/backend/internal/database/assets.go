package database

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Asset struct {
	ID                 uuid.UUID  `json:"id"`
	ObjectKey          string     `json:"objectKey"`
	OriginalFilename   string     `json:"originalFilename"`
	ContentType        string     `json:"contentType"`
	Status             string     `json:"status"`
	ProcessingAttempts int        `json:"processingAttempts"`
	LastStartedAt      *time.Time `json:"lastStartedAt"`
	FailedAt           *time.Time `json:"failedAt"`
	OutputPrefix       *string    `json:"outputPrefix"`
	MasterPlaylistKey  *string    `json:"masterPlaylistKey"`
	ErrorMessage       *string    `json:"errorMessage"`
	ProcessedAt        *time.Time `json:"processedAt"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type AssetRepository struct {
	db *pgxpool.Pool
}

func NewAssetRepository(db *pgxpool.Pool) *AssetRepository {
	return &AssetRepository{
		db: db,
	}
}

func (r *AssetRepository) Create(
	ctx context.Context,
	objectKey string,
	filename string,
	contentType string,
) (Asset, error) {
	id := uuid.New()

	var asset Asset

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO assets (
			id,
			object_key,
			original_filename,
			content_type,
			status
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, object_key, original_filename, content_type, status, processing_attempts, created_at, updated_at
		`,
		id,
		objectKey,
		filename,
		contentType,
		AssetStatusPending,
	).Scan(
		&asset.ID,
		&asset.ObjectKey,
		&asset.OriginalFilename,
		&asset.ContentType,
		&asset.Status,
		&asset.ProcessingAttempts,
		&asset.CreatedAt,
		&asset.UpdatedAt,
	)

	if err != nil {
		return Asset{}, fmt.Errorf("create asset: %w", err)
	}

	return asset, nil
}

func (r *AssetRepository) GetByID(
	ctx context.Context,
	id uuid.UUID,
) (Asset, error) {
	var asset Asset
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, object_key, original_filename, content_type, status,
		       processing_attempts, last_started_at, failed_at,
		       output_prefix, master_playlist_key, error_message, processed_at,
		       created_at, updated_at
		FROM assets
		WHERE id = $1
		`,
		id,
	).Scan(
		&asset.ID,
		&asset.ObjectKey,
		&asset.OriginalFilename,
		&asset.ContentType,
		&asset.Status,
		&asset.ProcessingAttempts,
		&asset.LastStartedAt,
		&asset.FailedAt,
		&asset.OutputPrefix,
		&asset.MasterPlaylistKey,
		&asset.ErrorMessage,
		&asset.ProcessedAt,
		&asset.CreatedAt,
		&asset.UpdatedAt,
	)

	if err != nil {
		return Asset{}, fmt.Errorf("get asset by id: %w", err)
	}

	return asset, nil
}

func (r *AssetRepository) TransitionStatus(
	ctx context.Context,
	id uuid.UUID,
	from string,
	to string,
) error {
	if err := ValidateStatusTransition(from, to); err != nil {
		return err
	}

	result, err := r.db.Exec(
		ctx,
		`
		UPDATE assets
		SET status = $1,
		    updated_at = NOW()
		WHERE id = $2
		  AND status = $3
		`,
		to,
		id,
		from,
	)

	if err != nil {
		return fmt.Errorf("transition asset status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf(
			"asset %s was not in expected state %s",
			id,
			from,
		)
	}

	return nil
}

func (r *AssetRepository) StartProcessing(
	ctx context.Context,
	id uuid.UUID,
) error {
	result, err := r.db.Exec(
		ctx,
		`
		UPDATE assets
		SET status = 'processing',
		    processing_attempts = processing_attempts + 1,
		    last_started_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1
		  AND status = 'queued'
		`,
		id,
	)

	if err != nil {
		return fmt.Errorf("start processing: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf(
			"asset %s is not queued",
			id,
		)
	}

	return nil
}

func (r *AssetRepository) MarkReady(
	ctx context.Context,
	id uuid.UUID,
	outputPrefix string,
	masterPlaylistKey string,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		UPDATE assets
		SET status = $1,
		    output_prefix = $2,
		    master_playlist_key = $3,
		    processed_at = NOW(),
		    updated_at = NOW()
		WHERE id = $4
		`,
		AssetStatusReady,
		outputPrefix,
		masterPlaylistKey,
		id,
	)

	if err != nil {
		return fmt.Errorf("mark asset ready: %w", err)
	}

	return nil
}

func (r *AssetRepository) MarkFailed(
	ctx context.Context,
	id uuid.UUID,
	errMsg string,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		UPDATE assets
		SET status = $1,
		    error_message = $2,
		    failed_at = NOW(),
		    updated_at = NOW()
		WHERE id = $3
		`,
		AssetStatusFailed,
		errMsg,
		id,
	)

	if err != nil {
		return fmt.Errorf("mark asset failed: %w", err)
	}

	return nil
}
