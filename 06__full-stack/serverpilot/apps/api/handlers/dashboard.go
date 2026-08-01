package handlers

import (
	"encoding/json"
	"net/http"

	apperrors "github.com/ShaharyarShakir/serverpilot/apps/api/errors"
	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/responses"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
	"github.com/ShaharyarShakir/serverpilot/apps/api/validation"
	"github.com/gorilla/mux"
)

// DashboardHandler routes incoming REST queries to the service layer.
type DashboardHandler struct {
	dashboardService *services.DashboardService
	serverService    *services.ServerService
}

// NewDashboardHandler returns a new DashboardHandler instance.
func NewDashboardHandler(dashboardService *services.DashboardService, serverService *services.ServerService) *DashboardHandler {
	return &DashboardHandler{
		dashboardService: dashboardService,
		serverService:    serverService,
	}
}

// GetDashboard returns aggregated cluster stats and metrics charts.
func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	stats := h.dashboardService.GetDashboardStats()
	responses.OK(w, stats)
}

// GetServers returns filtered servers.
func (h *DashboardHandler) GetServers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := q.Get("search")
	status := q.Get("status")
	provider := q.Get("provider")

	list := h.dashboardService.GetServers(search, status, provider)
	responses.OK(w, list)
}

// CreateServer adds a new server and credentials to the cluster.
func (h *DashboardHandler) CreateServer(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name          string   `json:"name"`
		IP            string   `json:"ip"`
		OS            string   `json:"os"`
		Provider      string   `json:"provider"`
		Location      string   `json:"location"`
		Tags          []string `json:"tags"`
		SSHPort       int      `json:"ssh_port"`
		SSHUser       string   `json:"ssh_user"`
		SSHAuthMethod string   `json:"ssh_auth_method"`
		SSHPassword   string   `json:"ssh_password"`
		SSHPrivateKey string   `json:"ssh_private_key"`
		SSHPassphrase string   `json:"ssh_passphrase"`
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
		body.SSHPort,
		body.SSHUser,
		body.SSHAuthMethod,
		body.SSHPassword,
		body.SSHPrivateKey,
		body.SSHPassphrase,
	)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	newSrv, err := h.dashboardService.AddServer(
		r.Context(),
		input.Name,
		input.IP,
		input.OS,
		input.Provider,
		input.Location,
		input.Tags,
		input.SSHPort,
		input.SSHUser,
		input.SSHAuthMethod,
		input.SSHPassword,
		input.SSHPrivateKey,
		input.SSHPassphrase,
	)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

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

	err = h.dashboardService.PowerAction(input.IDs, input.Action)
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

	err = h.dashboardService.BulkDelete(input.IDs)
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
	list := h.dashboardService.GetActivityLogs()
	responses.OK(w, list)
}

// GetNotifications returns active alerts.
func (h *DashboardHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	list := h.dashboardService.GetNotifications()
	responses.OK(w, list)
}

// MarkRead clears notification alerts.
func (h *DashboardHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	h.dashboardService.MarkNotificationsRead()
	responses.OK(w, map[string]string{
		"message": "Notifications marked as read",
	})
}

// TestConnection checks the SSH connection of parameters before saving them.
func (h *DashboardHandler) TestConnection(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IP            string `json:"ip"`
		SSHPort       int    `json:"ssh_port"`
		SSHUser       string `json:"ssh_user"`
		SSHAuthMethod string `json:"ssh_auth_method"`
		SSHPassword   string `json:"ssh_password"`
		SSHPrivateKey string `json:"ssh_private_key"`
		SSHPassphrase string `json:"ssh_passphrase"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		responses.BadRequest(w, "Invalid request body")
		return
	}

	info, err := h.serverService.TestConnection(
		r.Context(),
		body.IP,
		body.SSHPort,
		body.SSHUser,
		body.SSHAuthMethod,
		body.SSHPassword,
		body.SSHPrivateKey,
		body.SSHPassphrase,
	)
	if err != nil {
		responses.OK(w, map[string]any{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	responses.OK(w, map[string]any{
		"success":     true,
		"message":     "SSH Connection successful!",
		"system_info": info,
	})
}

// GetServerDetails returns detailed metadata of a specific server.
func (h *DashboardHandler) GetServerDetails(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	serverID := vars["id"]

	srv := h.dashboardService.GetServers("", "", "")
	var target *models.Server
	for _, s := range srv {
		if s.ID == serverID {
			target = s
			break
		}
	}

	if target == nil {
		responses.Error(w, http.StatusNotFound, "Server not found", apperrors.CodeNotFound)
		return
	}

	responses.OK(w, target)
}

// ListProcesses returns the remote process list of a server.
func (h *DashboardHandler) ListProcesses(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	serverID := vars["id"]

	list, err := h.serverService.ListProcesses(r.Context(), serverID)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	responses.OK(w, list)
}

// ManageSystemdService controls a systemd service unit on a server.
func (h *DashboardHandler) ManageSystemdService(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	serverID := vars["id"]

	var body struct {
		ServiceName string `json:"service_name"`
		Action      string `json:"action"` // "start", "stop", "restart"
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		responses.BadRequest(w, "Invalid request body")
		return
	}

	err := h.serverService.ManageService(r.Context(), serverID, body.ServiceName, body.Action)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	responses.OK(w, map[string]string{
		"message": "Service action completed successfully",
	})
}

// GetMetricsHistory returns metrics snapshots history for a server.
func (h *DashboardHandler) GetMetricsHistory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	serverID := vars["id"]

	list, err := h.dashboardService.GetMetricsHistory(r.Context(), serverID)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	responses.OK(w, list)
}
