package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	CourseStatusDraft     = "draft"
	CourseStatusPublished = "published"
	CourseStatusArchived  = "archived"
)

type Course struct {
	ID          uuid.UUID
	TenantID    uuid.UUID
	CreatedBy   uuid.UUID
	Title       string
	Slug        string
	Description string
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
