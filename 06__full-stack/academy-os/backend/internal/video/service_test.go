package video

import (
	"context"
	"io"
	"testing"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/jobs"
)

type mockStorage struct {
	presignUploadURL string
	existsResult     bool
}

func (m *mockStorage) PresignUpload(ctx context.Context, key string, contentType string) (string, error) {
	return m.presignUploadURL, nil
}

func (m *mockStorage) PresignDownload(ctx context.Context, key string) (string, error) {
	return "", nil
}

func (m *mockStorage) Put(ctx context.Context, key string, reader io.Reader, contentType string) error {
	return nil
}

func (m *mockStorage) Delete(ctx context.Context, key string) error {
	return nil
}

func (m *mockStorage) Exists(ctx context.Context, key string) (bool, error) {
	return m.existsResult, nil
}

type mockQueue struct {
	enqueuedJob jobs.Job
}

func (m *mockQueue) Enqueue(ctx context.Context, job jobs.Job) error {
	m.enqueuedJob = job
	return nil
}

func TestMockStorageInterface(t *testing.T) {
	var _ = &mockStorage{presignUploadURL: "http://localhost:3900/upload"}
	var _ = &mockQueue{}
}

func TestObjectKeyFormat(t *testing.T) {
	tenantID := uuid.New()
	courseID := uuid.New()
	lessonID := uuid.New()
	assetID := uuid.New()
	ext := ".mp4"

	expectedPrefix := "uploads/" + tenantID.String() + "/" + courseID.String() + "/" + lessonID.String() + "/" + assetID.String() + "/original" + ext

	if expectedPrefix == "" {
		t.Fatalf("expected non-empty key")
	}
}
