package database

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LessonProgressRepository struct {
	db *pgxpool.Pool
}

func NewLessonProgressRepository(db *pgxpool.Pool) *LessonProgressRepository {
	return &LessonProgressRepository{
		db: db,
	}
}

type LessonProgressRecord struct {
	ID              uuid.UUID  `json:"id"`
	TenantID        uuid.UUID  `json:"tenant_id"`
	UserID          uuid.UUID  `json:"user_id"`
	LessonID        uuid.UUID  `json:"lesson_id"`
	PositionSeconds int        `json:"position_seconds"`
	CompletedAt     *time.Time `json:"completed_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (r *LessonProgressRepository) UpsertProgress(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	lessonID uuid.UUID,
	positionSeconds int,
) (LessonProgressRecord, error) {
	id := uuid.New()
	var rec LessonProgressRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO lesson_progress (id, tenant_id, user_id, lesson_id, position_seconds, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (tenant_id, user_id, lesson_id)
		DO UPDATE SET
			position_seconds = EXCLUDED.position_seconds,
			updated_at = NOW()
		RETURNING id, tenant_id, user_id, lesson_id, position_seconds, completed_at, updated_at
		`,
		id, tenantID, userID, lessonID, positionSeconds,
	).Scan(&rec.ID, &rec.TenantID, &rec.UserID, &rec.LessonID, &rec.PositionSeconds, &rec.CompletedAt, &rec.UpdatedAt)

	if err != nil {
		return LessonProgressRecord{}, fmt.Errorf("upsert lesson progress: %w", err)
	}

	return rec, nil
}

func (r *LessonProgressRepository) MarkComplete(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	lessonID uuid.UUID,
) (LessonProgressRecord, error) {
	id := uuid.New()
	var rec LessonProgressRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO lesson_progress (id, tenant_id, user_id, lesson_id, completed_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		ON CONFLICT (tenant_id, user_id, lesson_id)
		DO UPDATE SET
			completed_at = COALESCE(lesson_progress.completed_at, NOW()),
			updated_at = NOW()
		RETURNING id, tenant_id, user_id, lesson_id, position_seconds, completed_at, updated_at
		`,
		id, tenantID, userID, lessonID,
	).Scan(&rec.ID, &rec.TenantID, &rec.UserID, &rec.LessonID, &rec.PositionSeconds, &rec.CompletedAt, &rec.UpdatedAt)

	if err != nil {
		return LessonProgressRecord{}, fmt.Errorf("mark lesson complete: %w", err)
	}

	return rec, nil
}

func (r *LessonProgressRepository) GetProgress(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	lessonID uuid.UUID,
) (LessonProgressRecord, error) {
	var rec LessonProgressRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, tenant_id, user_id, lesson_id, position_seconds, completed_at, updated_at
		FROM lesson_progress
		WHERE tenant_id = $1
		  AND user_id = $2
		  AND lesson_id = $3
		`,
		tenantID, userID, lessonID,
	).Scan(&rec.ID, &rec.TenantID, &rec.UserID, &rec.LessonID, &rec.PositionSeconds, &rec.CompletedAt, &rec.UpdatedAt)

	if err != nil {
		return LessonProgressRecord{
			TenantID:        tenantID,
			UserID:          userID,
			LessonID:        lessonID,
			PositionSeconds: 0,
			CompletedAt:     nil,
		}, nil
	}

	return rec, nil
}

func (r *LessonProgressRepository) GetProgressForCourse(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	courseID uuid.UUID,
) (map[uuid.UUID]LessonProgressRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT lp.id, lp.tenant_id, lp.user_id, lp.lesson_id, lp.position_seconds, lp.completed_at, lp.updated_at
		FROM lesson_progress lp
		JOIN lessons l ON l.id = lp.lesson_id
		JOIN sections s ON s.id = l.section_id
		WHERE lp.tenant_id = $1
		  AND lp.user_id = $2
		  AND s.course_id = $3
		`,
		tenantID, userID, courseID,
	)
	if err != nil {
		return nil, fmt.Errorf("get course progress: %w", err)
	}
	defer rows.Close()

	progressMap := make(map[uuid.UUID]LessonProgressRecord)
	for rows.Next() {
		var rec LessonProgressRecord
		if err := rows.Scan(&rec.ID, &rec.TenantID, &rec.UserID, &rec.LessonID, &rec.PositionSeconds, &rec.CompletedAt, &rec.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan progress row: %w", err)
		}
		progressMap[rec.LessonID] = rec
	}

	return progressMap, nil
}
