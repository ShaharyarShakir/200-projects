-- name: CreateAsset :one
INSERT INTO assets (
    id,
    object_key,
    original_filename,
    content_type,
    size_bytes,
    status
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetAssetByID :one
SELECT * FROM assets
WHERE id = $1;

-- name: UpdateAssetStatus :one
UPDATE assets
SET
    status = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateAssetCompletion :one
UPDATE assets
SET
    status = $2,
    output_prefix = $3,
    master_playlist_key = $4,
    processed_at = NOW(),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateAssetFailure :one
UPDATE assets
SET
    status = 'failed',
    failed_at = NOW(),
    error_message = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ClaimAssetProcessing :one
UPDATE assets
SET
    processing_attempts = processing_attempts + 1,
    last_started_at = NOW(),
    updated_at = NOW()
WHERE id = $1
RETURNING *;
