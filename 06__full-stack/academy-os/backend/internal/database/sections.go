package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SectionRepository struct {
	db *pgxpool.Pool
}

func NewSectionRepository(
	db *pgxpool.Pool,
) *SectionRepository {
	return &SectionRepository{
		db: db,
	}
}

type SectionRecord struct {
	ID       uuid.UUID `json:"id"`
	CourseID uuid.UUID `json:"course_id"`
	Title    string    `json:"title"`
	Position int       `json:"position"`
}

func (r *SectionRepository) Create(
	ctx context.Context,
	courseID uuid.UUID,
	title string,
	position int,
) (SectionRecord, error) {
	var section SectionRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO course_sections (
			course_id,
			title,
			position
		)
		VALUES ($1, $2, $3)
		RETURNING
			id,
			course_id,
			title,
			position
		`,
		courseID,
		title,
		position,
	).Scan(
		&section.ID,
		&section.CourseID,
		&section.Title,
		&section.Position,
	)

	if err != nil {
		return SectionRecord{}, fmt.Errorf(
			"create section: %w",
			err,
		)
	}

	return section, nil
}

func (r *SectionRepository) List(
	ctx context.Context,
	courseID uuid.UUID,
) ([]SectionRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT
			id,
			course_id,
			title,
			position
		FROM course_sections
		WHERE course_id = $1
		ORDER BY position ASC
		`,
		courseID,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"list sections: %w",
			err,
		)
	}

	defer rows.Close()

	var sections []SectionRecord

	for rows.Next() {
		var section SectionRecord

		if err := rows.Scan(
			&section.ID,
			&section.CourseID,
			&section.Title,
			&section.Position,
		); err != nil {
			return nil, fmt.Errorf(
				"scan section: %w",
				err,
			)
		}

		sections = append(
			sections,
			section,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return sections, nil
}

func (r *SectionRepository) Find(
	ctx context.Context,
	sectionID uuid.UUID,
) (SectionRecord, error) {
	var section SectionRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT
			id,
			course_id,
			title,
			position
		FROM course_sections
		WHERE id = $1
		`,
		sectionID,
	).Scan(
		&section.ID,
		&section.CourseID,
		&section.Title,
		&section.Position,
	)

	if err != nil {
		return SectionRecord{}, fmt.Errorf(
			"find section: %w",
			err,
		)
	}

	return section, nil
}
