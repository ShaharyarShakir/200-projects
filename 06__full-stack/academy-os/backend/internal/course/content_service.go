package course

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
)

type CourseStructure struct {
	ID          uuid.UUID            `json:"id"`
	Title       string               `json:"title"`
	Description string               `json:"description"`
	Slug        string               `json:"slug"`
	Status      string               `json:"status"`
	Sections    []SectionWithLessons `json:"sections"`
}

type SectionWithLessons struct {
	ID       uuid.UUID               `json:"id"`
	CourseID uuid.UUID               `json:"course_id"`
	Title    string                  `json:"title"`
	Position int                     `json:"position"`
	Lessons  []database.LessonRecord `json:"lessons"`
}

func (s *Service) CreateSection(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
	title string,
	position int,
) (database.SectionRecord, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return database.SectionRecord{}, fmt.Errorf("title is required")
	}

	_, err := s.courses.Find(ctx, tenantID, courseID)
	if err != nil {
		return database.SectionRecord{}, fmt.Errorf("course not found: %w", err)
	}

	return s.sections.Create(ctx, courseID, title, position)
}

func (s *Service) ListSections(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) ([]database.SectionRecord, error) {
	_, err := s.courses.Find(ctx, tenantID, courseID)
	if err != nil {
		return nil, fmt.Errorf("course not found: %w", err)
	}

	return s.sections.List(ctx, courseID)
}

func (s *Service) CreateLesson(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
	sectionID uuid.UUID,
	title string,
	description string,
	position int,
) (database.LessonRecord, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return database.LessonRecord{}, fmt.Errorf("title is required")
	}

	_, err := s.courses.Find(ctx, tenantID, courseID)
	if err != nil {
		return database.LessonRecord{}, fmt.Errorf("course not found: %w", err)
	}

	section, err := s.sections.Find(ctx, sectionID)
	if err != nil {
		return database.LessonRecord{}, fmt.Errorf("section not found: %w", err)
	}
	if section.CourseID != courseID {
		return database.LessonRecord{}, fmt.Errorf("section does not belong to course")
	}

	return s.lessons.Create(ctx, courseID, sectionID, title, description, position)
}

func (s *Service) GetStructure(
	ctx context.Context,
	tenantID uuid.UUID,
	courseID uuid.UUID,
) (CourseStructure, error) {
	courseRecord, err := s.courses.Find(ctx, tenantID, courseID)
	if err != nil {
		return CourseStructure{}, fmt.Errorf("course structure lookup: %w", err)
	}

	sectionRecords, err := s.sections.List(ctx, courseID)
	if err != nil {
		return CourseStructure{}, fmt.Errorf("list sections: %w", err)
	}

	sectionsWithLessons := make([]SectionWithLessons, 0, len(sectionRecords))

	for _, sec := range sectionRecords {
		lessonRecords, err := s.lessons.List(ctx, sec.ID)
		if err != nil {
			return CourseStructure{}, fmt.Errorf("list lessons for section %s: %w", sec.ID, err)
		}

		if lessonRecords == nil {
			lessonRecords = []database.LessonRecord{}
		}

		sectionsWithLessons = append(sectionsWithLessons, SectionWithLessons{
			ID:       sec.ID,
			CourseID: sec.CourseID,
			Title:    sec.Title,
			Position: sec.Position,
			Lessons:  lessonRecords,
		})
	}

	return CourseStructure{
		ID:          courseRecord.ID,
		Title:       courseRecord.Title,
		Description: courseRecord.Description,
		Slug:        courseRecord.Slug,
		Status:      courseRecord.Status,
		Sections:    sectionsWithLessons,
	}, nil
}
