package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EnrollmentRepository struct {
	db *pgxpool.Pool
}

func NewEnrollmentRepository(db *pgxpool.Pool) *EnrollmentRepository {
	return &EnrollmentRepository{
		db: db,
	}
}

type EnrollmentRecord struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	UserID    uuid.UUID `json:"user_id"`
	CourseID  uuid.UUID `json:"course_id"`
	CreatedAt string    `json:"created_at"`
}

func (r *EnrollmentRepository) Create(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	courseID uuid.UUID,
) (EnrollmentRecord, error) {
	id := uuid.New()
	var rec EnrollmentRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO enrollments (id, tenant_id, user_id, course_id)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (tenant_id, user_id, course_id)
		DO UPDATE SET tenant_id = EXCLUDED.tenant_id
		RETURNING id, tenant_id, user_id, course_id, created_at::text
		`,
		id, tenantID, userID, courseID,
	).Scan(&rec.ID, &rec.TenantID, &rec.UserID, &rec.CourseID, &rec.CreatedAt)

	if err != nil {
		return EnrollmentRecord{}, fmt.Errorf("create enrollment: %w", err)
	}

	return rec, nil
}

func (r *EnrollmentRepository) IsEnrolled(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	courseID uuid.UUID,
) (bool, error) {
	var count int
	err := r.db.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM enrollments
		WHERE tenant_id = $1
		  AND user_id = $2
		  AND course_id = $3
		`,
		tenantID, userID, courseID,
	).Scan(&count)

	if err != nil {
		return false, fmt.Errorf("check enrollment: %w", err)
	}

	return count > 0, nil
}
