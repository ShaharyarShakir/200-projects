package jobs

import "github.com/google/uuid"

type VideoProcessJob struct {
	AssetID   uuid.UUID `json:"asset_id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	CourseID  uuid.UUID `json:"course_id"`
	LessonID  uuid.UUID `json:"lesson_id"`
	ObjectKey string    `json:"object_key"`
}
