package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CourseRepository struct {
	db *pgxpool.Pool
}

func NewCourseRepository(db *pgxpool.Pool) *CourseRepository {
	return &CourseRepository{
		db: db,
	}
}

const (
	CourseStatusDraft     = "draft"
	CourseStatusPublished = "published"
	CourseStatusArchived  = "archived"
)

type CourseRecord struct {
	ID          uuid.UUID `json:"id"`
	AcademyID   uuid.UUID `json:"academy_id"`
	CreatedBy   uuid.UUID `json:"created_by"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
}

func (r *CourseRepository) Create(
	ctx context.Context,
	academyID uuid.UUID,
	userID uuid.UUID,
	title string,
	slug string,
	description string,
) (CourseRecord, error) {
	var c CourseRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO courses (
			academy_id,
			created_by,
			title,
			slug,
			description
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, academy_id, created_by, title, slug, description, status
		`,
		academyID,
		userID,
		title,
		slug,
		description,
	).Scan(
		&c.ID,
		&c.AcademyID,
		&c.CreatedBy,
		&c.Title,
		&c.Slug,
		&c.Description,
		&c.Status,
	)

	if err != nil {
		return CourseRecord{}, fmt.Errorf("create course: %w", err)
	}

	return c, nil
}

func (r *CourseRepository) List(
	ctx context.Context,
	academyID uuid.UUID,
) ([]CourseRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, academy_id, created_by, title, slug, description, status
		FROM courses
		WHERE academy_id = $1
		ORDER BY created_at DESC
		`,
		academyID,
	)
	if err != nil {
		return nil, fmt.Errorf("list courses: %w", err)
	}
	defer rows.Close()

	courses := make([]CourseRecord, 0)
	for rows.Next() {
		var c CourseRecord
		if err := rows.Scan(&c.ID, &c.AcademyID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status); err != nil {
			return nil, fmt.Errorf("scan course: %w", err)
		}
		courses = append(courses, c)
	}

	return courses, nil
}

func (r *CourseRepository) Find(
	ctx context.Context,
	academyID uuid.UUID,
	courseID uuid.UUID,
) (CourseRecord, error) {
	var c CourseRecord
	var err error

	if academyID != uuid.Nil {
		err = r.db.QueryRow(
			ctx,
			`
			SELECT id, academy_id, created_by, title, slug, description, status
			FROM courses
			WHERE id = $1 AND academy_id = $2
			`,
			courseID,
			academyID,
		).Scan(&c.ID, &c.AcademyID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status)
	} else {
		return r.FindByID(ctx, courseID)
	}

	if err != nil {
		return CourseRecord{}, fmt.Errorf("find course: %w", err)
	}

	return c, nil
}

func (r *CourseRepository) Update(
	ctx context.Context,
	academyID uuid.UUID,
	courseID uuid.UUID,
	title string,
	slug string,
	description string,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		UPDATE courses
		SET
			title = $1,
			slug = $2,
			description = $3,
			updated_at = NOW()
		WHERE id = $4 AND academy_id = $5
		`,
		title,
		slug,
		description,
		courseID,
		academyID,
	)

	if err != nil {
		return fmt.Errorf("update course: %w", err)
	}

	return nil
}

func (r *CourseRepository) Delete(
	ctx context.Context,
	academyID uuid.UUID,
	courseID uuid.UUID,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		DELETE FROM courses
		WHERE id = $1 AND academy_id = $2
		`,
		courseID,
		academyID,
	)

	if err != nil {
		return fmt.Errorf("delete course: %w", err)
	}

	return nil
}

func (r *CourseRepository) Publish(
	ctx context.Context,
	academyID uuid.UUID,
	courseID uuid.UUID,
) error {
	result, err := r.db.Exec(
		ctx,
		`
		UPDATE courses
		SET
			status = 'published',
			updated_at = NOW()
		WHERE id = $1
		  AND academy_id = $2
		  AND status = 'draft'
		`,
		courseID,
		academyID,
	)

	if err != nil {
		return fmt.Errorf("publish course: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("course cannot be published")
	}

	return nil
}

func (r *CourseRepository) Archive(
	ctx context.Context,
	academyID uuid.UUID,
	courseID uuid.UUID,
) error {
	result, err := r.db.Exec(
		ctx,
		`
		UPDATE courses
		SET
			status = 'archived',
			updated_at = NOW()
		WHERE id = $1
		  AND academy_id = $2
		  AND status = 'published'
		`,
		courseID,
		academyID,
	)

	if err != nil {
		return fmt.Errorf("archive course: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("course cannot be archived")
	}

	return nil
}

func (r *CourseRepository) ListPublished(
	ctx context.Context,
	academyID uuid.UUID,
) ([]CourseRecord, error) {
	var rows pgx.Rows
	var err error

	if academyID != uuid.Nil {
		rows, err = r.db.Query(
			ctx,
			`
			SELECT id, academy_id, created_by, title, slug, description, status
			FROM courses
			WHERE academy_id = $1
			  AND status = 'published'
			ORDER BY created_at DESC
			`,
			academyID,
		)
	} else {
		rows, err = r.db.Query(
			ctx,
			`
			SELECT id, academy_id, created_by, title, slug, description, status
			FROM courses
			WHERE status = 'published'
			ORDER BY created_at DESC
			`,
		)
	}

	if err != nil {
		return nil, fmt.Errorf("list published courses: %w", err)
	}
	defer rows.Close()

	courses := make([]CourseRecord, 0)
	for rows.Next() {
		var c CourseRecord
		if err := rows.Scan(&c.ID, &c.AcademyID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status); err != nil {
			return nil, fmt.Errorf("scan published course: %w", err)
		}
		courses = append(courses, c)
	}

	return courses, nil
}

func (r *CourseRepository) FindPublishedByID(
	ctx context.Context,
	academyID uuid.UUID,
	courseID uuid.UUID,
) (CourseRecord, error) {
	var c CourseRecord
	var err error

	if academyID != uuid.Nil {
		err = r.db.QueryRow(
			ctx,
			`
			SELECT id, academy_id, created_by, title, slug, description, status
			FROM courses
			WHERE id = $1
			  AND academy_id = $2
			  AND status = 'published'
			`,
			courseID,
			academyID,
		).Scan(&c.ID, &c.AcademyID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status)
	} else {
		err = r.db.QueryRow(
			ctx,
			`
			SELECT id, academy_id, created_by, title, slug, description, status
			FROM courses
			WHERE id = $1
			  AND status = 'published'
			`,
			courseID,
		).Scan(&c.ID, &c.AcademyID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status)
	}

	if err != nil {
		return CourseRecord{}, fmt.Errorf("find published course: %w", err)
	}

	return c, nil
}

func (r *CourseRepository) FindByID(
	ctx context.Context,
	courseID uuid.UUID,
) (CourseRecord, error) {
	var c CourseRecord
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, academy_id, created_by, title, slug, description, status
		FROM courses
		WHERE id = $1
		`,
		courseID,
	).Scan(&c.ID, &c.AcademyID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status)

	if err != nil {
		return CourseRecord{}, fmt.Errorf("find course by id: %w", err)
	}

	return c, nil
}
