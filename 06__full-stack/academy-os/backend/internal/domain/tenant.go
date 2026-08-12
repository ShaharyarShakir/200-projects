package domain

import "github.com/google/uuid"

type Tenant struct {
	ID   uuid.UUID
	Name string
	Slug string
}
