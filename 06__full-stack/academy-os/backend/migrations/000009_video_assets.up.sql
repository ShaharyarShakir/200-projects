ALTER TABLE assets
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'uploaded';

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS original_key TEXT;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS hls_manifest_key TEXT;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

UPDATE assets SET status = 'uploaded' WHERE status NOT IN ('uploaded', 'processing', 'ready', 'failed');

ALTER TABLE assets
DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE assets
ADD CONSTRAINT assets_status_check
CHECK (
    status IN (
        'uploaded',
        'processing',
        'ready',
        'failed'
    )
);

CREATE INDEX IF NOT EXISTS idx_assets_status
ON assets(status);

CREATE INDEX IF NOT EXISTS idx_assets_processing
ON assets(status, processing_started_at);
