ALTER TABLE assets
DROP COLUMN IF EXISTS output_prefix,
DROP COLUMN IF EXISTS master_playlist_key,
DROP COLUMN IF EXISTS error_message,
DROP COLUMN IF EXISTS processed_at;
