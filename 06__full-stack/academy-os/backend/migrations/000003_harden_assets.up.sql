ALTER TABLE assets
ADD COLUMN IF NOT EXISTS processing_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_assets_processing
    ON assets(status, updated_at);
