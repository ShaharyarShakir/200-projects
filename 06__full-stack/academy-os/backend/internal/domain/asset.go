package domain

import "github.com/google/uuid"

const (
	AssetStatusUploaded   = "uploaded"
	AssetStatusProcessing = "processing"
	AssetStatusReady      = "ready"
	AssetStatusFailed     = "failed"
)

type Asset struct {
	ID              uuid.UUID `json:"id"`
	TenantID        uuid.UUID `json:"tenant_id"`
	Status          string    `json:"status"`
	MimeType        string    `json:"mime_type"`
	OriginalKey     string    `json:"original_key"`
	HLSManifestKey  *string   `json:"hls_manifest_key"`
	DurationSeconds *int      `json:"duration_seconds"`
	ErrorMessage    *string   `json:"error_message"`
}
