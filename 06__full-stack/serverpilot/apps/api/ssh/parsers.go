package ssh

import (
	"fmt"
	"strconv"
	"strings"
)

// CPUUsage represents user, system, idle, and calculated overall CPU usage.
type CPUUsage struct {
	User   float64
	System float64
	Idle   float64
	Total  float64 // overall CPU usage percentage
}

// MemoryMetrics represents memory stats in GB.
type MemoryMetrics struct {
	Total float64
	Used  float64
	Free  float64
	Usage float64 // percentage
}

// DiskMetrics represents filesystem disk stats in GB.
type DiskMetrics struct {
	Total float64
	Used  float64
	Free  float64
	Usage float64 // percentage
}

// CumulativeNetwork holds raw interface cumulative bytes.
type CumulativeNetwork struct {
	RxBytes uint64
	TxBytes uint64
}

// SystemInfo holds core hardware and OS metadata.
type SystemInfo struct {
	OSName   string
	Kernel   string
	Uptime   int64
	CPUModel string
	CPUCores int
}

// ProcessInfo holds parsed process fields.
type ProcessInfo struct {
	PID     int     `json:"pid"`
	PPID    int     `json:"ppid"`
	User    string  `json:"user"`
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	Command string  `json:"command"`
}

// SystemdService represents a systemd service unit.
type SystemdService struct {
	Name        string `json:"name"`
	Loaded      string `json:"loaded"`
	Active      string `json:"active"`
	SubState    string `json:"sub_state"`
	Description string `json:"description"`
}

// ParseCPUUsage parses the output of "cat /proc/stat && sleep 0.1 && cat /proc/stat"
func ParseCPUUsage(stdout string) (*CPUUsage, error) {
	lines := strings.Split(stdout, "\n")
	var cpuStats [][]string

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) > 0 && fields[0] == "cpu" {
			cpuStats = append(cpuStats, fields[1:])
		}
	}

	if len(cpuStats) < 2 {
		return nil, fmt.Errorf("insufficient cpu readings found in stdout")
	}

	// Parse first reading
	t1, id1, err := parseCPUTimes(cpuStats[0])
	if err != nil {
		return nil, err
	}

	// Parse second reading
	t2, id2, err := parseCPUTimes(cpuStats[len(cpuStats)-1])
	if err != nil {
		return nil, err
	}

	totalDiff := t2 - t1
	idleDiff := id2 - id1

	if totalDiff == 0 {
		return &CPUUsage{Total: 0.0}, nil
	}

	usagePercent := (float64(totalDiff - idleDiff) / float64(totalDiff)) * 100.0

	return &CPUUsage{
		Total:  usagePercent,
		Idle:   (float64(idleDiff) / float64(totalDiff)) * 100.0,
		User:   0.0, // Detailed breakdowns can be estimated, but Total is the primary requirement.
		System: 0.0,
	}, nil
}

func parseCPUTimes(fields []string) (uint64, uint64, error) {
	if len(fields) < 8 {
		return 0, 0, fmt.Errorf("invalid cpu fields count")
	}

	var times [8]uint64
	for i := 0; i < 8; i++ {
		val, err := strconv.ParseUint(fields[i], 10, 64)
		if err != nil {
			return 0, 0, fmt.Errorf("failed to parse cpu times value %q: %w", fields[i], err)
		}
		times[i] = val
	}

	// Total = user + nice + system + idle + iowait + irq + softirq + steal
	total := times[0] + times[1] + times[2] + times[3] + times[4] + times[5] + times[6] + times[7]
	// Idle = idle + iowait
	idle := times[3] + times[4]

	return total, idle, nil
}

// ParseMemory parses "/proc/meminfo"
func ParseMemory(stdout string) (*MemoryMetrics, error) {
	lines := strings.Split(stdout, "\n")
	var memTotal, memFree, memAvailable, buffers, cached float64
	var hasAvailable bool

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		
		key := strings.TrimSuffix(fields[0], ":")
		val, err := strconv.ParseFloat(fields[1], 64)
		if err != nil {
			continue
		}

		switch key {
		case "MemTotal":
			memTotal = val
		case "MemFree":
			memFree = val
		case "MemAvailable":
			memAvailable = val
			hasAvailable = true
		case "Buffers":
			buffers = val
		case "Cached":
			cached = val
		}
	}

	if memTotal == 0 {
		return nil, fmt.Errorf("memtotal not found or 0")
	}

	// Values are in kB. Convert to GB.
	totalGB := memTotal / 1024.0 / 1024.0
	var availableGB float64
	if hasAvailable {
		availableGB = memAvailable / 1024.0 / 1024.0
	} else {
		availableGB = (memFree + buffers + cached) / 1024.0 / 1024.0
	}

	usedGB := totalGB - availableGB
	usagePercent := (usedGB / totalGB) * 100.0

	return &MemoryMetrics{
		Total: totalGB,
		Used:  usedGB,
		Free:  availableGB,
		Usage: usagePercent,
	}, nil
}

// ParseDisk parses "df -B1 /"
func ParseDisk(stdout string) (*DiskMetrics, error) {
	lines := strings.Split(strings.TrimSpace(stdout), "\n")
	if len(lines) < 2 {
		return nil, fmt.Errorf("invalid df output, too few lines")
	}

	// The values are on the second line (under headers)
	fields := strings.Fields(lines[1])
	if len(fields) < 5 {
		// Try next line if filesystem name wrapped
		if len(lines) > 2 {
			fields = append(fields, strings.Fields(lines[2])...)
		}
	}

	if len(fields) < 5 {
		return nil, fmt.Errorf("invalid df fields count: %d", len(fields))
	}

	// If fields[0] was long and output wrapped, shift fields
	valIndex := 1
	if _, err := strconv.ParseFloat(fields[valIndex], 64); err != nil {
		valIndex = 2 // name wrapped and first value is in index 2
	}

	if len(fields) <= valIndex+1 {
		return nil, fmt.Errorf("unable to find df values columns")
	}

	totalBytes, err := strconv.ParseFloat(fields[valIndex], 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse total blocks: %w", err)
	}

	usedBytes, err := strconv.ParseFloat(fields[valIndex+1], 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse used blocks: %w", err)
	}

	// Convert bytes to GB
	totalGB := totalBytes / 1024.0 / 1024.0 / 1024.0
	usedGB := usedBytes / 1024.0 / 1024.0 / 1024.0
	freeGB := totalGB - usedGB
	usagePercent := 0.0
	if totalGB > 0 {
		usagePercent = (usedGB / totalGB) * 100.0
	}

	return &DiskMetrics{
		Total: totalGB,
		Used:  usedGB,
		Free:  freeGB,
		Usage: usagePercent,
	}, nil
}

// ParseNetworkDev parses "/proc/net/dev" to sum TX and RX bytes
func ParseNetworkDev(stdout string) (*CumulativeNetwork, error) {
	lines := strings.Split(stdout, "\n")
	var totalRx, totalTx uint64

	for _, line := range lines {
		if !strings.Contains(line, ":") {
			continue
		}
		
		parts := strings.SplitN(line, ":", 2)
		if len(parts) < 2 {
			continue
		}
		
		ifName := strings.TrimSpace(parts[0])
		if ifName == "lo" || strings.HasPrefix(ifName, "docker") || strings.HasPrefix(ifName, "veth") {
			continue
		}

		fields := strings.Fields(parts[1])
		if len(fields) < 9 {
			continue
		}

		rx, err := strconv.ParseUint(fields[0], 10, 64)
		if err != nil {
			continue
		}

		tx, err := strconv.ParseUint(fields[8], 10, 64) // index 8 is Transmit Bytes
		if err != nil {
			continue
		}

		totalRx += rx
		totalTx += tx
	}

	return &CumulativeNetwork{
		RxBytes: totalRx,
		TxBytes: totalTx,
	}, nil
}

// ParseSystemInfo parses output of uname, os-release, cpuinfo, nproc, and uptime
func ParseSystemInfo(stdout string) (*SystemInfo, error) {
	lines := strings.Split(strings.TrimSpace(stdout), "\n")
	if len(lines) < 5 {
		return nil, fmt.Errorf("insufficient lines in system info stdout, got %d", len(lines))
	}

	info := &SystemInfo{
		Kernel:   strings.TrimSpace(lines[0]),
		OSName:   "Linux",
		CPUModel: "Unknown CPU",
		CPUCores: 1,
		Uptime:   0,
	}

	// Parse OS PRETTY_NAME
	// Find line containing PRETTY_NAME
	for _, l := range lines {
		if strings.HasPrefix(l, "PRETTY_NAME=") {
			osVal := strings.Trim(strings.TrimPrefix(l, "PRETTY_NAME="), "\"")
			info.OSName = osVal
			break
		}
	}

	// Parse CPU Model
	for _, l := range lines {
		if strings.HasPrefix(l, "model name") {
			parts := strings.SplitN(l, ":", 2)
			if len(parts) == 2 {
				info.CPUModel = strings.TrimSpace(parts[1])
				break
			}
		}
	}

	// Parse CPU Cores (nproc is a standalone number line)
	for _, l := range lines {
		numStr := strings.TrimSpace(l)
		if val, err := strconv.Atoi(numStr); err == nil && val > 0 && val < 512 {
			info.CPUCores = val
			break
		}
	}

	// Parse Uptime (/proc/uptime line, e.g. "123456.78 987654.32")
	for _, l := range lines {
		fields := strings.Fields(l)
		if len(fields) == 2 {
			if upSec, err := strconv.ParseFloat(fields[0], 64); err == nil {
				info.Uptime = int64(upSec)
				break
			}
		}
	}

	return info, nil
}

// ParseProcesses parses output of "ps -eo user,pid,ppid,%cpu,%mem,comm --sort=-%cpu | head -n 30"
func ParseProcesses(stdout string) ([]*ProcessInfo, error) {
	lines := strings.Split(strings.TrimSpace(stdout), "\n")
	if len(lines) < 2 {
		return nil, nil // No processes or empty output
	}

	var list []*ProcessInfo
	// Skip header line at index 0
	for i := 1; i < len(lines); i++ {
		fields := strings.Fields(lines[i])
		if len(fields) < 6 {
			continue
		}

		pid, err := strconv.Atoi(fields[1])
		if err != nil {
			continue
		}

		ppid, err := strconv.Atoi(fields[2])
		if err != nil {
			continue
		}

		cpu, err := strconv.ParseFloat(fields[3], 64)
		if err != nil {
			continue
		}

		mem, err := strconv.ParseFloat(fields[4], 64)
		if err != nil {
			continue
		}

		// The command can span multiple whitespace parts
		cmd := strings.Join(fields[5:], " ")

		list = append(list, &ProcessInfo{
			PID:     pid,
			PPID:    ppid,
			User:    fields[0],
			CPU:     cpu,
			Memory:  mem,
			Command: cmd,
		})
	}

	return list, nil
}

// ParseSystemdServices parses output of "systemctl list-units --type=service --all --no-legend --no-pager"
func ParseSystemdServices(stdout string) ([]*SystemdService, error) {
	lines := strings.Split(strings.TrimSpace(stdout), "\n")
	var list []*SystemdService

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}

		// Columns: UNIT, LOAD, ACTIVE, SUB, and DESCRIPTION (can be multi-word)
		name := fields[0]
		loaded := fields[1]
		active := fields[2]
		sub := fields[3]
		
		desc := ""
		if len(fields) > 4 {
			// Find where description starts by matching fields
			desc = strings.TrimSpace(line[strings.Index(line, fields[4]):])
		}

		list = append(list, &SystemdService{
			Name:        name,
			Loaded:      loaded,
			Active:      active,
			SubState:    sub,
			Description: desc,
		})
	}

	return list, nil
}
