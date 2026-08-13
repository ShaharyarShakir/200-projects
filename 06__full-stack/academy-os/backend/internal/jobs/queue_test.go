package jobs

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
)

func TestVideoProcessJobSerialization(t *testing.T) {
	assetID := uuid.New()
	tenantID := uuid.New()
	courseID := uuid.New()
	lessonID := uuid.New()
	objectKey := "uploads/tenant/course/lesson/asset/original.mp4"

	jobPayload := VideoProcessJob{
		AssetID:   assetID,
		TenantID:  tenantID,
		CourseID:  courseID,
		LessonID:  lessonID,
		ObjectKey: objectKey,
	}

	data, err := json.Marshal(jobPayload)
	if err != nil {
		t.Fatalf("failed to marshal VideoProcessJob: %v", err)
	}

	job := Job{
		Type: JobVideoProcess,
		Data: data,
	}

	jobBytes, err := json.Marshal(job)
	if err != nil {
		t.Fatalf("failed to marshal Job wrapper: %v", err)
	}

	var unmarshaledJob Job
	if err := json.Unmarshal(jobBytes, &unmarshaledJob); err != nil {
		t.Fatalf("failed to unmarshal Job wrapper: %v", err)
	}

	if unmarshaledJob.Type != JobVideoProcess {
		t.Errorf("expected job type %s, got %s", JobVideoProcess, unmarshaledJob.Type)
	}

	var decodedPayload VideoProcessJob
	if err := json.Unmarshal(unmarshaledJob.Data, &decodedPayload); err != nil {
		t.Fatalf("failed to unmarshal VideoProcessJob data: %v", err)
	}

	if decodedPayload.AssetID != assetID {
		t.Errorf("expected AssetID %s, got %s", assetID, decodedPayload.AssetID)
	}
	if decodedPayload.ObjectKey != objectKey {
		t.Errorf("expected ObjectKey %s, got %s", objectKey, decodedPayload.ObjectKey)
	}
}
