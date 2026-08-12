package domain

import "github.com/google/uuid"

type TenantMember struct {
	TenantID uuid.UUID
	UserID   uuid.UUID
	Role     string
}
