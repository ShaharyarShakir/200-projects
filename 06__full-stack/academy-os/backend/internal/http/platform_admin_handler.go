package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
)

type PlatformAdminHandler struct {
	academies *database.AcademyRepository
	users     *database.UserRepository
	courses   *database.CourseRepository
}

func NewPlatformAdminHandler(
	academies *database.AcademyRepository,
	users *database.UserRepository,
	courses *database.CourseRepository,
) *PlatformAdminHandler {
	return &PlatformAdminHandler{
		academies: academies,
		users:     users,
		courses:   courses,
	}
}

func (h *PlatformAdminHandler) ListAcademies(w http.ResponseWriter, r *http.Request) {
	acadList, err := h.academies.ListAll(r.Context())
	if err != nil {
		http.Error(w, "failed to list academies: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if acadList == nil {
		acadList = []database.AcademyRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"academies": acadList,
	})
}

func (h *PlatformAdminHandler) ListInstructors(w http.ResponseWriter, r *http.Request) {
	userList, err := h.users.ListAll(r.Context())
	if err != nil {
		http.Error(w, "failed to list users: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if userList == nil {
		userList = []database.UserRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"users": userList,
	})
}

type UpdateAcademyStatusRequest struct {
	Status string `json:"status"`
}

func (h *PlatformAdminHandler) UpdateAcademyStatus(w http.ResponseWriter, r *http.Request) {
	academyIDStr := r.PathValue("academyID")
	academyID, err := uuid.Parse(academyIDStr)
	if err != nil {
		http.Error(w, "invalid academy id", http.StatusBadRequest)
		return
	}

	var req UpdateAcademyStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Status != "active" && req.Status != "suspended" {
		http.Error(w, "status must be active or suspended", http.StatusBadRequest)
		return
	}

	if err := h.academies.UpdateStatus(r.Context(), academyID, req.Status); err != nil {
		http.Error(w, "failed to update status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": "status updated successfully",
	})
}

func (h *PlatformAdminHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	acadList, _ := h.academies.ListAll(r.Context())
	userList, _ := h.users.ListAll(r.Context())

	instructorCount := 0
	adminCount := 0
	for _, u := range userList {
		if u.Role == "PLATFORM_ADMIN" {
			adminCount++
		} else {
			instructorCount++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"totalAcademies":   len(acadList),
		"totalInstructors": instructorCount,
		"totalAdmins":      adminCount,
	})
}
