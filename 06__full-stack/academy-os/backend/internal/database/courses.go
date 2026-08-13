package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ShaharyarShakir/academy-os/internal/database/dbgen"
)

type CourseRepository struct {
	db *pgxpool.Pool
	q  *dbgen.Queries
}

func NewCourseRepository(db *pgxpool.Pool) *CourseRepository {
	return &CourseRepository{
		db: db,
		q:  dbgen.New(db),
	}
}

const (
	CourseStatusDraft     = "draft"
	CourseStatusPublished = "published"
	CourseStatusArchived  = "archived"
)

type CourseRecord struct {
	ID          uuid.UUID `json:"id"`
	TenantID    uuid.UUID `json:"tenant_id"`
	CreatedBy   uuid.UUID `json:"created_by"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
}

func toPgUUID(u uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: u, Valid: true}
}

func toGoogleUUID(p pgtype.UUID) uuid.UUID {
	return uuid.UUID(p.Bytes)
}

func (r *CourseRepository) Create(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	title string,
	slug string,
	description string,
) (CourseRecord, error) {
	c, err := r.q.CreateCourse(ctx, dbgen.CreateCourseParams{
		TenantID:    toPgUUID(tenantID),
		CreatedBy:   toPgUUID(userID),
		Title:       title,
		Slug:        slug,
		Description: description,
	})

	if err != nil {
		return CourseRecord{}, fmt.Errorf("create course: %w", err)
	}

	return CourseRecord{
		ID:          toGoogleUUID(c.ID),
		TenantID:    toGoogleUUID(c.TenantID),
		CreatedBy:   toGoogleUUID(c.CreatedBy),
		Title:       c.Title,
		Slug:        c.Slug,
		Description: c.Description,
		Status:      c.Status,
	}, nil
}

func (r *CourseRepository) List(
	ctx context.Context,
	tenantID uuid.UUID,
) ([]CourseRecord, error) {
	items, err := r.q.ListCoursesByTenant(ctx, toPgUUID(tenantID))
	if err != nil {
		return nil, fmt.Errorf("list courses: %w", err)
	}

	courses := make([]CourseRecord, 0, len(items))
	for _, c := range items {
		courses = append(courses, CourseRecord{
			ID:          toGoogleUUID(c.ID),
			TenantID:    toGoogleUUID(c.TenantID),
			CreatedBy:   toGoogleUUID(c.CreatedBy),
			Title:       c.Title,
			Slug:        c.Slug,
			Description: c.Description,
			Status:      c.Status,
		})
	}

	return courses, nil
}

func (r *CourseRepository) Find(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) (CourseRecord, error) {
	c, err := r.q.GetCourseByIDAndTenant(ctx, dbgen.GetCourseByIDAndTenantParams{
		ID:       toPgUUID(courseID),
		TenantID: toPgUUID(tenantID),
	})

	if err != nil {
		return CourseRecord{}, fmt.Errorf("find course: %w", err)
	}

	return CourseRecord{
		ID:          toGoogleUUID(c.ID),
		TenantID:    toGoogleUUID(c.TenantID),
		CreatedBy:   toGoogleUUID(c.CreatedBy),
		Title:       c.Title,
		Slug:        c.Slug,
		Description: c.Description,
		Status:      c.Status,
	}, nil
}

func (r *CourseRepository) Update(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
	title string,
	slug string,
	description string,
) error {
	err := r.q.UpdateCourse(ctx, dbgen.UpdateCourseParams{
		Title:       title,
		Slug:        slug,
		Description: description,
		ID:          toPgUUID(courseID),
		TenantID:    toPgUUID(tenantID),
	})

	if err != nil {
		return fmt.Errorf("update course: %w", err)
	}

	return nil
}

func (r *CourseRepository) Delete(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) error {
	err := r.q.DeleteCourse(ctx, dbgen.DeleteCourseParams{
		ID:       toPgUUID(courseID),
		TenantID: toPgUUID(tenantID),
	})

	if err != nil {
		return fmt.Errorf("delete course: %w", err)
	}

	return nil
}

func (r *CourseRepository) Publish(
	ctx context.Context,
	tenantID uuid.UUID,
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
		  AND tenant_id = $2
		  AND status = 'draft'
		`,
		courseID,
		tenantID,
	)

	if err != nil {
		return fmt.Errorf(
			"publish course: %w",
			err,
		)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf(
			"course cannot be published",
		)
	}

	return nil
}

func (r *CourseRepository) Archive(
	ctx context.Context,
	tenantID uuid.UUID,
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
		  AND tenant_id = $2
		  AND status = 'published'
		`,
		courseID,
		tenantID,
	)

	if err != nil {
		return fmt.Errorf(
			"archive course: %w",
			err,
		)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf(
			"course cannot be archived",
		)
	}

	return nil
}

func (r *CourseRepository) ListPublished(
	ctx context.Context,
	tenantID uuid.UUID,
) ([]CourseRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, tenant_id, created_by, title, slug, description, status
		FROM courses
		WHERE tenant_id = $1
		  AND status = 'published'
		ORDER BY created_at DESC
		`,
		tenantID,
	)
	if err != nil {
		return nil, fmt.Errorf("list published courses: %w", err)
	}
	defer rows.Close()

	courses := make([]CourseRecord, 0)
	for rows.Next() {
		var c CourseRecord
		if err := rows.Scan(&c.ID, &c.TenantID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status); err != nil {
			return nil, fmt.Errorf("scan published course: %w", err)
		}
		courses = append(courses, c)
	}

	return courses, nil
}

func (r *CourseRepository) FindPublishedByID(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) (CourseRecord, error) {
	var c CourseRecord
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, tenant_id, created_by, title, slug, description, status
		FROM courses
		WHERE id = $1
		  AND tenant_id = $2
		  AND status = 'published'
		`,
		courseID,
		tenantID,
	).Scan(&c.ID, &c.TenantID, &c.CreatedBy, &c.Title, &c.Slug, &c.Description, &c.Status)

	if err != nil {
		return CourseRecord{}, fmt.Errorf("find published course: %w", err)
	}

	return c, nil
}


