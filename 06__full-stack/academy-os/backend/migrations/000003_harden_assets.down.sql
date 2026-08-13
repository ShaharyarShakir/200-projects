DROP INDEX IF EXISTS idx_assets_processing;
ALTER TABLE assets
DROP COLUMN IF EXISTS processing_attempts,
DROP COLUMN IF EXISTS last_started_at,
DROP COLUMN IF EXISTS failed_at;
