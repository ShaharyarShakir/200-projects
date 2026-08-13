package database

import "fmt"

const (
	AssetStatusPending    = "pending"
	AssetStatusQueued     = "queued"
	AssetStatusUploaded   = "uploaded"
	AssetStatusProcessing = "processing"
	AssetStatusReady      = "ready"
	AssetStatusFailed     = "failed"
)

func ValidateStatusTransition(from, to string) error {
	switch from {
	case AssetStatusUploaded, "pending", "queued":
		if to == AssetStatusProcessing || to == "queued" {
			return nil
		}

	case AssetStatusProcessing:
		if to == AssetStatusReady || to == AssetStatusFailed {
			return nil
		}

	case AssetStatusFailed:
		if to == AssetStatusProcessing || to == "queued" {
			return nil
		}
	}

	return fmt.Errorf(
		"invalid asset status transition: %s -> %s",
		from,
		to,
	)
}
