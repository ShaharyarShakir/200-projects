package ssh

import (
	"testing"
)

func TestParseMemory(t *testing.T) {
	meminfo := `MemTotal:       16382024 kB
MemFree:         4820124 kB
MemAvailable:    8901234 kB
Buffers:          123456 kB
Cached:          2345678 kB`

	metrics, err := ParseMemory(meminfo)
	if err != nil {
		t.Fatalf("failed to parse memory: %v", err)
	}

	// 16382024 kB / 1024 / 1024 = 15.623... GB
	if metrics.Total < 15.6 || metrics.Total > 15.7 {
		t.Errorf("expected MemTotal around 15.62 GB, got %.3f GB", metrics.Total)
	}

	// MemAvailable: 8901234 kB / 1024 / 1024 = 8.488... GB
	// Used: 15.623 - 8.488 = 7.135 GB
	if metrics.Free < 8.4 || metrics.Free > 8.5 {
		t.Errorf("expected Free memory around 8.48 GB, got %.3f GB", metrics.Free)
	}

	if metrics.Usage < 45.0 || metrics.Usage > 46.0 {
		t.Errorf("expected memory usage percentage around 45.6%%, got %.3f%%", metrics.Usage)
	}
}

func TestParseDisk(t *testing.T) {
	dfOutput := `Filesystem      1B-blocks        Used   Available Use% Mounted on
/dev/sda1     107374182400 42949672960 64424509440  40% /`

	metrics, err := ParseDisk(dfOutput)
	if err != nil {
		t.Fatalf("failed to parse disk: %v", err)
	}

	// 107374182400 / 1024^3 = 100 GB
	if metrics.Total != 100.0 {
		t.Errorf("expected disk total 100 GB, got %.2f GB", metrics.Total)
	}

	// 42949672960 / 1024^3 = 40 GB
	if metrics.Used != 40.0 {
		t.Errorf("expected disk used 40 GB, got %.2f GB", metrics.Used)
	}

	if metrics.Usage != 40.0 {
		t.Errorf("expected disk usage 40%%, got %.2f%%", metrics.Usage)
	}
}

func TestParseCPUUsage(t *testing.T) {
	cpuStat := `cpu  1000 100 500 5000 200 50 10 5 0 0
cpu0 500 50 250 2500 100 25 5 2 0 0
cpu1 500 50 250 2500 100 25 5 3 0 0
cpu  1200 110 550 5100 210 52 11 6 0 0`

	usage, err := ParseCPUUsage(cpuStat)
	if err != nil {
		t.Fatalf("failed to parse CPU usage: %v", err)
	}

	// Total1 = 1000 + 100 + 500 + 5000 + 200 + 50 + 10 + 5 = 6865
	// Idle1 = 5000 + 200 = 5200
	// Total2 = 1200 + 110 + 550 + 5100 + 210 + 52 + 11 + 6 = 7239
	// Idle2 = 5100 + 210 = 5310
	// TotalDiff = 7239 - 6865 = 374
	// IdleDiff = 5310 - 5200 = 110
	// Usage = (374 - 110) / 374 * 100 = 70.588... %
	if usage.Total < 70.5 || usage.Total > 70.6 {
		t.Errorf("expected cpu usage around 70.58%%, got %.3f%%", usage.Total)
	}
}

func TestParseNetworkDev(t *testing.T) {
	netDev := `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo: 12345 100 0 0 0 0 0 0 12345 100 0 0 0 0 0 0
  eth0: 1000000 500 0 0 0 0 0 0 2000000 600 0 0 0 0 0 0
  eth1: 500000  200 0 0 0 0 0 0 400000  300 0 0 0 0 0 0`

	net, err := ParseNetworkDev(netDev)
	if err != nil {
		t.Fatalf("failed to parse net dev: %v", err)
	}

	// lo should be ignored. Sum of eth0 + eth1:
	// Rx: 1000000 + 500000 = 1500000
	// Tx: 2000000 + 400000 = 2400000
	if net.RxBytes != 1500000 {
		t.Errorf("expected cumulative rx bytes 1500000, got %d", net.RxBytes)
	}
	if net.TxBytes != 2400000 {
		t.Errorf("expected cumulative tx bytes 2400000, got %d", net.TxBytes)
	}
}

func TestParseSystemInfo(t *testing.T) {
	stdout := `Linux 5.15.0-88-generic
PRETTY_NAME="Ubuntu 22.04.3 LTS"
model name      : Intel(R) Xeon(R) CPU @ 2.20GHz
4
123456.78 987654.32`

	info, err := ParseSystemInfo(stdout)
	if err != nil {
		t.Fatalf("failed to parse system info: %v", err)
	}

	if info.Kernel != "Linux 5.15.0-88-generic" {
		t.Errorf("expected kernel Linux 5.15.0-88-generic, got %q", info.Kernel)
	}
	if info.OSName != "Ubuntu 22.04.3 LTS" {
		t.Errorf("expected OS Ubuntu 22.04.3 LTS, got %q", info.OSName)
	}
	if info.CPUModel != "Intel(R) Xeon(R) CPU @ 2.20GHz" {
		t.Errorf("expected CPU model, got %q", info.CPUModel)
	}
	if info.CPUCores != 4 {
		t.Errorf("expected CPU cores 4, got %d", info.CPUCores)
	}
	if info.Uptime != 123456 {
		t.Errorf("expected uptime 123456, got %d", info.Uptime)
	}
}

func TestParseProcesses(t *testing.T) {
	psOutput := `USER         PID  PPID %CPU %MEM COMMAND
root           1     0  0.0  0.1 /sbin/init splash
admin       2345  1200 12.5  4.2 /usr/bin/go run main.go`

	list, err := ParseProcesses(psOutput)
	if err != nil {
		t.Fatalf("failed to parse processes: %v", err)
	}

	if len(list) != 2 {
		t.Fatalf("expected 2 processes, got %d", len(list))
	}

	p1 := list[0]
	if p1.User != "root" || p1.PID != 1 || p1.PPID != 0 || p1.CPU != 0.0 || p1.Memory != 0.1 || p1.Command != "/sbin/init splash" {
		t.Errorf("p1 fields mismatch: %+v", p1)
	}

	p2 := list[1]
	if p2.User != "admin" || p2.PID != 2345 || p2.PPID != 1200 || p2.CPU != 12.5 || p2.Memory != 4.2 || p2.Command != "/usr/bin/go run main.go" {
		t.Errorf("p2 fields mismatch: %+v", p2)
	}
}

func TestParseSystemdServices(t *testing.T) {
	servicesOutput := `cron.service loaded active running Regular background program processing daemon
nginx.service loaded active running Nginx Web Server
ssh.service loaded active running OpenSSH Daemon`

	list, err := ParseSystemdServices(servicesOutput)
	if err != nil {
		t.Fatalf("failed to parse systemd services: %v", err)
	}

	if len(list) != 3 {
		t.Fatalf("expected 3 services, got %d", len(list))
	}

	s1 := list[0]
	if s1.Name != "cron.service" || s1.Loaded != "loaded" || s1.Active != "active" || s1.SubState != "running" || s1.Description != "Regular background program processing daemon" {
		t.Errorf("s1 fields mismatch: %+v", s1)
	}
}
