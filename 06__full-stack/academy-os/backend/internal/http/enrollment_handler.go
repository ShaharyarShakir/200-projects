package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
)

type EnrollmentHandler struct {
	academies   *database.AcademyRepository
	courses     *database.CourseRepository
	enrollments *database.EnrollmentRepository
}

func NewEnrollmentHandler(
	academies *database.AcademyRepository,
	courses *database.CourseRepository,
	enrollments *database.EnrollmentRepository,
) *EnrollmentHandler {
	return &EnrollmentHandler{
		academies:   academies,
		courses:     courses,
		enrollments: enrollments,
	}
}

func (h *EnrollmentHandler) Enroll(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserRecordFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	courseIDRaw := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDRaw)
	if err != nil {
		http.Error(w, "invalid course id", http.StatusBadRequest)
		return
	}

	var academyID uuid.UUID
	if acadCtx, aOk := middleware.AcademyContextFromContext(r.Context()); aOk {
		academyID = acadCtx.Academy.ID
	} else {
		// Resolve course to get its academy_id
		courseRecord, findErr := h.courses.FindByID(r.Context(), courseID)
		if findErr != nil {
			http.Error(w, "course not found", http.StatusNotFound)
			return
		}
		academyID = courseRecord.AcademyID
	}

	_, err = h.courses.FindPublishedByID(r.Context(), academyID, courseID)
	if err != nil {
		// allow enrollment if course exists
		if _, findErr := h.courses.FindByID(r.Context(), courseID); findErr != nil {
			http.Error(w, "course not found", http.StatusNotFound)
			return
		}
	}

	_, err = h.enrollments.Create(r.Context(), academyID, user.ID, courseID)
	if err != nil {
		http.Error(w, "failed to enroll course: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"course_id": courseID,
		"enrolled":  true,
	})
}

func (h *EnrollmentHandler) ListAcademyStudents(w http.ResponseWriter, r *http.Request) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	enrollments, err := h.enrollments.ListByAcademyID(r.Context(), acadCtx.Academy.ID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"students": []any{}})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"students": enrollments,
	})
}
