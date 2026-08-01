package models

import "time"

// Server represents a monitored/managed server.
type Server struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	IP             string    `json:"ip"`
	Status         string    `json:"status"` // "online", "offline", "maintenance"
	OS             string    `json:"os"`
	CPUUsage       float64   `json:"cpu_usage"`    // percentage
	MemoryUsage    float64   `json:"memory_usage"` // percentage
	MemoryTotal    float64   `json:"memory_total"` // GB
	DiskUsage      float64   `json:"disk_usage"`   // percentage
	DiskTotal      float64   `json:"disk_total"`   // GB
	NetworkIn      float64   `json:"network_in"`   // Mbps
	NetworkOut     float64   `json:"network_out"`  // Mbps
	Uptime         int64     `json:"uptime"`       // seconds
	Location       string    `json:"location"`
	Provider       string    `json:"provider"` // "AWS", "GCP", "Hetzner", "DigitalOcean", etc.
	Tags           []string  `json:"tags"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// SSH Credentials (excluded from JSON outputs)
	SSHPort        int       `json:"-"`
	SSHUser        string    `json:"-"`
	SSHAuthMethod  string    `json:"-"` // "password" or "private_key"
	SSHPassword    string    `json:"-"`
	SSHPrivateKey  string    `json:"-"`
	SSHPassphrase  string    `json:"-"`
	HostKey        string    `json:"-"`
}

// MetricPoint defines a single data point in a time-series telemetry chart.
type MetricPoint struct {
	Timestamp string  `json:"timestamp"` // HH:MM format
	Value     float64 `json:"value"`
}

// DashboardStats provides aggregated high-level metadata and time-series telemetry.
type DashboardStats struct {
	TotalServers      int           `json:"total_servers"`
	OnlineServers     int           `json:"online_servers"`
	OfflineServers    int           `json:"offline_servers"`
	AvgCPUUsage       float64       `json:"avg_cpu_usage"`
	AvgMemoryUsage    float64       `json:"avg_memory_usage"`
	TotalDiskCapacity float64       `json:"total_disk_capacity"` // GB
	TotalDiskUsed     float64       `json:"total_disk_used"`     // GB
	CPUHistory        []MetricPoint `json:"cpu_history"`
	MemoryHistory     []MetricPoint `json:"memory_history"`
	NetworkHistory    []MetricPoint `json:"network_history"`
}

// MonitoringSnapshot represents a periodic resource snapshot of a server.
type MonitoringSnapshot struct {
	ID          string    `json:"id"`
	ServerID    string    `json:"server_id"`
	CPUUsage    float64   `json:"cpu_usage"`
	MemoryUsage float64   `json:"memory_usage"`
	DiskUsage   float64   `json:"disk_usage"`
	NetworkIn   float64   `json:"network_in"`
	NetworkOut  float64   `json:"network_out"`
	CreatedAt   time.Time `json:"created_at"`
}

// Activity represents an event log item.
type Activity struct {
	ID        string    `json:"id"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // "info", "warning", "error", "success"
	User      string    `json:"user"`
	ServerID  string    `json:"server_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// Notification represents a notification alert.
type Notification struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // "info", "warning", "error", "success"
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"created_at"`
}
