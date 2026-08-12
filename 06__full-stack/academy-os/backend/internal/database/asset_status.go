package database

import "fmt"

const (
	AssetStatusPending    = "pending"
	AssetStatusQueued     = "queued"
	AssetStatusProcessing = "processing"
	AssetStatusReady      = "ready"
	AssetStatusFailed     = "failed"
)

func ValidateStatusTransition(from, to string) error {
	switch from {
	case AssetStatusPending:
		if to == AssetStatusQueued {
			return nil
		}

	case AssetStatusQueued:
		if to == AssetStatusProcessing {
			return nil
		}

	case AssetStatusProcessing:
		if to == AssetStatusReady || to == AssetStatusFailed {
			return nil
		}

	case AssetStatusFailed:
		if to == AssetStatusQueued {
			return nil
		}
	}

	return fmt.Errorf(
		"invalid asset status transition: %s -> %s",
		from,
		to,
	)
}
