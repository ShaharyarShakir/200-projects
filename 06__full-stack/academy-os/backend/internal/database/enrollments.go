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
	AcademyID uuid.UUID `json:"academy_id"`
	UserID    uuid.UUID `json:"user_id"`
	CourseID  uuid.UUID `json:"course_id"`
	CreatedAt string    `json:"created_at"`
}

type StudentEnrollmentDetail struct {
	EnrollmentID uuid.UUID `json:"enrollment_id"`
	UserID       uuid.UUID `json:"user_id"`
	StudentName  string    `json:"student_name"`
	StudentEmail string    `json:"student_email"`
	CourseID     uuid.UUID `json:"course_id"`
	CourseTitle  string    `json:"course_title"`
	JoinedAt     string    `json:"joined_at"`
}

func (r *EnrollmentRepository) Create(
	ctx context.Context,
	academyID uuid.UUID,
	userID uuid.UUID,
	courseID uuid.UUID,
) (EnrollmentRecord, error) {
	id := uuid.New()
	var rec EnrollmentRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO enrollments (id, academy_id, user_id, course_id)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (academy_id, user_id, course_id)
		DO UPDATE SET academy_id = EXCLUDED.academy_id
		RETURNING id, academy_id, user_id, course_id, created_at::text
		`,
		id, academyID, userID, courseID,
	).Scan(&rec.ID, &rec.AcademyID, &rec.UserID, &rec.CourseID, &rec.CreatedAt)

	if err != nil {
		return EnrollmentRecord{}, fmt.Errorf("create enrollment: %w", err)
	}

	return rec, nil
}

func (r *EnrollmentRepository) IsEnrolled(
	ctx context.Context,
	academyID uuid.UUID,
	userID uuid.UUID,
	courseID uuid.UUID,
) (bool, error) {
	var count int
	err := r.db.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM enrollments
		WHERE academy_id = $1
		  AND user_id = $2
		  AND course_id = $3
		`,
		academyID, userID, courseID,
	).Scan(&count)

	if err != nil {
		return false, fmt.Errorf("check enrollment: %w", err)
	}

	return count > 0, nil
}

func (r *EnrollmentRepository) ListByAcademyID(
	ctx context.Context,
	academyID uuid.UUID,
) ([]StudentEnrollmentDetail, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT e.id, e.user_id, COALESCE(u.name, u.email), u.email, e.course_id, COALESCE(c.title, 'Untitled Course'), e.created_at::text
		FROM enrollments e
		JOIN users u ON e.user_id = u.id
		LEFT JOIN courses c ON e.course_id = c.id
		WHERE e.academy_id = $1
		ORDER BY e.created_at DESC
		`,
		academyID,
	)
	if err != nil {
		return nil, fmt.Errorf("list academy enrollments: %w", err)
	}
	defer rows.Close()

	var list []StudentEnrollmentDetail
	for rows.Next() {
		var item StudentEnrollmentDetail
		if err := rows.Scan(&item.EnrollmentID, &item.UserID, &item.StudentName, &item.StudentEmail, &item.CourseID, &item.CourseTitle, &item.JoinedAt); err != nil {
			return nil, err
		}
		list = append(list, item)
	}

	if list == nil {
		list = []StudentEnrollmentDetail{}
	}

	return list, nil
}
