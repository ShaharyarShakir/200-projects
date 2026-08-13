package course

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
)

type Service struct {
	courses  *database.CourseRepository
	sections *database.SectionRepository
	lessons  *database.LessonRepository
}

func NewService(
	courses *database.CourseRepository,
	sections *database.SectionRepository,
	lessons *database.LessonRepository,
) *Service {
	return &Service{
		courses:  courses,
		sections: sections,
		lessons:  lessons,
	}
}

func slugify(value string) string {
	value = strings.ToLower(
		strings.TrimSpace(value),
	)

	var result strings.Builder
	lastDash := false

	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			result.WriteRune(r)
			lastDash = false

		case r >= '0' && r <= '9':
			result.WriteRune(r)
			lastDash = false

		default:
			if !lastDash {
				result.WriteRune('-')
				lastDash = true
			}
		}
	}

	return strings.Trim(
		result.String(),
		"-",
	)
}

func (s *Service) Create(
	ctx context.Context,
	tenantID uuid.UUID,
	userID uuid.UUID,
	title string,
	description string,
) (database.CourseRecord, error) {
	title = strings.TrimSpace(title)

	if title == "" {
		return database.CourseRecord{}, fmt.Errorf(
			"title is required",
		)
	}

	slug := slugify(title)

	if slug == "" {
		return database.CourseRecord{}, fmt.Errorf(
			"could not generate slug",
		)
	}

	courseRecord, err := s.courses.Create(
		ctx,
		tenantID,
		userID,
		title,
		slug,
		description,
	)
	if err != nil {
		if strings.Contains(err.Error(), "courses_tenant_slug_unique") || strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			uniqueSlug := fmt.Sprintf("%s-%s", slug, uuid.New().String()[:6])
			return s.courses.Create(
				ctx,
				tenantID,
				userID,
				title,
				uniqueSlug,
				description,
			)
		}
		return database.CourseRecord{}, err
	}

	return courseRecord, nil
}

func (s *Service) List(
	ctx context.Context,
	tenantID uuid.UUID,
) ([]database.CourseRecord, error) {
	return s.courses.List(ctx, tenantID)
}

func (s *Service) Find(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) (database.CourseRecord, error) {
	return s.courses.Find(ctx, tenantID, courseID)
}

func (s *Service) Update(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
	title string,
	description string,
) error {
	title = strings.TrimSpace(title)
	if title == "" {
		return fmt.Errorf("title is required")
	}

	slug := slugify(title)
	if slug == "" {
		return fmt.Errorf("could not generate slug")
	}

	return s.courses.Update(
		ctx,
		tenantID,
		courseID,
		title,
		slug,
		description,
	)
}

func (s *Service) Delete(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) error {
	return s.courses.Delete(ctx, tenantID, courseID)
}
