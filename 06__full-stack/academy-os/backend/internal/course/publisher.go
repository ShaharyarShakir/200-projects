package course

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
)

type Publisher struct {
	courses  *database.CourseRepository
	sections *database.SectionRepository
	lessons  *database.LessonRepository
}

func NewPublisher(
	courses *database.CourseRepository,
	sections *database.SectionRepository,
	lessons *database.LessonRepository,
) *Publisher {
	return &Publisher{
		courses:  courses,
		sections: sections,
		lessons:  lessons,
	}
}

var (
	ErrCourseNotFound = fmt.Errorf(
		"course not found",
	)

	ErrCourseAlreadyPublished = fmt.Errorf(
		"course is already published",
	)

	ErrCourseArchived = fmt.Errorf(
		"course is archived",
	)

	ErrCourseHasNoSections = fmt.Errorf(
		"course has no sections",
	)

	ErrSectionHasNoLessons = fmt.Errorf(
		"section has no lessons",
	)

	ErrLessonHasNoVideo = fmt.Errorf(
		"lesson has no video",
	)
)

func (p *Publisher) Validate(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) error {
	course, err := p.courses.Find(
		ctx,
		tenantID,
		courseID,
	)

	if err != nil {
		return ErrCourseNotFound
	}

	if course.Status == database.CourseStatusPublished {
		return ErrCourseAlreadyPublished
	}

	if course.Status == database.CourseStatusArchived {
		return ErrCourseArchived
	}

	sections, err := p.sections.List(
		ctx,
		courseID,
	)

	if err != nil {
		return fmt.Errorf(
			"load sections: %w",
			err,
		)
	}

	if len(sections) == 0 {
		return ErrCourseHasNoSections
	}

	for _, section := range sections {
		lessons, err := p.lessons.List(
			ctx,
			section.ID,
		)

		if err != nil {
			return fmt.Errorf(
				"load lessons: %w",
				err,
			)
		}

		if len(lessons) == 0 {
			return ErrSectionHasNoLessons
		}

		for _, lesson := range lessons {
			if lesson.VideoAssetID == nil {
				return fmt.Errorf(
					"%w: %s",
					ErrLessonHasNoVideo,
					lesson.Title,
				)
			}
		}
	}

	return nil
}

func (p *Publisher) Publish(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) error {
	if err := p.Validate(
		ctx,
		tenantID,
		courseID,
	); err != nil {
		return err
	}

	return p.courses.Publish(
		ctx,
		tenantID,
		courseID,
	)
}

func (p *Publisher) Archive(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) error {
	course, err := p.courses.Find(
		ctx,
		tenantID,
		courseID,
	)

	if err != nil {
		return ErrCourseNotFound
	}

	if course.Status != database.CourseStatusPublished {
		return fmt.Errorf("only published courses can be archived")
	}

	return p.courses.Archive(
		ctx,
		tenantID,
		courseID,
	)
}
