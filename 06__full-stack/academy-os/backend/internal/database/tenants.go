package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantRepository struct {
	db *pgxpool.Pool
}

func NewTenantRepository(db *pgxpool.Pool) *TenantRepository {
	return &TenantRepository{db: db}
}

type TenantRecord struct {
	ID   uuid.UUID
	Name string
	Slug string
}

func (r *TenantRepository) Create(
	ctx context.Context,
	name string,
	slug string,
) (TenantRecord, error) {
	var tenant TenantRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO tenants (
			name,
			slug
		)
		VALUES ($1, $2)
		RETURNING id, name, slug
		`,
		name,
		slug,
	).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
	)

	if err != nil {
		return TenantRecord{}, fmt.Errorf("create tenant: %w", err)
	}

	return tenant, nil
}
