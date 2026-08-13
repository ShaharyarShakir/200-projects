package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/course"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
)

type CourseHandler struct {
	courses   *course.Service
	publisher *course.Publisher
}

func NewCourseHandler(
	courses *course.Service,
	publisher *course.Publisher,
) *CourseHandler {
	return &CourseHandler{
		courses:   courses,
		publisher: publisher,
	}
}

type CreateCourseRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type UpdateCourseRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func (h *CourseHandler) Create(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	var request CreateCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	createdCourse, err := h.courses.Create(
		r.Context(),
		acadCtx.Academy.ID,
		acadCtx.User.ID,
		request.Title,
		request.Description,
	)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"message": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(createdCourse)
}

func (h *CourseHandler) List(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courses, err := h.courses.List(
		r.Context(),
		acadCtx.Academy.ID,
	)

	if err != nil {
		http.Error(w, "failed to list courses", http.StatusInternalServerError)
		return
	}

	if courses == nil {
		courses = []database.CourseRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"courses": courses,
	})
}

func (h *CourseHandler) Get(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseIDStr := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	courseRecord, err := h.courses.Find(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
	)
	if err != nil {
		http.Error(w, "course not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(courseRecord)
}

func (h *CourseHandler) Update(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseIDStr := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	var request UpdateCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.courses.Update(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
		request.Title,
		request.Description,
	); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *CourseHandler) Delete(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseIDStr := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	if err := h.courses.Delete(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
	); err != nil {
		http.Error(w, "course not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type CreateSectionRequest struct {
	Title    string `json:"title"`
	Position int    `json:"position"`
}

type CreateLessonRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Position    int    `json:"position"`
}

func (h *CourseHandler) CreateSection(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseIDStr := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	var request CreateSectionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	createdSection, err := h.courses.CreateSection(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
		request.Title,
		request.Position,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(createdSection)
}

func (h *CourseHandler) ListSections(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseIDStr := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	sections, err := h.courses.ListSections(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if sections == nil {
		sections = []database.SectionRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"sections": sections,
	})
}

func (h *CourseHandler) CreateLesson(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseIDStr := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	sectionIDStr := r.PathValue("sectionID")
	sectionID, err := uuid.Parse(sectionIDStr)
	if err != nil {
		http.Error(w, "invalid section ID", http.StatusBadRequest)
		return
	}

	var request CreateLessonRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	createdLesson, err := h.courses.CreateLesson(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
		sectionID,
		request.Title,
		request.Description,
		request.Position,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(createdLesson)
}

func (h *CourseHandler) GetStructure(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseIDStr := r.PathValue("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	structure, err := h.courses.GetStructure(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
	)
	if err != nil {
		http.Error(w, "course not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(structure)
}

func (h *CourseHandler) Publish(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseID, err := uuid.Parse(r.PathValue("courseID"))
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	err = h.publisher.Publish(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *CourseHandler) Archive(
	w http.ResponseWriter,
	r *http.Request,
) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	courseID, err := uuid.Parse(r.PathValue("courseID"))
	if err != nil {
		http.Error(w, "invalid course ID", http.StatusBadRequest)
		return
	}

	err = h.publisher.Archive(
		r.Context(),
		acadCtx.Academy.ID,
		courseID,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
