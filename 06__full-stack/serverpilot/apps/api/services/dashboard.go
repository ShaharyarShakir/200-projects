package services

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/ShaharyarShakir/serverpilot/apps/api/ssh"
)

// DashboardService coordinates aggregates, infrastructure nodes, and activity records from the database.
type DashboardService struct {
	serverRepo   repository.ServerRepository
	metricsRepo  repository.MetricsRepository
	activityRepo repository.ActivityRepository
	sshPool      *ssh.SSHConnectionPool
}

// NewDashboardService creates a new DashboardService and handles DB seeding if empty.
func NewDashboardService(
	serverRepo repository.ServerRepository,
	metricsRepo repository.MetricsRepository,
	activityRepo repository.ActivityRepository,
	sshPool *ssh.SSHConnectionPool,
) *DashboardService {
	s := &DashboardService{
		serverRepo:   serverRepo,
		metricsRepo:  metricsRepo,
		activityRepo: activityRepo,
		sshPool:      sshPool,
	}

	// Seed database with default virtual/local servers if empty
	s.seedIfEmpty()

	return s
}

// GetDashboardStats computes real-time aggregates and structures telemetry history curves.
func (s *DashboardService) GetDashboardStats() *models.DashboardStats {
	ctx := context.Background()
	servers, err := s.serverRepo.GetAll(ctx)
	if err != nil {
		return &models.DashboardStats{}
	}

	totalServers := len(servers)
	onlineCount := 0
	offlineCount := 0

	var cpuSum, ramSum float64
	var totalDisk, usedDisk float64

	for _, srv := range servers {
		if srv.Status == "online" {
			onlineCount++
			cpuSum += srv.CPUUsage
			ramSum += srv.MemoryUsage
		} else if srv.Status == "offline" {
			offlineCount++
		}

		totalDisk += srv.DiskTotal
		usedDisk += srv.DiskTotal * (srv.DiskUsage / 100.0)
	}

	avgCPU := 0.0
	avgRAM := 0.0
	if onlineCount > 0 {
		avgCPU = cpuSum / float64(onlineCount)
		avgRAM = ramSum / float64(onlineCount)
	}

	// Retrieve real telemetry historical charts (last 7 hours)
	cpuHist, memHist, netHist, err := s.metricsRepo.GetAggregatedHistory(ctx, 7)
	if err != nil || len(cpuHist) < 7 {
		// Fallback to empty metrics
		cpuHist = make([]models.MetricPoint, 7)
		memHist = make([]models.MetricPoint, 7)
		netHist = make([]models.MetricPoint, 7)
		now := time.Now()
		for i := 6; i >= 0; i-- {
			t := now.Add(time.Duration(-i) * time.Hour)
			timeStr := t.Format("15:04")
			cpuHist[6-i] = models.MetricPoint{Timestamp: timeStr, Value: 0.0}
			memHist[6-i] = models.MetricPoint{Timestamp: timeStr, Value: 0.0}
			netHist[6-i] = models.MetricPoint{Timestamp: timeStr, Value: 0.0}
		}
	}

	// Match current averages in the last hour slot for visual continuity
	if len(cpuHist) > 0 {
		cpuHist[len(cpuHist)-1].Value = math.Round(avgCPU*10) / 10
		memHist[len(memHist)-1].Value = math.Round(avgRAM*10) / 10
	}

	return &models.DashboardStats{
		TotalServers:      totalServers,
		OnlineServers:     onlineCount,
		OfflineServers:    offlineCount,
		AvgCPUUsage:       math.Round(avgCPU*10) / 10,
		AvgMemoryUsage:    math.Round(avgRAM*10) / 10,
		TotalDiskCapacity: math.Round(totalDisk*10) / 10,
		TotalDiskUsed:     math.Round(usedDisk*10) / 10,
		CPUHistory:        cpuHist,
		MemoryHistory:     memHist,
		NetworkHistory:    netHist,
	}
}

// GetServers returns filtered servers.
func (s *DashboardService) GetServers(search, status, provider string) []*models.Server {
	ctx := context.Background()
	servers, err := s.serverRepo.GetAll(ctx)
	if err != nil {
		return []*models.Server{}
	}

	var result []*models.Server
	for _, srv := range servers {
		if status != "" && strings.ToLower(srv.Status) != strings.ToLower(status) {
			continue
		}
		if provider != "" && strings.ToLower(srv.Provider) != strings.ToLower(provider) {
			continue
		}
		if search != "" {
			query := strings.ToLower(search)
			matchesName := strings.Contains(strings.ToLower(srv.Name), query)
			matchesIP := strings.Contains(srv.IP, query)
			matchesLocation := strings.Contains(strings.ToLower(srv.Location), query)

			tagMatch := false
			for _, t := range srv.Tags {
				if strings.Contains(strings.ToLower(t), query) {
					tagMatch = true
					break
				}
			}

			if !matchesName && !matchesIP && !matchesLocation && !tagMatch {
				continue
			}
		}
		result = append(result, srv)
	}

	return result
}

// AddServer inserts a new server configuration into the database.
func (s *DashboardService) AddServer(
	ctx context.Context,
	name, ip, os, provider, location string,
	tags []string,
	sshPort int,
	sshUser, sshAuthMethod, sshPassword, sshPrivateKey, sshPassphrase string,
) (*models.Server, error) {
	id := fmt.Sprintf("srv_%d", time.Now().UnixNano())
	newServer := &models.Server{
		ID:            id,
		Name:          name,
		IP:            ip,
		Status:        "offline", // Starts offline, background collector will connect
		OS:            os,
		Location:      location,
		Provider:      provider,
		Tags:          tags,
		SSHPort:       sshPort,
		SSHUser:       sshUser,
		SSHAuthMethod: sshAuthMethod,
		SSHPassword:   sshPassword,
		SSHPrivateKey: sshPrivateKey,
		SSHPassphrase: sshPassphrase,
	}

	err := s.serverRepo.Create(ctx, newServer)
	if err != nil {
		return nil, fmt.Errorf("failed to save server: %w", err)
	}

	// Create activity log
	_ = s.activityRepo.CreateActivity(ctx, &models.Activity{
		ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
		Message:   fmt.Sprintf("Added server '%s' (%s) to console.", name, ip),
		Type:      "success",
		User:      "admin@serverpilot.io",
		ServerID:  id,
		CreatedAt: time.Now(),
	})

	return newServer, nil
}

// PowerAction runs power control routines (reboot / shutdown) on remote Linux hosts.
func (s *DashboardService) PowerAction(serverIDs []string, action string) error {
	ctx := context.Background()
	action = strings.ToLower(action)

	for _, id := range serverIDs {
		srv, err := s.serverRepo.GetByID(ctx, id)
		if err != nil {
			continue
		}

		var cmd string
		var msg string
		if action == "restart" {
			cmd = "reboot"
			msg = fmt.Sprintf("Server '%s' reboot command issued via SSH.", srv.Name)
		} else if action == "stop" {
			cmd = "poweroff"
			msg = fmt.Sprintf("Server '%s' poweroff command issued via SSH.", srv.Name)
		} else if action == "start" {
			// Cannot start an offline server via SSH
			_ = s.activityRepo.CreateActivity(ctx, &models.Activity{
				ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
				Message:   fmt.Sprintf("Power-on action for '%s' ignored (cannot dial offline host).", srv.Name),
				Type:      "error",
				User:      "admin@serverpilot.io",
				ServerID:  srv.ID,
				CreatedAt: time.Now(),
			})
			continue
		} else {
			return fmt.Errorf("unsupported power action: %s", action)
		}

		// Run SSH command asynchronously to prevent blocking API handlers
		go func(srvID string, srvName string, c string, logMsg string) {
			_, err := s.sshPool.RunCommand(srvID, c)
			if err != nil {
				// Try sudo fallback
				_, errSudo := s.sshPool.RunCommand(srvID, "sudo "+c)
				if errSudo != nil {
					_ = s.activityRepo.CreateActivity(context.Background(), &models.Activity{
						ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
						Message:   fmt.Sprintf("Failed to execute power action '%s' on '%s': %v", action, srvName, errSudo),
						Type:      "error",
						User:      "admin@serverpilot.io",
						ServerID:  srvID,
						CreatedAt: time.Now(),
					})
					return
				}
			}

			_ = s.activityRepo.CreateActivity(context.Background(), &models.Activity{
				ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
				Message:   logMsg,
				Type:      "info",
				User:      "admin@serverpilot.io",
				ServerID:  srvID,
				CreatedAt: time.Now(),
			})
		}(srv.ID, srv.Name, cmd, msg)
	}

	return nil
}

// BulkDelete deletes a batch of servers from database.
func (s *DashboardService) BulkDelete(serverIDs []string) error {
	ctx := context.Background()
	for _, id := range serverIDs {
		srv, err := s.serverRepo.GetByID(ctx, id)
		if err == nil {
			_ = s.activityRepo.CreateActivity(ctx, &models.Activity{
				ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
				Message:   fmt.Sprintf("Server '%s' removed from account console.", srv.Name),
				Type:      "warning",
				User:      "admin@serverpilot.io",
				CreatedAt: time.Now(),
			})
			s.sshPool.RemoveServer(id)
		}
	}

	return s.serverRepo.DeleteBulk(ctx, serverIDs)
}

// GetActivityLogs returns activities log list.
func (s *DashboardService) GetActivityLogs() []*models.Activity {
	ctx := context.Background()
	list, err := s.activityRepo.GetActivities(ctx, 30)
	if err != nil {
		return []*models.Activity{}
	}
	return list
}

// GetNotifications returns notifications list.
func (s *DashboardService) GetNotifications() []*models.Notification {
	ctx := context.Background()
	list, err := s.activityRepo.GetNotifications(ctx)
	if err != nil {
		return []*models.Notification{}
	}
	return list
}

// MarkNotificationsRead clears active alerts.
func (s *DashboardService) MarkNotificationsRead() {
	ctx := context.Background()
	_ = s.activityRepo.MarkNotificationsRead(ctx)
}

// GetMetricsHistory returns metrics snapshot points.
func (s *DashboardService) GetMetricsHistory(ctx context.Context, serverID string) ([]*models.MonitoringSnapshot, error) {
	return s.metricsRepo.GetHistory(ctx, serverID, 20)
}

func (s *DashboardService) seedIfEmpty() {
	ctx := context.Background()
	servers, err := s.serverRepo.GetAll(ctx)
	if err != nil || len(servers) > 0 {
		return
	}

	// Seed with default local loopback and virtual mocks
	seedNodes := []*models.Server{
		{
			ID:            "srv_local",
			Name:          "local-host-daemon",
			IP:            "127.0.0.1",
			Status:        "offline",
			OS:            "Linux System",
			Location:      "Local Loopback",
			Provider:      "Localhost",
			Tags:          []string{"daemon", "local", "control-plane"},
			SSHPort:       22,
			SSHUser:       "root",
			SSHAuthMethod: "password",
		},
		{
			ID:            "srv_dummy_aws",
			Name:          "aws-ec2-api-mock",
			IP:            "198.51.100.12",
			Status:        "offline",
			OS:            "Ubuntu 22.04 LTS",
			Location:      "Virginia, USA",
			Provider:      "AWS",
			Tags:          []string{"api", "gateway"},
			SSHPort:       22,
			SSHUser:       "ubuntu",
			SSHAuthMethod: "password",
		},
	}

	for _, n := range seedNodes {
		_ = s.serverRepo.Create(ctx, n)
	}

	// Seed some initial activities and notifications
	_ = s.activityRepo.CreateActivity(ctx, &models.Activity{
		ID:        "act_seed_1",
		Message:   "Console initialized. Registered localhost loopback agent.",
		Type:      "success",
		User:      "System Daemon",
		CreatedAt: time.Now().Add(-10 * time.Minute),
	})

	_ = s.activityRepo.CreateNotification(ctx, &models.Notification{
		ID:        "notif_seed_1",
		Title:     "Agent Registered",
		Message:   "Local daemon node added to server pool. Establishing SSH heartbeats.",
		Type:      "info",
		Read:      false,
		CreatedAt: time.Now().Add(-10 * time.Minute),
	})
}
