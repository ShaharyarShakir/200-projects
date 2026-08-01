package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/ShaharyarShakir/serverpilot/apps/api/ssh"
)

// ServerService manages actions performed on remote servers.
type ServerService struct {
	repo    repository.ServerRepository
	sshPool *ssh.SSHConnectionPool
}

// NewServerService initializes a ServerService.
func NewServerService(repo repository.ServerRepository, sshPool *ssh.SSHConnectionPool) *ServerService {
	return &ServerService{
		repo:    repo,
		sshPool: sshPool,
	}
}

// TestConnection tests an SSH configuration before saving it.
func (s *ServerService) TestConnection(
	ctx context.Context,
	ip string,
	port int,
	user string,
	authMethod string,
	password string,
	privateKey string,
	passphrase string,
) (*ssh.SystemInfo, error) {
	cfg := &ssh.Config{
		Host:       ip,
		Port:       port,
		User:       user,
		AuthMethod: authMethod,
		Password:   password,
		PrivateKey: privateKey,
		Passphrase: passphrase,
	}

	client, err := ssh.Dial(cfg)
	if err != nil {
		return nil, fmt.Errorf("connection failed: %w", err)
	}
	defer client.Close()

	// Gather baseline system information
	session, err := client.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to open SSH session: %w", err)
	}
	defer session.Close()

	cmd := `uname -sr && (grep -i "PRETTY_NAME" /etc/os-release || echo "PRETTY_NAME=\"Linux\"") && (grep -m1 "model name" /proc/cpuinfo || echo "model name: Generic CPU") && nproc && (cat /proc/uptime || echo "0 0")`
	stdoutBytes, err := session.Output(cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to run system information commands: %w", err)
	}

	info, err := ssh.ParseSystemInfo(string(stdoutBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to parse system info: %w", err)
	}

	return info, nil
}

// ListProcesses fetches the process list sorted by high CPU usage.
func (s *ServerService) ListProcesses(ctx context.Context, serverID string) ([]*ssh.ProcessInfo, error) {
	cmd := "ps -eo user,pid,ppid,%cpu,%mem,comm --sort=-%cpu | head -n 30"
	stdout, err := s.sshPool.RunCommand(serverID, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve process list: %w", err)
	}

	list, err := ssh.ParseProcesses(stdout)
	if err != nil {
		return nil, fmt.Errorf("failed to parse process list output: %w", err)
	}

	return list, nil
}

// ManageService starts, stops, or restarts a systemd service unit.
func (s *ServerService) ManageService(ctx context.Context, serverID string, serviceName string, action string) error {
	action = strings.ToLower(strings.TrimSpace(action))
	validActions := map[string]bool{"start": true, "stop": true, "restart": true}
	if !validActions[action] {
		return fmt.Errorf("invalid service action %q, must be start, stop, or restart", action)
	}

	// Remove suffix if supplied by mistake
	if !strings.HasSuffix(serviceName, ".service") && !strings.Contains(serviceName, ".") {
		serviceName = serviceName + ".service"
	}

	cmd := fmt.Sprintf("systemctl %s %s", action, serviceName)
	_, err := s.sshPool.RunCommand(serverID, cmd)
	if err != nil {
		// Try using sudo as fallback
		cmdSudo := fmt.Sprintf("sudo systemctl %s %s", action, serviceName)
		_, errSudo := s.sshPool.RunCommand(serverID, cmdSudo)
		if errSudo != nil {
			return fmt.Errorf("service command failed: %w (fallback sudo failed: %v)", err, errSudo)
		}
	}

	return nil
}

// ListServices lists systemd services on a remote server.
func (s *ServerService) ListServices(ctx context.Context, serverID string) ([]*ssh.SystemdService, error) {
	cmd := "systemctl list-units --type=service --all --no-legend --no-pager"
	stdout, err := s.sshPool.RunCommand(serverID, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to list services: %w", err)
	}

	list, err := ssh.ParseSystemdServices(stdout)
	if err != nil {
		return nil, fmt.Errorf("failed to parse services list output: %w", err)
	}

	return list, nil
}
