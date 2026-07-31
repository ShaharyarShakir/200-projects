package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/ShaharyarShakir/serverpilot/apps/api/responses"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
	"github.com/ShaharyarShakir/serverpilot/apps/api/validation"
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
	stats := h.service.GetDashboardStats()
	responses.OK(w, stats)
}

// GetServers returns filtered servers.
func (h *DashboardHandler) GetServers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := q.Get("search")
	status := q.Get("status")
	provider := q.Get("provider")

	list := h.service.GetServers(search, status, provider)
	responses.OK(w, list)
}

// CreateServer adds a new virtual server to the cluster.
func (h *DashboardHandler) CreateServer(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string   `json:"name"`
		IP       string   `json:"ip"`
		OS       string   `json:"os"`
		Provider string   `json:"provider"`
		Location string   `json:"location"`
		Tags     []string `json:"tags"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		responses.BadRequest(w, "Invalid request body")
		return
	}

	// Validate inputs using the centralized validation package
	input, err := validation.ValidateCreateServerInput(
		body.Name,
		body.IP,
		body.OS,
		body.Provider,
		body.Location,
		body.Tags,
	)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	newSrv := h.service.AddServer(
		input.Name,
		input.IP,
		input.OS,
		input.Provider,
		input.Location,
		input.Tags,
	)
	responses.Created(w, newSrv)
}

// PowerAction handles bulk start/stop/reboot actions.
func (h *DashboardHandler) PowerAction(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDs    []string `json:"ids"`
		Action string   `json:"action"` // "start", "stop", "restart"
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		responses.BadRequest(w, "Invalid request body")
		return
	}

	// Validate inputs using the centralized validation package
	input, err := validation.ValidatePowerAction(body.IDs, body.Action)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	err = h.service.PowerAction(input.IDs, input.Action)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	responses.OK(w, map[string]string{
		"message": "Power action sent successfully",
	})
}

// BulkDelete handles deleting multiple servers at once.
func (h *DashboardHandler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDs []string `json:"ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		responses.BadRequest(w, "Invalid request body")
		return
	}

	// Validate inputs using the centralized validation package
	input, err := validation.ValidateBulkDelete(body.IDs)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	err = h.service.BulkDelete(input.IDs)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	responses.OK(w, map[string]string{
		"message": "Servers deleted successfully",
	})
}

// GetActivity returns cluster activity history.
func (h *DashboardHandler) GetActivity(w http.ResponseWriter, r *http.Request) {
	list := h.service.GetActivityLogs()
	responses.OK(w, list)
}

// GetNotifications returns active alerts.
func (h *DashboardHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	list := h.service.GetNotifications()
	responses.OK(w, list)
}

// MarkRead clears notification alerts.
func (h *DashboardHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	h.service.MarkNotificationsRead()
	responses.OK(w, map[string]string{
		"message": "Notifications marked as read",
	})
}
