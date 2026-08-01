package services

import (
	"context"
	"fmt"
	"net"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/logging"
	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/ShaharyarShakir/serverpilot/apps/api/ssh"
	cryptoSSH "golang.org/x/crypto/ssh"
)

// MonitoringService runs a background loop gathering server statistics.
type MonitoringService struct {
	serverRepo   repository.ServerRepository
	metricsRepo  repository.MetricsRepository
	activityRepo repository.ActivityRepository
	sshPool      *ssh.SSHConnectionPool
	logger       *logging.Logger

	mu        sync.Mutex
	netCache  map[string]*ssh.CumulativeNetwork
	timeCache map[string]time.Time

	stopChan chan struct{}
	wg       sync.WaitGroup
}

// NewMonitoringService creates a new MonitoringService.
func NewMonitoringService(
	serverRepo repository.ServerRepository,
	metricsRepo repository.MetricsRepository,
	activityRepo repository.ActivityRepository,
	sshPool *ssh.SSHConnectionPool,
	logger *logging.Logger,
) *MonitoringService {
	return &MonitoringService{
		serverRepo:   serverRepo,
		metricsRepo:  metricsRepo,
		activityRepo: activityRepo,
		sshPool:      sshPool,
		logger:       logger,
		netCache:     make(map[string]*ssh.CumulativeNetwork),
		timeCache:    make(map[string]time.Time),
		stopChan:     make(chan struct{}),
	}
}

// Start launches the background monitoring ticker.
func (m *MonitoringService) Start(interval time.Duration) {
	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		m.logger.Info(fmt.Sprintf("Starting background server metrics collector (interval: %v)...", interval), nil)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		// Run immediately on start
		m.pollAllServers()

		for {
			select {
			case <-ticker.C:
				m.pollAllServers()
			case <-m.stopChan:
				m.logger.Info("Background metrics collector stopped", nil)
				return
			}
		}
	}()
}

// Stop halts the background monitoring worker.
func (m *MonitoringService) Stop() {
	close(m.stopChan)
	m.wg.Wait()
}

func (m *MonitoringService) pollAllServers() {
	ctx := context.Background()
	servers, err := m.serverRepo.GetAll(ctx)
	if err != nil {
		m.logger.Error("failed to fetch servers list for monitoring", map[string]any{"error": err.Error()})
		return
	}

	for _, srv := range servers {
		// Register config in SSH connection pool
		m.sshPool.RegisterConfig(srv.ID, &ssh.Config{
			Host:            srv.IP,
			Port:            srv.SSHPort,
			User:            srv.SSHUser,
			AuthMethod:      srv.SSHAuthMethod,
			Password:        srv.SSHPassword,
			PrivateKey:      srv.SSHPrivateKey,
			Passphrase:      srv.SSHPassphrase,
			ExpectedHostKey: srv.HostKey,
			HostKeyCallback: func(hostname string, remote net.Addr, key cryptoSSH.PublicKey) error {
				fp := ssh.HostKeyFingerprint(key)
				if srv.HostKey == "" {
					// TOFU: Trust host key on first use
					m.logger.Info(fmt.Sprintf("TOFU: Storing host key for server %s (%s)", srv.Name, fp), nil)
					_ = m.serverRepo.UpdateHostKey(context.Background(), srv.ID, fp)
					srv.HostKey = fp
					return nil
				}
				if srv.HostKey != fp {
					return fmt.Errorf("ssh host key mismatch: expected %s, got %s", srv.HostKey, fp)
				}
				return nil
			},
		})

		// Run metrics collection concurrently per server
		go m.pollServer(srv)
	}
}

func (m *MonitoringService) pollServer(srv *models.Server) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	cmd := `echo "===CPU===" && cat /proc/stat && sleep 0.1 && cat /proc/stat && echo "===MEM===" && cat /proc/meminfo && echo "===DISK===" && df -B1 / && echo "===NET===" && cat /proc/net/dev && echo "===UPTIME===" && cat /proc/uptime`

	var stdout string
	var err error
	var localExec bool

	// Fallback logic for localhost / 127.0.0.1 if SSH port is closed/dead
	if srv.IP == "127.0.0.1" || srv.IP == "localhost" {
		stdout, err = m.sshPool.RunCommand(srv.ID, cmd)
		if err != nil {
			// fallback to local execution
			localExec = true
			m.logger.Debug(fmt.Sprintf("SSH local connection failed for %s, falling back to local exec", srv.Name), nil)
			outBytes, localErr := exec.Command("sh", "-c", cmd).Output()
			if localErr == nil {
				stdout = string(outBytes)
				err = nil
			}
		}
	} else {
		stdout, err = m.sshPool.RunCommand(srv.ID, cmd)
	}

	if err != nil {
		m.logger.Warn(fmt.Sprintf("Failed to collect metrics from server %s (%s): %v", srv.Name, srv.IP, err), nil)
		m.handleServerOffline(srv, err.Error())
		return
	}

	// Parse combined stdout
	cpu, mem, disk, cumulativeNet, uptime, err := m.parseCombinedOutput(stdout)
	if err != nil {
		m.logger.Error(fmt.Sprintf("Failed to parse metrics output for server %s: %v", srv.Name, err), nil)
		m.handleServerOffline(srv, "Parsing error: "+err.Error())
		return
	}

	// Calculate network throughput speed
	now := time.Now()
	var rxSpeed, txSpeed float64

	m.mu.Lock()
	prevNet, hasPrevNet := m.netCache[srv.ID]
	prevTime, hasPrevTime := m.timeCache[srv.ID]
	m.netCache[srv.ID] = cumulativeNet
	m.timeCache[srv.ID] = now
	m.mu.Unlock()

	if hasPrevNet && hasPrevTime {
		timeDelta := now.Sub(prevTime).Seconds()
		if timeDelta > 0 {
			rxDelta := float64(cumulativeNet.RxBytes - prevNet.RxBytes)
			txDelta := float64(cumulativeNet.TxBytes - prevNet.TxBytes)

			// convert bytes/sec to Mbps (bits/sec / 1,000,000)
			rxSpeed = (rxDelta * 8.0) / timeDelta / 1000000.0
			txSpeed = (txDelta * 8.0) / timeDelta / 1000000.0
			if rxSpeed < 0 {
				rxSpeed = 0
			}
			if txSpeed < 0 {
				txSpeed = 0
			}
		}
	}

	// Update DB record
	wasOffline := srv.Status != "online"
	srv.Status = "online"
	srv.CPUUsage = cpu.Total
	srv.MemoryUsage = mem.Usage
	srv.MemoryTotal = mem.Total
	srv.DiskUsage = disk.Usage
	srv.DiskTotal = disk.Total
	srv.NetworkIn = rxSpeed
	srv.NetworkOut = txSpeed
	srv.Uptime = uptime

	if localExec {
		srv.OS = "Local Host Machine"
	}

	updateErr := m.serverRepo.UpdateMetrics(ctx, srv)
	if updateErr != nil {
		m.logger.Error(fmt.Sprintf("failed to update server metrics in DB: %v", updateErr), nil)
		return
	}

	// Log activity if server just came back online
	if wasOffline {
		msg := fmt.Sprintf("Server '%s' re-established SSH connection and is ONLINE.", srv.Name)
		m.logger.Info(msg, nil)
		_ = m.activityRepo.CreateActivity(ctx, &models.Activity{
			ID:        fmt.Sprintf("act_%s_%d", srv.ID, time.Now().UnixNano()),
			Message:   msg,
			Type:      "success",
			User:      "System Daemon",
			ServerID:  srv.ID,
			CreatedAt: time.Now(),
		})
	}

	// Insert periodic metric snapshot
	snapshot := &models.MonitoringSnapshot{
		ID:          fmt.Sprintf("snap_%d", time.Now().UnixNano()),
		ServerID:    srv.ID,
		CPUUsage:    srv.CPUUsage,
		MemoryUsage: srv.MemoryUsage,
		DiskUsage:   srv.DiskUsage,
		NetworkIn:   srv.NetworkIn,
		NetworkOut:  srv.NetworkOut,
		CreatedAt:   time.Now(),
	}
	_ = m.metricsRepo.InsertSnapshot(ctx, snapshot)

	// Threshold alerts (e.g. CPU > 90%)
	m.checkThresholdAlerts(srv)
}

func (m *MonitoringService) handleServerOffline(srv *models.Server, reason string) {
	ctx := context.Background()
	wasOnline := srv.Status == "online"

	srv.Status = "offline"
	srv.CPUUsage = 0
	srv.MemoryUsage = 0
	srv.DiskUsage = 0
	srv.NetworkIn = 0
	srv.NetworkOut = 0
	srv.Uptime = 0

	_ = m.serverRepo.UpdateMetrics(ctx, srv)

	// Clear network cash
	m.mu.Lock()
	delete(m.netCache, srv.ID)
	delete(m.timeCache, srv.ID)
	m.mu.Unlock()

	if wasOnline {
		msg := fmt.Sprintf("Server '%s' went OFFLINE. Connection error: %s", srv.Name, reason)
		m.logger.Warn(msg, nil)

		// Create Activity Log
		_ = m.activityRepo.CreateActivity(ctx, &models.Activity{
			ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
			Message:   msg,
			Type:      "error",
			User:      "ServerPilot Heartbeat",
			ServerID:  srv.ID,
			CreatedAt: time.Now(),
		})

		// Create Notification alert
		_ = m.activityRepo.CreateNotification(ctx, &models.Notification{
			ID:        fmt.Sprintf("notif_%d", time.Now().UnixNano()),
			Title:     "Connection Failure",
			Message:   fmt.Sprintf("%s is offline. SSH connection check failed.", srv.Name),
			Type:      "error",
			Read:      false,
			CreatedAt: time.Now(),
		})
	}
}

func (m *MonitoringService) checkThresholdAlerts(srv *models.Server) {
	ctx := context.Background()
	if srv.CPUUsage > 90.0 {
		m.triggerAlert(ctx, srv, "High CPU utilization", fmt.Sprintf("Server '%s' CPU usage is at %.1f%%", srv.Name, srv.CPUUsage))
	}
	if srv.MemoryUsage > 90.0 {
		m.triggerAlert(ctx, srv, "High RAM utilization", fmt.Sprintf("Server '%s' memory usage is at %.1f%%", srv.Name, srv.MemoryUsage))
	}
	if srv.DiskUsage > 90.0 {
		m.triggerAlert(ctx, srv, "High Disk utilization", fmt.Sprintf("Server '%s' root disk space is at %.1f%%", srv.Name, srv.DiskUsage))
	}
}

func (m *MonitoringService) triggerAlert(ctx context.Context, srv *models.Server, title string, msg string) {
	// Create warning activity log & notification alert
	// Prevent duplicate notifications in short succession using simple cooldown if desired (left simple for now)
	_ = m.activityRepo.CreateActivity(ctx, &models.Activity{
		ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
		Message:   msg,
		Type:      "warning",
		User:      "Alertmanager",
		ServerID:  srv.ID,
		CreatedAt: time.Now(),
	})

	_ = m.activityRepo.CreateNotification(ctx, &models.Notification{
		ID:        fmt.Sprintf("notif_%d", time.Now().UnixNano()),
		Title:     title,
		Message:   msg,
		Type:      "warning",
		Read:      false,
		CreatedAt: time.Now(),
	})
}

// parseCombinedOutput splits stdout using "===" tags and parses individual sections
func (m *MonitoringService) parseCombinedOutput(stdout string) (
	cpu *ssh.CPUUsage,
	mem *ssh.MemoryMetrics,
	disk *ssh.DiskMetrics,
	net *ssh.CumulativeNetwork,
	uptime int64,
	err error,
) {
	sections := strings.Split(stdout, "===")
	var cpuStr, memStr, diskStr, netStr, uptimeStr string

	for i := 0; i < len(sections)-1; i++ {
		secName := strings.TrimSpace(sections[i])
		if secName == "CPU" {
			cpuStr = sections[i+1]
		} else if secName == "MEM" {
			memStr = sections[i+1]
		} else if secName == "DISK" {
			diskStr = sections[i+1]
		} else if secName == "NET" {
			netStr = sections[i+1]
		} else if secName == "UPTIME" {
			uptimeStr = sections[i+1]
		}
	}

	if cpuStr != "" {
		cpu, err = ssh.ParseCPUUsage(cpuStr)
	}
	if err == nil && memStr != "" {
		mem, err = ssh.ParseMemory(memStr)
	}
	if err == nil && diskStr != "" {
		disk, err = ssh.ParseDisk(diskStr)
	}
	if err == nil && netStr != "" {
		net, err = ssh.ParseNetworkDev(netStr)
	}
	if err == nil && uptimeStr != "" {
		fields := strings.Fields(uptimeStr)
		if len(fields) > 0 {
			if val, parseErr := strconv.ParseFloat(fields[0], 64); parseErr == nil {
				uptime = int64(val)
			}
		}
	}

	if err != nil {
		return nil, nil, nil, nil, 0, err
	}

	if cpu == nil || mem == nil || disk == nil || net == nil {
		return nil, nil, nil, nil, 0, fmt.Errorf("missing monitoring sections")
	}

	return cpu, mem, disk, net, uptime, nil
}
