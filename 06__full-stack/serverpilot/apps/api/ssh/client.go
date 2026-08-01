// Package ssh handles low-level SSH connections, keep-alives, clustering, and pooling.
package ssh

import (
	"fmt"
	"net"
	"time"

	"golang.org/x/crypto/ssh"
)

// Config represents SSH connection credentials and options.
type Config struct {
	Host            string
	Port            int
	User            string
	AuthMethod      string // "password" or "private_key"
	Password        string
	PrivateKey      string
	Passphrase      string
	ExpectedHostKey string // Fingerprint SHA256:...
	HostKeyCallback func(hostname string, remote net.Addr, key ssh.PublicKey) error
}

// HostKeyFingerprint calculates the SHA256 fingerprint of an SSH public key.
func HostKeyFingerprint(key ssh.PublicKey) string {
	return ssh.FingerprintSHA256(key)
}

// parsePrivateKey parses and returns an ssh.Signer from key string.
// Supports encrypted private keys (PEM block with passphrase).
func parsePrivateKey(keyStr string, passphrase string) (ssh.Signer, error) {
	keyBytes := []byte(keyStr)
	
	if passphrase != "" {
		return ssh.ParsePrivateKeyWithPassphrase(keyBytes, []byte(passphrase))
	}
	
	return ssh.ParsePrivateKey(keyBytes)
}

// Dial establishes a connection to the remote host using config options.
func Dial(cfg *Config) (*ssh.Client, error) {
	var auths []ssh.AuthMethod

	if cfg.AuthMethod == "password" {
		auths = append(auths, ssh.Password(cfg.Password))
	} else if cfg.AuthMethod == "private_key" {
		signer, err := parsePrivateKey(cfg.PrivateKey, cfg.Passphrase)
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
		auths = append(auths, ssh.PublicKeys(signer))
	} else {
		return nil, fmt.Errorf("unsupported SSH authentication method: %s", cfg.AuthMethod)
	}

	var hostKeyCallback ssh.HostKeyCallback
	if cfg.HostKeyCallback != nil {
		hostKeyCallback = cfg.HostKeyCallback
	} else if cfg.ExpectedHostKey != "" {
		hostKeyCallback = func(hostname string, remote net.Addr, key ssh.PublicKey) error {
			fp := HostKeyFingerprint(key)
			if fp != cfg.ExpectedHostKey {
				return fmt.Errorf("ssh: host key mismatch. expected %s, got %s", cfg.ExpectedHostKey, fp)
			}
			return nil
		}
	} else {
		// If no callback or fingerprint is expected, default to insecure for flexibility
		hostKeyCallback = ssh.InsecureIgnoreHostKey()
	}

	clientConfig := &ssh.ClientConfig{
		User:            cfg.User,
		Auth:            auths,
		HostKeyCallback: hostKeyCallback,
		Timeout:         10 * time.Second,
	}

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	client, err := ssh.Dial("tcp", addr, clientConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to dial SSH address %s: %w", addr, err)
	}

	return client, nil
}

// StartKeepAlive initiates a loop that periodically sends SSH global keep-alive requests.
// Closes connection if remote fails to respond.
func StartKeepAlive(client *ssh.Client, interval time.Duration, onDisconnect func()) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		_, _, err := client.SendRequest("keepalive@serverpilot.io", true, nil)
		if err != nil {
			_ = client.Close()
			if onDisconnect != nil {
				onDisconnect()
			}
			return
		}
	}
}
