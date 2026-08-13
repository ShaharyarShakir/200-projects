package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LessonRepository struct {
	db *pgxpool.Pool
}

func NewLessonRepository(
	db *pgxpool.Pool,
) *LessonRepository {
	return &LessonRepository{
		db: db,
	}
}

type LessonRecord struct {
	ID           uuid.UUID  `json:"id"`
	CourseID     uuid.UUID  `json:"course_id"`
	SectionID    uuid.UUID  `json:"section_id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	Position     int        `json:"position"`
	ContentType  string     `json:"content_type"`
	VideoAssetID *uuid.UUID `json:"video_asset_id"`
}

func (r *LessonRepository) Create(
	ctx context.Context,
	courseID uuid.UUID,
	sectionID uuid.UUID,
	title string,
	description string,
	position int,
) (LessonRecord, error) {
	var lesson LessonRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO lessons (
			course_id,
			section_id,
			title,
			description,
			position
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING
			id,
			course_id,
			section_id,
			title,
			description,
			position,
			content_type,
			video_asset_id
		`,
		courseID,
		sectionID,
		title,
		description,
		position,
	).Scan(
		&lesson.ID,
		&lesson.CourseID,
		&lesson.SectionID,
		&lesson.Title,
		&lesson.Description,
		&lesson.Position,
		&lesson.ContentType,
		&lesson.VideoAssetID,
	)

	if err != nil {
		return LessonRecord{}, fmt.Errorf(
			"create lesson: %w",
			err,
		)
	}

	return lesson, nil
}

func (r *LessonRepository) List(
	ctx context.Context,
	sectionID uuid.UUID,
) ([]LessonRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT
			id,
			course_id,
			section_id,
			title,
			description,
			position,
			content_type,
			video_asset_id
		FROM lessons
		WHERE section_id = $1
		ORDER BY position ASC
		`,
		sectionID,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"list lessons: %w",
			err,
		)
	}

	defer rows.Close()

	var lessons []LessonRecord

	for rows.Next() {
		var lesson LessonRecord

		if err := rows.Scan(
			&lesson.ID,
			&lesson.CourseID,
			&lesson.SectionID,
			&lesson.Title,
			&lesson.Description,
			&lesson.Position,
			&lesson.ContentType,
			&lesson.VideoAssetID,
		); err != nil {
			return nil, fmt.Errorf(
				"scan lesson: %w",
				err,
			)
		}

		lessons = append(
			lessons,
			lesson,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return lessons, nil
}

func (r *LessonRepository) Find(
	ctx context.Context,
	lessonID uuid.UUID,
) (LessonRecord, error) {
	var lesson LessonRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT
			id,
			course_id,
			section_id,
			title,
			description,
			position,
			content_type,
			video_asset_id
		FROM lessons
		WHERE id = $1
		`,
		lessonID,
	).Scan(
		&lesson.ID,
		&lesson.CourseID,
		&lesson.SectionID,
		&lesson.Title,
		&lesson.Description,
		&lesson.Position,
		&lesson.ContentType,
		&lesson.VideoAssetID,
	)

	if err != nil {
		return LessonRecord{}, fmt.Errorf("find lesson: %w", err)
	}

	return lesson, nil
}

