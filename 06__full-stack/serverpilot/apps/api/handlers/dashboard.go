package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
)

// DashboardHandler routes incoming REST queries to the mock service layer.
type DashboardHandler struct {
	service *services.DashboardService
}

// NewDashboardHandler returns a new DashboardHandler instance.
func NewDashboardHandler(service *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{
		service: service,
	}
}

// GetDashboard returns aggregated cluster stats and metrics charts.
func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	stats := h.service.GetDashboardStats()
	_ = json.NewEncoder(w).Encode(models.SuccessResponse(stats))
}

// GetServers returns filtered servers.
func (h *DashboardHandler) GetServers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	q := r.URL.Query()
	search := q.Get("search")
	status := q.Get("status")
	provider := q.Get("provider")

	list := h.service.GetServers(search, status, provider)
	_ = json.NewEncoder(w).Encode(models.SuccessResponse(list))
}

// CreateServer adds a new virtual server to the cluster.
func (h *DashboardHandler) CreateServer(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var input struct {
		Name     string   `json:"name"`
		IP       string   `json:"ip"`
		OS       string   `json:"os"`
		Provider string   `json:"provider"`
		Location string   `json:"location"`
		Tags     []string `json:"tags"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Invalid request body", http.StatusBadRequest))
		return
	}

	input.Name = strings.TrimSpace(input.Name)
	input.IP = strings.TrimSpace(input.IP)

	if input.Name == "" || input.IP == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Name and IP address are required", http.StatusBadRequest))
		return
	}

	if input.OS == "" {
		input.OS = "Ubuntu 22.04 LTS"
	}
	if input.Provider == "" {
		input.Provider = "AWS"
	}
	if input.Location == "" {
		input.Location = "Virginia, USA"
	}

	newSrv := h.service.AddServer(input.Name, input.IP, input.OS, input.Provider, input.Location, input.Tags)
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(models.SuccessResponse(newSrv))
}

// PowerAction handles bulk start/stop/reboot actions.
func (h *DashboardHandler) PowerAction(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var input struct {
		IDs    []string `json:"ids"`
		Action string   `json:"action"` // "start", "stop", "restart"
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Invalid request body", http.StatusBadRequest))
		return
	}

	if len(input.IDs) == 0 || input.Action == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Server IDs and action are required", http.StatusBadRequest))
		return
	}

	err := h.service.PowerAction(input.IDs, input.Action)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse(err.Error(), http.StatusInternalServerError))
		return
	}

	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]string{
		"message": "Power action sent successfully",
	}))
}

// BulkDelete handles deleting multiple servers at once.
func (h *DashboardHandler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var input struct {
		IDs []string `json:"ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Invalid request body", http.StatusBadRequest))
		return
	}

	if len(input.IDs) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Server IDs are required for deletion", http.StatusBadRequest))
		return
	}

	err := h.service.BulkDelete(input.IDs)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse(err.Error(), http.StatusInternalServerError))
		return
	}

	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]string{
		"message": "Servers deleted successfully",
	}))
}

// GetActivity returns cluster activity history.
func (h *DashboardHandler) GetActivity(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	list := h.service.GetActivityLogs()
	_ = json.NewEncoder(w).Encode(models.SuccessResponse(list))
}

// GetNotifications returns active alerts.
func (h *DashboardHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	list := h.service.GetNotifications()
	_ = json.NewEncoder(w).Encode(models.SuccessResponse(list))
}

// MarkRead clears notification alerts.
func (h *DashboardHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	h.service.MarkNotificationsRead()
	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]string{
		"message": "Notifications marked as read",
	}))
}
