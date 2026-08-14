ALTER TABLE assets
DROP CONSTRAINT IF EXISTS assets_status_check;

DROP INDEX IF EXISTS idx_assets_processing;
DROP INDEX IF EXISTS idx_assets_status;

ALTER TABLE assets
DROP COLUMN IF EXISTS processing_completed_at,
DROP COLUMN IF EXISTS processing_started_at,
DROP COLUMN IF EXISTS error_message,
DROP COLUMN IF EXISTS duration_seconds,
DROP COLUMN IF EXISTS hls_manifest_key,
DROP COLUMN IF EXISTS original_key,
DROP COLUMN IF EXISTS mime_type;
