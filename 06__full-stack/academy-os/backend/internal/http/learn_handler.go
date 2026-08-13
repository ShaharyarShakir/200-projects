package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
)

type LearnHandler struct {
	academies   *database.AcademyRepository
	courses     *database.CourseRepository
	sections    *database.SectionRepository
	lessons     *database.LessonRepository
	assets      *database.AssetRepository
	enrollments *database.EnrollmentRepository
	progress    *database.LessonProgressRepository
	s3          *storage.Service
}

func NewLearnHandler(
	academies *database.AcademyRepository,
	courses *database.CourseRepository,
	sections *database.SectionRepository,
	lessons *database.LessonRepository,
	assets *database.AssetRepository,
	enrollments *database.EnrollmentRepository,
	progress *database.LessonProgressRepository,
	s3 *storage.Service,
) *LearnHandler {
	return &LearnHandler{
		academies:   academies,
		courses:     courses,
		sections:    sections,
		lessons:     lessons,
		assets:      assets,
		enrollments: enrollments,
		progress:    progress,
		s3:          s3,
	}
}

func (h *LearnHandler) resolveAcademyAndUser(r *http.Request) (uuid.UUID, database.UserRecord, bool) {
	user, ok := middleware.UserRecordFromContext(r.Context())
	if !ok {
		return uuid.Nil, database.UserRecord{}, false
	}

	if acadCtx, aOk := middleware.AcademyContextFromContext(r.Context()); aOk {
		return acadCtx.Academy.ID, user, true
	}

	return uuid.Nil, user, true
}

func (h *LearnHandler) GetCourse(w http.ResponseWriter, r *http.Request) {
	academyID, user, ok := h.resolveAcademyAndUser(r)
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

	if academyID == uuid.Nil {
		if cRec, findErr := h.courses.FindByID(r.Context(), courseID); findErr == nil {
			academyID = cRec.AcademyID
		}
	}

	isEnrolled, err := h.enrollments.IsEnrolled(r.Context(), academyID, user.ID, courseID)
	if err != nil || !isEnrolled {
		http.Error(w, "forbidden: not enrolled in this course", http.StatusForbidden)
		return
	}

	courseRecord, err := h.courses.FindPublishedByID(r.Context(), academyID, courseID)
	if err != nil {
		if cRec, findErr := h.courses.FindByID(r.Context(), courseID); findErr == nil {
			courseRecord = cRec
		} else {
			http.Error(w, "course not found", http.StatusNotFound)
			return
		}
	}

	sections, err := h.sections.List(r.Context(), courseID)
	if err != nil {
		http.Error(w, "failed to list sections", http.StatusInternalServerError)
		return
	}

	progressMap, err := h.progress.GetProgressForCourse(r.Context(), academyID, user.ID, courseID)
	if err != nil {
		progressMap = make(map[uuid.UUID]database.LessonProgressRecord)
	}

	type LearnLessonItem struct {
		ID              uuid.UUID `json:"id"`
		Title           string    `json:"title"`
		Position        int       `json:"position"`
		Completed       bool      `json:"completed"`
		PositionSeconds int       `json:"position_seconds"`
		VideoStatus     string    `json:"video_status"`
	}

	type LearnSectionItem struct {
		ID       uuid.UUID         `json:"id"`
		Title    string            `json:"title"`
		Position int               `json:"position"`
		Lessons  []LearnLessonItem `json:"lessons"`
	}

	totalLessons := 0
	completedLessons := 0
	sectionOutlines := make([]LearnSectionItem, 0, len(sections))

	for _, sec := range sections {
		lessonList, err := h.lessons.List(r.Context(), sec.ID)
		if err != nil {
			lessonList = nil
		}

		lessonOutlines := make([]LearnLessonItem, 0, len(lessonList))
		for _, l := range lessonList {
			totalLessons++
			prog, hasProg := progressMap[l.ID]

			isCompleted := hasProg && prog.CompletedAt != nil
			posSec := 0
			if hasProg {
				posSec = prog.PositionSeconds
			}
			if isCompleted {
				completedLessons++
			}

			vidStatus := "pending"
			if l.VideoAssetID != nil {
				if asset, err := h.assets.GetByID(r.Context(), *l.VideoAssetID); err == nil {
					vidStatus = asset.Status
				}
			}

			lessonOutlines = append(lessonOutlines, LearnLessonItem{
				ID:              l.ID,
				Title:           l.Title,
				Position:        l.Position,
				Completed:       isCompleted,
				PositionSeconds: posSec,
				VideoStatus:     vidStatus,
			})
		}

		sectionOutlines = append(sectionOutlines, LearnSectionItem{
			ID:       sec.ID,
			Title:    sec.Title,
			Position: sec.Position,
			Lessons:  lessonOutlines,
		})
	}

	percentComplete := 0
	if totalLessons > 0 {
		percentComplete = (completedLessons * 100) / totalLessons
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"course":            courseRecord,
		"sections":          sectionOutlines,
		"total_lessons":     totalLessons,
		"completed_lessons": completedLessons,
		"percent_complete":  percentComplete,
	})
}

func (h *LearnHandler) GetVideo(w http.ResponseWriter, r *http.Request) {
	academyID, user, ok := h.resolveAcademyAndUser(r)
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

	if academyID == uuid.Nil {
		if cRec, findErr := h.courses.FindByID(r.Context(), courseID); findErr == nil {
			academyID = cRec.AcademyID
		}
	}

	isEnrolled, err := h.enrollments.IsEnrolled(r.Context(), academyID, user.ID, courseID)
	if err != nil || !isEnrolled {
		http.Error(w, "forbidden: not enrolled in course", http.StatusForbidden)
		return
	}

	lessonIDRaw := r.PathValue("lessonID")
	lessonID, err := uuid.Parse(lessonIDRaw)
	if err != nil {
		http.Error(w, "invalid lesson id", http.StatusBadRequest)
		return
	}

	lesson, err := h.lessons.Find(r.Context(), lessonID)
	if err != nil {
		http.Error(w, "lesson not found", http.StatusNotFound)
		return
	}

	if lesson.VideoAssetID == nil {
		http.Error(w, "lesson has no video asset attached", http.StatusNotFound)
		return
	}

	asset, err := h.assets.GetByID(r.Context(), *lesson.VideoAssetID)
	if err != nil {
		http.Error(w, "asset not found", http.StatusNotFound)
		return
	}

	if asset.Status != database.AssetStatusReady {
		http.Error(w, "video asset is not ready", http.StatusPreconditionFailed)
		return
	}

	streamURL := "/api/video-assets/" + asset.ID.String() + "/stream/master.m3u8"

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"url":        streamURL,
		"expires_in": 3600,
	})
}

func (h *LearnHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	academyID, user, ok := h.resolveAcademyAndUser(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	lessonIDRaw := r.PathValue("lessonID")
	lessonID, err := uuid.Parse(lessonIDRaw)
	if err != nil {
		http.Error(w, "invalid lesson id", http.StatusBadRequest)
		return
	}

	prog, err := h.progress.GetProgress(r.Context(), academyID, user.ID, lessonID)
	if err != nil {
		http.Error(w, "failed to get progress", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(prog)
}

type UpdateProgressRequest struct {
	PositionSeconds int `json:"position_seconds"`
}

func (h *LearnHandler) UpdateProgress(w http.ResponseWriter, r *http.Request) {
	academyID, user, ok := h.resolveAcademyAndUser(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	lessonIDRaw := r.PathValue("lessonID")
	lessonID, err := uuid.Parse(lessonIDRaw)
	if err != nil {
		http.Error(w, "invalid lesson id", http.StatusBadRequest)
		return
	}

	var req UpdateProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	prog, err := h.progress.UpsertProgress(r.Context(), academyID, user.ID, lessonID, req.PositionSeconds)
	if err != nil {
		http.Error(w, "failed to update progress", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(prog)
}

func (h *LearnHandler) CompleteLesson(w http.ResponseWriter, r *http.Request) {
	academyID, user, ok := h.resolveAcademyAndUser(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	lessonIDRaw := r.PathValue("lessonID")
	lessonID, err := uuid.Parse(lessonIDRaw)
	if err != nil {
		http.Error(w, "invalid lesson id", http.StatusBadRequest)
		return
	}

	prog, err := h.progress.MarkComplete(r.Context(), academyID, user.ID, lessonID)
	if err != nil {
		http.Error(w, "failed to mark lesson complete", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(prog)
}
