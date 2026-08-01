package ssh

import (
	"bytes"
	"fmt"
	"sync"
	"time"

	"golang.org/x/crypto/ssh"
)

// SSHConnectionPool manages active SSH connections for multiple servers.
type SSHConnectionPool struct {
	mu      sync.RWMutex
	clients map[string]*ssh.Client
	configs map[string]*Config
}

// NewSSHConnectionPool initializes an empty connection pool.
func NewSSHConnectionPool() *SSHConnectionPool {
	return &SSHConnectionPool{
		clients: make(map[string]*ssh.Client),
		configs: make(map[string]*Config),
	}
}

// RegisterConfig registers or updates the SSH config for a specific server.
// Closes any existing connection to force reconnection with the new config.
func (p *SSHConnectionPool) RegisterConfig(serverID string, cfg *Config) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.configs[serverID] = cfg
	if client, ok := p.clients[serverID]; ok {
		_ = client.Close()
		delete(p.clients, serverID)
	}
}

// RemoveServer removes a server config and closes its active connection.
func (p *SSHConnectionPool) RemoveServer(serverID string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[serverID]; ok {
		_ = client.Close()
		delete(p.clients, serverID)
	}
	delete(p.configs, serverID)
}

// GetClient retrieves an active SSH client or connects on-demand if offline.
func (p *SSHConnectionPool) GetClient(serverID string) (*ssh.Client, error) {
	p.mu.Lock()
	
	// Check cached client first
	if client, ok := p.clients[serverID]; ok {
		p.mu.Unlock()
		return client, nil
	}
	
	cfg, ok := p.configs[serverID]
	p.mu.Unlock() // unlock to dial, preventing blocking the pool
	
	if !ok {
		return nil, fmt.Errorf("no SSH configuration registered for server ID %s", serverID)
	}

	newClient, err := Dial(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to establish SSH connection: %w", err)
	}

	p.mu.Lock()
	// Check if another goroutine connected in the meantime
	if client, ok := p.clients[serverID]; ok {
		_ = newClient.Close()
		p.mu.Unlock()
		return client, nil
	}

	p.clients[serverID] = newClient
	p.mu.Unlock()

	// Start keep-alive watcher
	go StartKeepAlive(newClient, 15*time.Second, func() {
		p.mu.Lock()
		defer p.mu.Unlock()
		// Only remove if it hasn't been replaced by a newer connection
		if current, ok := p.clients[serverID]; ok && current == newClient {
			delete(p.clients, serverID)
		}
	})

	return newClient, nil
}

// RunCommand runs a command on a remote server. Handles retry if a cached connection is dead.
func (p *SSHConnectionPool) RunCommand(serverID string, cmd string) (string, error) {
	client, err := p.GetClient(serverID)
	if err != nil {
		return "", err
	}

	session, err := client.NewSession()
	if err != nil {
		// Connection might have died silently. Evict and try reconnecting once.
		p.mu.Lock()
		if current, ok := p.clients[serverID]; ok && current == client {
			_ = client.Close()
			delete(p.clients, serverID)
		}
		p.mu.Unlock()

		// Retry connection
		client, err = p.GetClient(serverID)
		if err != nil {
			return "", fmt.Errorf("retry connection failed: %w", err)
		}

		session, err = client.NewSession()
		if err != nil {
			return "", fmt.Errorf("failed to create SSH session on retry: %w", err)
		}
	}
	defer session.Close()

	var stdout, stderr bytes.Buffer
	session.Stdout = &stdout
	session.Stderr = &stderr

	err = session.Run(cmd)
	if err != nil {
		return "", fmt.Errorf("command execution failed: %w (stderr: %s)", err, stderr.String())
	}

	return stdout.String(), nil
}

// Close closes all active connections in the pool.
func (p *SSHConnectionPool) Close() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for id, client := range p.clients {
		_ = client.Close()
		delete(p.clients, id)
	}
}
