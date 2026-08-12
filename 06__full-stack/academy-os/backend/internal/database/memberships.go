package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MembershipRepository struct {
	db *pgxpool.Pool
}

func NewMembershipRepository(db *pgxpool.Pool) *MembershipRepository {
	return &MembershipRepository{db: db}
}

func (r *MembershipRepository) Add(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	role string,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		INSERT INTO tenant_members (
			tenant_id,
			user_id,
			role
		)
		VALUES ($1, $2, $3)
		`,
		tenantID,
		userID,
		role,
	)

	if err != nil {
		return fmt.Errorf("add tenant member: %w", err)
	}

	return nil
}
