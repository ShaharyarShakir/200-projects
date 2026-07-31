package services

import (
	"fmt"
	"math"
	"math/rand"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
)

// DashboardService implements service-layer business logic for returning mock infrastructure data.
type DashboardService struct {
	mu            sync.Mutex
	servers       []*models.Server
	activities    []*models.Activity
	notifications []*models.Notification
}

// NewDashboardService initializes a thread-safe service holding realistic mock datasets.
func NewDashboardService() *DashboardService {
	now := time.Now()

	servers := []*models.Server{
		{
			ID:          "srv_1",
			Name:        "api-gateway-us-east",
			IP:          "54.210.12.85",
			Status:      "online",
			OS:          "Ubuntu 22.04 LTS",
			CPUUsage:    24.5,
			MemoryUsage: 42.1,
			MemoryTotal: 16.0,
			DiskUsage:   38.4,
			DiskTotal:   120.0,
			NetworkIn:   145.2,
			NetworkOut:  98.7,
			Uptime:      1209600, // 14 days
			Location:    "Virginia, USA",
			Provider:    "AWS",
			Tags:        []string{"gateway", "production", "public"},
			UpdatedAt:   now,
		},
		{
			ID:          "srv_2",
			Name:        "db-primary-fra",
			IP:          "159.69.84.112",
			Status:      "online",
			OS:          "Debian 12 Bookworm",
			CPUUsage:    48.2,
			MemoryUsage: 78.5,
			MemoryTotal: 64.0,
			DiskUsage:   62.1,
			DiskTotal:   500.0,
			NetworkIn:   84.6,
			NetworkOut:  245.1,
			Uptime:      3888000, // 45 days
			Location:    "Frankfurt, Germany",
			Provider:    "Hetzner",
			Tags:        []string{"database", "primary", "private"},
			UpdatedAt:   now,
		},
		{
			ID:          "srv_3",
			Name:        "db-replica-sgp",
			IP:          "34.124.65.201",
			Status:      "online",
			OS:          "Debian 12 Bookworm",
			CPUUsage:    12.4,
			MemoryUsage: 54.2,
			MemoryTotal: 32.0,
			DiskUsage:   59.8,
			DiskTotal:   500.0,
			NetworkIn:   180.4,
			NetworkOut:  12.3,
			Uptime:      777600, // 9 days
			Location:    "Singapore",
			Provider:    "GCP",
			Tags:        []string{"database", "replica", "readonly"},
			UpdatedAt:   now,
		},
		{
			ID:          "srv_4",
			Name:        "cache-redis-us-east",
			IP:          "10.0.1.20",
			Status:      "online",
			OS:          "Ubuntu 22.04 LTS",
			CPUUsage:    8.1,
			MemoryUsage: 35.8,
			MemoryTotal: 8.0,
			DiskUsage:   12.4,
			DiskTotal:   40.0,
			NetworkIn:   312.4,
			NetworkOut:  294.8,
			Uptime:      259200, // 3 days
			Location:    "Virginia, USA",
			Provider:    "AWS",
			Tags:        []string{"cache", "redis", "internal"},
			UpdatedAt:   now,
		},
		{
			ID:          "srv_5",
			Name:        "auth-service-k8s-node",
			IP:          "192.168.12.14",
			Status:      "online",
			OS:          "Ubuntu 22.04 LTS",
			CPUUsage:    18.7,
			MemoryUsage: 51.3,
			MemoryTotal: 16.0,
			DiskUsage:   45.2,
			DiskTotal:   100.0,
			NetworkIn:   54.1,
			NetworkOut:  49.3,
			Uptime:      950400, // 11 days
			Location:    "Frankfurt, Germany",
			Provider:    "Hetzner",
			Tags:        []string{"auth", "k8s", "microservice"},
			UpdatedAt:   now,
		},
		{
			ID:          "srv_6",
			Name:        "analytics-worker-01",
			IP:          "167.99.201.44",
			Status:      "online",
			OS:          "Rocky Linux 9",
			CPUUsage:    89.4,
			MemoryUsage: 91.2,
			MemoryTotal: 32.0,
			DiskUsage:   74.8,
			DiskTotal:   200.0,
			NetworkIn:   450.9,
			NetworkOut:  89.4,
			Uptime:      172800, // 2 days
			Location:    "New York, USA",
			Provider:    "DigitalOcean",
			Tags:        []string{"worker", "analytics", "heavy-load"},
			UpdatedAt:   now,
		},
		{
			ID:          "srv_7",
			Name:        "analytics-worker-02",
			IP:          "167.99.201.45",
			Status:      "offline",
			OS:          "Rocky Linux 9",
			CPUUsage:    0.0,
			MemoryUsage: 0.0,
			MemoryTotal: 32.0,
			DiskUsage:   0.0,
			DiskTotal:   200.0,
			NetworkIn:   0.0,
			NetworkOut:  0.0,
			Uptime:      0,
			Location:    "New York, USA",
			Provider:    "DigitalOcean",
			Tags:        []string{"worker", "analytics"},
			UpdatedAt:   now,
		},
		{
			ID:          "srv_8",
			Name:        "backup-vault-safe",
			IP:          "185.10.12.3",
			Status:      "maintenance",
			OS:          "Ubuntu 20.04 LTS",
			CPUUsage:    4.2,
			MemoryUsage: 12.0,
			MemoryTotal: 8.0,
			DiskUsage:   91.4,
			DiskTotal:   1000.0,
			NetworkIn:   1.5,
			NetworkOut:  0.8,
			Uptime:      4320000, // 50 days
			Location:    "London, UK",
			Provider:    "Scaleway",
			Tags:        []string{"backup", "cold-storage"},
			UpdatedAt:   now,
		},
	}

	activities := []*models.Activity{
		{
			ID:        "act_1",
			Message:   "Scheduled database backup completed successfully.",
			Type:      "success",
			User:      "System Daemon",
			ServerID:  "srv_2",
			CreatedAt: now.Add(-10 * time.Minute),
		},
		{
			ID:        "act_2",
			Message:   "CPU utilization spiked above 85% warning threshold.",
			Type:      "warning",
			User:      "Alertmanager",
			ServerID:  "srv_6",
			CreatedAt: now.Add(-18 * time.Minute),
		},
		{
			ID:        "act_3",
			Message:   "Server reboot command initiated manually.",
			Type:      "info",
			User:      "admin@serverpilot.io",
			ServerID:  "srv_5",
			CreatedAt: now.Add(-45 * time.Minute),
		},
		{
			ID:        "act_4",
			Message:   "SSH Key 'shaharyar-workstation' added to system keyring.",
			Type:      "success",
			User:      "admin@serverpilot.io",
			CreatedAt: now.Add(-2 * time.Hour),
		},
		{
			ID:        "act_5",
			Message:   "Network interfaces reconfigured: secondary fallback routes established.",
			Type:      "info",
			User:      "System Daemon",
			ServerID:  "srv_1",
			CreatedAt: now.Add(-4 * time.Hour),
		},
		{
			ID:        "act_6",
			Message:   "Node analytics-worker-02 marked OFFLINE due to ping timeout.",
			Type:      "error",
			User:      "ServerPilot Heartbeat",
			ServerID:  "srv_7",
			CreatedAt: now.Add(-6 * time.Hour),
		},
	}

	notifications := []*models.Notification{
		{
			ID:        "notif_1",
			Title:     "High resource alert",
			Message:   "Node analytics-worker-01 CPU usage is at 89.4%",
			Type:      "warning",
			Read:      false,
			CreatedAt: now.Add(-18 * time.Minute),
		},
		{
			ID:        "notif_2",
			Title:     "Connection failure",
			Message:   "analytics-worker-02 is offline. Check networking dashboard.",
			Type:      "error",
			Read:      false,
			CreatedAt: now.Add(-6 * time.Hour),
		},
		{
			ID:        "notif_3",
			Title:     "System Update",
			Message:   "ServerPilot successfully configured Let's Encrypt certificates for proxy routes.",
			Type:      "success",
			Read:      true,
			CreatedAt: now.Add(-24 * time.Hour),
		},
	}

	return &DashboardService{
		servers:       servers,
		activities:    activities,
		notifications: notifications,
	}
}

// GetDashboardStats computes real-time aggregates and structures telemetry history curves.
func (s *DashboardService) GetDashboardStats() *models.DashboardStats {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Update telemetry points with slight random variance
	s.fluctuateMetrics()

	totalServers := len(s.servers)
	onlineCount := 0
	offlineCount := 0

	var cpuSum, ramSum float64
	var totalDisk, usedDisk float64

	for _, srv := range s.servers {
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

	// Generate historical charts for CPU, Memory, and Network (past 7 hours)
	cpuHistory := make([]models.MetricPoint, 7)
	memHistory := make([]models.MetricPoint, 7)
	netHistory := make([]models.MetricPoint, 7)

	now := time.Now()
	for i := 6; i >= 0; i-- {
		t := now.Add(time.Duration(-i) * time.Hour)
		timeStr := t.Format("15:04")

		// Create smooth wave patterns with some randomness
		hourVal := float64(t.Hour())
		cpuVal := math.Max(10, math.Min(95, 30.0+15.0*math.Sin(hourVal/3.0)+rand.Float64()*10.0))
		memVal := math.Max(20, math.Min(90, 45.0+8.0*math.Cos(hourVal/4.0)+rand.Float64()*5.0))
		netVal := math.Max(50, math.Min(800, 200.0+150.0*math.Sin(hourVal/2.0)+rand.Float64()*100.0))

		// Make the final (current) element match our current averages
		if i == 0 {
			cpuVal = avgCPU
			memVal = avgRAM
		}

		cpuHistory[6-i] = models.MetricPoint{Timestamp: timeStr, Value: math.Round(cpuVal*10) / 10}
		memHistory[6-i] = models.MetricPoint{Timestamp: timeStr, Value: math.Round(memVal*10) / 10}
		netHistory[6-i] = models.MetricPoint{Timestamp: timeStr, Value: math.Round(netVal*10) / 10}
	}

	return &models.DashboardStats{
		TotalServers:      totalServers,
		OnlineServers:     onlineCount,
		OfflineServers:    offlineCount,
		AvgCPUUsage:       math.Round(avgCPU*10) / 10,
		AvgMemoryUsage:    math.Round(avgRAM*10) / 10,
		TotalDiskCapacity: math.Round(totalDisk*10) / 10,
		TotalDiskUsed:     math.Round(usedDisk*10) / 10,
		CPUHistory:        cpuHistory,
		MemoryHistory:     memHistory,
		NetworkHistory:    netHistory,
	}
}

// GetServers returns the full list of servers matching filters, search queries, and page index.
func (s *DashboardService) GetServers(search, status, provider string) []*models.Server {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.fluctuateMetrics()

	var result []*models.Server
	for _, srv := range s.servers {
		// Filter by status
		if status != "" && strings.ToLower(srv.Status) != strings.ToLower(status) {
			continue
		}
		// Filter by provider
		if provider != "" && strings.ToLower(srv.Provider) != strings.ToLower(provider) {
			continue
		}
		// Filter by search query
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

// AddServer appends a new mock server to the virtual cluster list.
func (s *DashboardService) AddServer(name, ip, os, provider, location string, tags []string) *models.Server {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("srv_%d", len(s.servers)+1)
	newServer := &models.Server{
		ID:          id,
		Name:        name,
		IP:          ip,
		Status:      "online",
		OS:          os,
		CPUUsage:    5.0 + rand.Float64()*15.0,
		MemoryUsage: 10.0 + rand.Float64()*20.0,
		MemoryTotal: 8.0,
		DiskUsage:   5.0,
		DiskTotal:   80.0,
		NetworkIn:   5.0,
		NetworkOut:  2.0,
		Uptime:      30, // fresh boot
		Location:    location,
		Provider:    provider,
		Tags:        tags,
		UpdatedAt:   time.Now(),
	}

	s.servers = append(s.servers, newServer)

	// Record activity
	newAct := &models.Activity{
		ID:        fmt.Sprintf("act_%d", len(s.activities)+1),
		Message:   fmt.Sprintf("Added new server '%s' successfully.", name),
		Type:      "success",
		User:      "admin@serverpilot.io",
		ServerID:  id,
		CreatedAt: time.Now(),
	}
	s.activities = append([]*models.Activity{newAct}, s.activities...)

	return newServer
}

// PowerAction triggers a virtual power operation (reboot, stop, start) on a set of nodes.
func (s *DashboardService) PowerAction(serverIDs []string, action string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	action = strings.ToLower(action)
	now := time.Now()

	for _, id := range serverIDs {
		for _, srv := range s.servers {
			if srv.ID == id {
				var msg string
				if action == "restart" {
					srv.Status = "online"
					srv.CPUUsage = 15.0 + rand.Float64()*10.0
					srv.MemoryUsage = 25.0 + rand.Float64()*10.0
					srv.Uptime = 10
					msg = fmt.Sprintf("Server '%s' rebooted successfully.", srv.Name)
				} else if action == "stop" {
					srv.Status = "offline"
					srv.CPUUsage = 0
					srv.MemoryUsage = 0
					srv.Uptime = 0
					msg = fmt.Sprintf("Server '%s' powered off.", srv.Name)
				} else if action == "start" {
					srv.Status = "online"
					srv.CPUUsage = 5.0 + rand.Float64()*10.0
					srv.MemoryUsage = 15.0 + rand.Float64()*15.0
					srv.Uptime = 5
					msg = fmt.Sprintf("Server '%s' powered on.", srv.Name)
				}

				newAct := &models.Activity{
					ID:        fmt.Sprintf("act_%d", len(s.activities)+1),
					Message:   msg,
					Type:      "info",
					User:      "admin@serverpilot.io",
					ServerID:  srv.ID,
					CreatedAt: now,
				}
				s.activities = append([]*models.Activity{newAct}, s.activities...)
				break
			}
		}
	}

	return nil
}

// BulkDelete deletes a batch of virtual servers.
func (s *DashboardService) BulkDelete(serverIDs []string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var keptServers []*models.Server
	for _, srv := range s.servers {
		shouldDelete := false
		for _, delID := range serverIDs {
			if srv.ID == delID {
				shouldDelete = true
				break
			}
		}

		if !shouldDelete {
			keptServers = append(keptServers, srv)
		} else {
			// Record activity for deleted servers
			newAct := &models.Activity{
				ID:        fmt.Sprintf("act_%d", len(s.activities)+1),
				Message:   fmt.Sprintf("Server '%s' removed from console.", srv.Name),
				Type:      "warning",
				User:      "admin@serverpilot.io",
				ServerID:  "",
				CreatedAt: time.Now(),
			}
			s.activities = append([]*models.Activity{newAct}, s.activities...)
		}
	}

	s.servers = keptServers
	return nil
}

// GetActivityLogs returns list of recent dashboard events.
func (s *DashboardService) GetActivityLogs() []*models.Activity {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.activities
}

// GetNotifications returns active notifications.
func (s *DashboardService) GetNotifications() []*models.Notification {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.notifications
}

// MarkNotificationsRead marks all active alerts as read.
func (s *DashboardService) MarkNotificationsRead() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, n := range s.notifications {
		n.Read = true
	}
}

// fluctuateMetrics injects real-time fluctuations for online nodes to make interface look alive.
func (s *DashboardService) fluctuateMetrics() {
	now := time.Now()
	for _, srv := range s.servers {
		if srv.Status != "online" {
			continue
		}

		// Random fluctuation +/- 10%
		cpuDelta := (rand.Float64() * 12.0) - 6.0
		srv.CPUUsage = math.Max(1.0, math.Min(99.0, srv.CPUUsage+cpuDelta))

		memDelta := (rand.Float64() * 4.0) - 2.0
		srv.MemoryUsage = math.Max(5.0, math.Min(98.0, srv.MemoryUsage+memDelta))

		// Random network change
		netDelta := (rand.Float64() * 30.0) - 15.0
		srv.NetworkIn = math.Max(10.0, srv.NetworkIn+netDelta)
		srv.NetworkOut = math.Max(5.0, srv.NetworkOut+netDelta)

		// Increment uptime
		srv.Uptime += int64(now.Sub(srv.UpdatedAt).Seconds())
		srv.UpdatedAt = now
	}

	// Sort activities by creation date descending
	sort.Slice(s.activities, func(i, j int) bool {
		return s.activities[i].CreatedAt.After(s.activities[j].CreatedAt)
	})
}
