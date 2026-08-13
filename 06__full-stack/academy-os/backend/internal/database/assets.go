package database

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ShaharyarShakir/academy-os/internal/database/dbgen"
)

type Asset struct {
	ID                 uuid.UUID  `json:"id"`
	ObjectKey          string     `json:"objectKey"`
	OriginalKey        string     `json:"originalKey"`
	OriginalFilename   string     `json:"originalFilename"`
	ContentType        string     `json:"contentType"`
	MimeType           string     `json:"mimeType"`
	Status             string     `json:"status"`
	ProcessingAttempts int        `json:"processingAttempts"`
	LastStartedAt      *time.Time `json:"lastStartedAt"`
	FailedAt           *time.Time `json:"failedAt"`
	OutputPrefix       *string    `json:"outputPrefix"`
	MasterPlaylistKey  *string    `json:"masterPlaylistKey"`
	HLSManifestKey     *string    `json:"hlsManifestKey"`
	DurationSeconds    *int       `json:"durationSeconds"`
	ErrorMessage       *string    `json:"errorMessage"`
	ProcessedAt        *time.Time `json:"processedAt"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type AssetRepository struct {
	db *pgxpool.Pool
	q  *dbgen.Queries
}

func NewAssetRepository(db *pgxpool.Pool) *AssetRepository {
	return &AssetRepository{
		db: db,
		q:  dbgen.New(db),
	}
}

func stringPointer(s pgtype.Text) *string {
	if s.Valid {
		return &s.String
	}
	return nil
}

func timePointer(t pgtype.Timestamptz) *time.Time {
	if t.Valid {
		return &t.Time
	}
	return nil
}

func toAssetDomain(a dbgen.Asset) Asset {
	return Asset{
		ID:                 toGoogleUUID(a.ID),
		ObjectKey:          a.ObjectKey,
		OriginalFilename:   a.OriginalFilename.String,
		ContentType:        a.ContentType,
		Status:             a.Status,
		ProcessingAttempts: int(a.ProcessingAttempts),
		LastStartedAt:      timePointer(a.LastStartedAt),
		FailedAt:           timePointer(a.FailedAt),
		OutputPrefix:       stringPointer(a.OutputPrefix),
		MasterPlaylistKey:  stringPointer(a.MasterPlaylistKey),
		ErrorMessage:       stringPointer(a.ErrorMessage),
		ProcessedAt:        timePointer(a.ProcessedAt),
		CreatedAt:          a.CreatedAt.Time,
		UpdatedAt:          a.UpdatedAt.Time,
	}
}

func (r *AssetRepository) Create(
	ctx context.Context,
	objectKey string,
	filename string,
	contentType string,
) (Asset, error) {
	id := uuid.New()

	a, err := r.q.CreateAsset(ctx, dbgen.CreateAssetParams{
		ID:        toPgUUID(id),
		ObjectKey: objectKey,
		OriginalFilename: pgtype.Text{
			String: filename,
			Valid:  filename != "",
		},
		ContentType: contentType,
		Status:      AssetStatusPending,
	})

	if err != nil {
		return Asset{}, fmt.Errorf("create asset: %w", err)
	}

	return toAssetDomain(a), nil
}

func (r *AssetRepository) CreateWithID(
	ctx context.Context,
	id uuid.UUID,
	objectKey string,
	filename string,
	mimeType string,
) (Asset, error) {
	_, err := r.db.Exec(
		ctx,
		`
		INSERT INTO assets (id, object_key, original_key, original_filename, content_type, mime_type, status, created_at, updated_at)
		VALUES ($1, $2, $2, $3, $4, $4, 'uploaded', NOW(), NOW())
		`,
		id,
		objectKey,
		filename,
		mimeType,
	)

	if err != nil {
		return Asset{}, fmt.Errorf("create asset with id: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *AssetRepository) GetByID(
	ctx context.Context,
	id uuid.UUID,
) (Asset, error) {
	row := r.db.QueryRow(
		ctx,
		`
		SELECT id, object_key, COALESCE(original_key, object_key), COALESCE(original_filename, ''),
		       content_type, COALESCE(mime_type, content_type), status, processing_attempts,
		       last_started_at, failed_at, output_prefix, master_playlist_key,
		       hls_manifest_key, duration_seconds, error_message, processed_at,
		       created_at, updated_at
		FROM assets
		WHERE id = $1
		`,
		id,
	)

	var a Asset
	var origKey, origFilename, mimeType string
	var lastStartedAt, failedAt, processedAt pgtype.Timestamptz
	var outputPrefix, masterPlaylistKey, hlsManifestKey, errorMsg pgtype.Text
	var durationSec pgtype.Int4
	var createdAt, updatedAt time.Time

	err := row.Scan(
		&a.ID,
		&a.ObjectKey,
		&origKey,
		&origFilename,
		&a.ContentType,
		&mimeType,
		&a.Status,
		&a.ProcessingAttempts,
		&lastStartedAt,
		&failedAt,
		&outputPrefix,
		&masterPlaylistKey,
		&hlsManifestKey,
		&durationSec,
		&errorMsg,
		&processedAt,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return Asset{}, fmt.Errorf("get asset by id: %w", err)
	}

	a.OriginalKey = origKey
	a.OriginalFilename = origFilename
	a.MimeType = mimeType
	a.LastStartedAt = timePointer(lastStartedAt)
	a.FailedAt = timePointer(failedAt)
	a.OutputPrefix = stringPointer(outputPrefix)
	a.MasterPlaylistKey = stringPointer(masterPlaylistKey)
	a.HLSManifestKey = stringPointer(hlsManifestKey)
	if durationSec.Valid {
		d := int(durationSec.Int32)
		a.DurationSeconds = &d
	}
	a.ErrorMessage = stringPointer(errorMsg)
	a.ProcessedAt = timePointer(processedAt)
	a.CreatedAt = createdAt
	a.UpdatedAt = updatedAt

	return a, nil
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
	_, err := r.q.UpdateAssetCompletion(ctx, dbgen.UpdateAssetCompletionParams{
		ID:        toPgUUID(id),
		Status:    AssetStatusReady,
		OutputPrefix: pgtype.Text{
			String: outputPrefix,
			Valid:  outputPrefix != "",
		},
		MasterPlaylistKey: pgtype.Text{
			String: masterPlaylistKey,
			Valid:  masterPlaylistKey != "",
		},
	})

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
	_, err := r.q.UpdateAssetFailure(ctx, dbgen.UpdateAssetFailureParams{
		ID: toPgUUID(id),
		ErrorMessage: pgtype.Text{
			String: errMsg,
			Valid:  errMsg != "",
		},
	})

	if err != nil {
		return fmt.Errorf("mark asset failed: %w", err)
	}

	return nil
}

func (r *AssetRepository) MarkProcessing(
	ctx context.Context,
	id uuid.UUID,
) error {
	result, err := r.db.Exec(
		ctx,
		`
		UPDATE assets
		SET status = 'processing',
		    processing_started_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1
		  AND (status = 'uploaded' OR status = 'pending' OR status = 'queued')
		`,
		id,
	)

	if err != nil {
		return fmt.Errorf("mark processing: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("asset %s cannot transition to processing", id)
	}

	return nil
}

