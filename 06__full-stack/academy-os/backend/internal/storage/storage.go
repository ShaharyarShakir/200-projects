package storage

import (
	"context"
	"io"
)

type ObjectStorage interface {
	PresignUpload(
		ctx context.Context,
		key string,
		contentType string,
	) (string, error)

	PresignDownload(
		ctx context.Context,
		key string,
	) (string, error)

	Get(
		ctx context.Context,
		key string,
		writer io.Writer,
	) error

	Download(
		ctx context.Context,
		key string,
		destination string,
	) error

	Put(
		ctx context.Context,
		key string,
		reader io.Reader,
		contentType string,
	) error

	UploadFile(
		ctx context.Context,
		key string,
		filePath string,
		contentType string,
	) error

	Delete(
		ctx context.Context,
		key string,
	) error

	Exists(
		ctx context.Context,
		key string,
	) (bool, error)
}
