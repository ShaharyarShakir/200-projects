package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
)

type PublicCourseHandler struct {
	academies   *database.AcademyRepository
	courses     *database.CourseRepository
	sections    *database.SectionRepository
	lessons     *database.LessonRepository
	enrollments *database.EnrollmentRepository
	sessions    *database.SessionRepository
}

func NewPublicCourseHandler(
	academies *database.AcademyRepository,
	courses *database.CourseRepository,
	sections *database.SectionRepository,
	lessons *database.LessonRepository,
	enrollments *database.EnrollmentRepository,
	sessions *database.SessionRepository,
) *PublicCourseHandler {
	return &PublicCourseHandler{
		academies:   academies,
		courses:     courses,
		sections:    sections,
		lessons:     lessons,
		enrollments: enrollments,
		sessions:    sessions,
	}
}

func (h *PublicCourseHandler) resolveAcademyID(r *http.Request) (uuid.UUID, error) {
	if acadCtx, ok := middleware.AcademyContextFromContext(r.Context()); ok {
		return acadCtx.Academy.ID, nil
	}
	slug := r.PathValue("slug")
	if slug == "" {
		slug = r.PathValue("tenantSlug")
	}
	if slug == "" {
		slug = r.URL.Query().Get("tenant")
	}
	if slug == "" {
		slug = r.URL.Query().Get("academy")
	}

	if slug != "" && h.academies != nil {
		acad, err := h.academies.FindBySlug(r.Context(), slug)
		if err == nil {
			return acad.ID, nil
		}
	}
	raw := r.Header.Get("X-Tenant-ID")
	if raw == "" {
		raw = r.Header.Get("X-Academy-ID")
	}
	if raw != "" {
		if id, err := uuid.Parse(raw); err == nil {
			return id, nil
		}
	}

	if h.academies != nil {
		hostVal := r.Host
		if hostVal != "" {
			acad, err := h.academies.ResolveByHost(r.Context(), hostVal)
			if err == nil && acad != nil {
				return acad.ID, nil
			}
		}
	}

	return uuid.Nil, nil
}

func (h *PublicCourseHandler) resolveOptionalUserID(r *http.Request) (uuid.UUID, bool) {
	if user, ok := middleware.UserRecordFromContext(r.Context()); ok {
		return user.ID, true
	}
	if userID, ok := middleware.UserIDFromContext(r.Context()); ok {
		return userID, true
	}
	var tokenStr string
	if cookie, err := r.Cookie("academyos_session"); err == nil && cookie.Value != "" {
		tokenStr = cookie.Value
	} else if cookie, err := r.Cookie("session_id"); err == nil && cookie.Value != "" {
		tokenStr = cookie.Value
	}
	if tokenStr == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	if tokenStr == "" {
		return uuid.Nil, false
	}

	var session database.Session
	var err error
	if sessionID, parseErr := uuid.Parse(tokenStr); parseErr == nil {
		session, err = h.sessions.Find(r.Context(), sessionID)
	}
	if err != nil || session.ID == uuid.Nil {
		return uuid.Nil, false
	}
	return session.UserID, true
}

func (h *PublicCourseHandler) ListBySlug(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		slug = r.PathValue("tenantSlug")
	}

	if slug == "" {
		http.Error(w, "academy slug required", http.StatusBadRequest)
		return
	}

	if h.academies == nil {
		http.Error(w, "academy repository uninitialized", http.StatusInternalServerError)
		return
	}

	academyRecord, err := h.academies.FindBySlug(r.Context(), slug)
	if err != nil {
		http.Error(w, "academy not found", http.StatusNotFound)
		return
	}

	publishedCourses, err := h.courses.ListPublished(r.Context(), academyRecord.ID)
	if err != nil {
		http.Error(w, "failed to list published courses", http.StatusInternalServerError)
		return
	}

	if publishedCourses == nil {
		publishedCourses = []database.CourseRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(publishedCourses)
}

func (h *PublicCourseHandler) List(w http.ResponseWriter, r *http.Request) {
	academyID, _ := h.resolveAcademyID(r)

	publishedCourses, err := h.courses.ListPublished(r.Context(), academyID)
	if err != nil {
		http.Error(w, "failed to list published courses", http.StatusInternalServerError)
		return
	}

	if publishedCourses == nil {
		publishedCourses = []database.CourseRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(publishedCourses)
}

func (h *PublicCourseHandler) Get(w http.ResponseWriter, r *http.Request) {
	academyID, _ := h.resolveAcademyID(r)

	courseIDRaw := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDRaw)
	if err != nil {
		http.Error(w, "invalid course id", http.StatusBadRequest)
		return
	}

	courseRecord, err := h.courses.FindPublishedByID(r.Context(), academyID, courseID)
	if err != nil {
		var findErr error
		if academyID != uuid.Nil {
			courseRecord, findErr = h.courses.Find(r.Context(), academyID, courseID)
		} else {
			courseRecord, findErr = h.courses.FindByID(r.Context(), courseID)
		}
		if findErr != nil {
			http.Error(w, "course not found", http.StatusNotFound)
			return
		}
	}

	sections, err := h.sections.List(r.Context(), courseID)
	if err != nil {
		http.Error(w, "failed to list sections", http.StatusInternalServerError)
		return
	}

	type LessonOutline struct {
		ID       uuid.UUID `json:"id"`
		Title    string    `json:"title"`
		Position int       `json:"position"`
	}

	type SectionOutline struct {
		ID       uuid.UUID       `json:"id"`
		Title    string          `json:"title"`
		Position int             `json:"position"`
		Lessons  []LessonOutline `json:"lessons"`
	}

	sectionOutlines := make([]SectionOutline, 0, len(sections))
	for _, sec := range sections {
		lessons, err := h.lessons.List(r.Context(), sec.ID)
		if err != nil {
			lessons = nil
		}
		lessonOutlines := make([]LessonOutline, 0, len(lessons))
		for _, l := range lessons {
			lessonOutlines = append(lessonOutlines, LessonOutline{
				ID:       l.ID,
				Title:    l.Title,
				Position: l.Position,
			})
		}
		sectionOutlines = append(sectionOutlines, SectionOutline{
			ID:       sec.ID,
			Title:    sec.Title,
			Position: sec.Position,
			Lessons:  lessonOutlines,
		})
	}

	enrolled := false
	if userID, ok := h.resolveOptionalUserID(r); ok {
		if isEnrolled, err := h.enrollments.IsEnrolled(r.Context(), academyID, userID, courseID); err == nil {
			enrolled = isEnrolled
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"course":   courseRecord,
		"sections": sectionOutlines,
		"enrolled": enrolled,
	})
}
