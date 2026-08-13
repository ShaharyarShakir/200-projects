package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ShaharyarShakir/academy-os/internal/database/dbgen"
)

type MembershipRepository struct {
	db *pgxpool.Pool
	q  *dbgen.Queries
}

func NewMembershipRepository(db *pgxpool.Pool) *MembershipRepository {
	return &MembershipRepository{
		db: db,
		q:  dbgen.New(db),
	}
}

type MembershipRecord struct {
	TenantID uuid.UUID `json:"tenant_id"`
	UserID   uuid.UUID `json:"user_id"`
	Role     string    `json:"role"`
}

type UserTenantMembership struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Slug string    `json:"slug"`
	Role string    `json:"role"`
}

func (r *MembershipRepository) Add(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	role string,
) error {
	err := r.q.CreateMembership(ctx, dbgen.CreateMembershipParams{
		TenantID: toPgUUID(tenantID),
		UserID:   toPgUUID(userID),
		Role:     role,
	})
	if err != nil {
		return fmt.Errorf("add tenant member: %w", err)
	}

	return nil
}

func (r *MembershipRepository) Find(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
) (MembershipRecord, error) {
	m, err := r.q.GetMembership(ctx, dbgen.GetMembershipParams{
		UserID:   toPgUUID(userID),
		TenantID: toPgUUID(tenantID),
	})

	if err != nil {
		return MembershipRecord{}, fmt.Errorf("find tenant membership: %w", err)
	}

	return MembershipRecord{
		TenantID: toGoogleUUID(m.TenantID),
		UserID:   toGoogleUUID(m.UserID),
		Role:     m.Role,
	}, nil
}

func (r *MembershipRepository) ListForUser(
	ctx context.Context,
	userID uuid.UUID,
) ([]MembershipRecord, error) {
	items, err := r.q.ListUserMemberships(ctx, toPgUUID(userID))
	if err != nil {
		return nil, fmt.Errorf("list memberships: %w", err)
	}

	memberships := make([]MembershipRecord, 0, len(items))
	for _, item := range items {
		memberships = append(memberships, MembershipRecord{
			TenantID: toGoogleUUID(item.TenantID),
			UserID:   toGoogleUUID(item.UserID),
			Role:     item.Role,
		})
	}

	return memberships, nil
}

func (r *MembershipRepository) ListWithDetailsForUser(
	ctx context.Context,
	userID uuid.UUID,
) ([]UserTenantMembership, error) {
	items, err := r.q.ListUserMembershipsWithDetails(ctx, toPgUUID(userID))
	if err != nil {
		return nil, fmt.Errorf("list memberships with details: %w", err)
	}

	memberships := make([]UserTenantMembership, 0, len(items))
	for _, item := range items {
		memberships = append(memberships, UserTenantMembership{
			ID:   toGoogleUUID(item.TenantID),
			Name: item.TenantName,
			Slug: item.TenantSlug,
			Role: item.Role,
		})
	}

	return memberships, nil
}

func (r *MembershipRepository) FindMembership(
	ctx context.Context,
	academyID string,
	userID string,
) (string, error) {
	parsedAcademyID, err := uuid.Parse(academyID)
	if err != nil {
		return "", fmt.Errorf("invalid academy id: %w", err)
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return "", fmt.Errorf("invalid user id: %w", err)
	}

	var role string
	query := `
		SELECT
			COALESCE(m.role, tm.role) AS role
		FROM tenants a
		LEFT JOIN memberships m
			ON m.tenant_id = a.id AND m.user_id = $2
		LEFT JOIN tenant_members tm
			ON tm.tenant_id = a.id AND tm.user_id = $2
		WHERE
			a.id = $1
			AND (m.user_id = $2 OR tm.user_id = $2)
			AND COALESCE(a.status, 'active') = 'active'
		LIMIT 1;
	`

	err = r.db.QueryRow(ctx, query, parsedAcademyID, parsedUserID).Scan(&role)
	if err != nil {
		return "", fmt.Errorf("find membership: %w", err)
	}

	return role, nil
}

