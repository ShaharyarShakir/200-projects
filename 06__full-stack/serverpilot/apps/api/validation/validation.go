// Package validation provides reusable input validation for API request payloads.
package validation

import (
	"fmt"
	"net"
	"regexp"
	"strings"

	apperrors "github.com/ShaharyarShakir/serverpilot/apps/api/errors"
)

const (
	minPasswordLength = 6
	maxPasswordLength = 128
	maxEmailLength    = 254
	maxNameLength     = 100
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// RegisterInput holds validated registration payload fields.
type RegisterInput struct {
	Email    string
	Password string
}

// LoginInput holds validated login payload fields.
type LoginInput struct {
	Email    string
	Password string
}

// CreateServerInput holds validated server creation payload fields.
type CreateServerInput struct {
	Name            string
	IP              string
	OS              string
	Provider        string
	Location        string
	Tags            []string
	SSHPort         int
	SSHUser         string
	SSHAuthMethod   string
	SSHPassword     string
	SSHPrivateKey   string
	SSHPassphrase   string
}

// PowerActionInput holds validated power action payload fields.
type PowerActionInput struct {
	IDs    []string
	Action string
}

// BulkDeleteInput holds validated bulk delete payload fields.
type BulkDeleteInput struct {
	IDs []string
}

// ValidateEmail normalizes and validates an email address.
func ValidateEmail(email string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return "", apperrors.New(apperrors.CodeValidation, "Email is required", 400)
	}
	if len(email) > maxEmailLength {
		return "", apperrors.New(apperrors.CodeValidation, "Email is too long", 400)
	}
	if !emailRegex.MatchString(email) {
		return "", apperrors.New(apperrors.CodeValidation, "Invalid email format", 400)
	}
	return email, nil
}

// ValidatePassword checks password length constraints.
func ValidatePassword(password string) error {
	if password == "" {
		return apperrors.New(apperrors.CodeValidation, "Password is required", 400)
	}
	if len(password) < minPasswordLength {
		return apperrors.New(apperrors.CodeValidation,
			fmt.Sprintf("Password must be at least %d characters long", minPasswordLength), 400)
	}
	if len(password) > maxPasswordLength {
		return apperrors.New(apperrors.CodeValidation, "Password is too long", 400)
	}
	return nil
}

// ValidateRegisterInput validates registration request fields.
func ValidateRegisterInput(email, password string) (*RegisterInput, error) {
	validEmail, err := ValidateEmail(email)
	if err != nil {
		return nil, err
	}
	if err := ValidatePassword(password); err != nil {
		return nil, err
	}
	return &RegisterInput{Email: validEmail, Password: password}, nil
}

// ValidateLoginInput validates login request fields.
func ValidateLoginInput(email, password string) (*LoginInput, error) {
	validEmail, err := ValidateEmail(email)
	if err != nil {
		return nil, err
	}
	if password == "" {
		return nil, apperrors.New(apperrors.CodeValidation, "Password is required", 400)
	}
	return &LoginInput{Email: validEmail, Password: password}, nil
}

// ValidateCreateServerInput validates server creation fields including SSH configurations.
func ValidateCreateServerInput(
	name, ip, os, provider, location string,
	tags []string,
	sshPort int,
	sshUser, sshAuthMethod, sshPassword, sshPrivateKey, sshPassphrase string,
) (*CreateServerInput, error) {
	name = strings.TrimSpace(name)
	ip = strings.TrimSpace(ip)

	if name == "" {
		return nil, apperrors.New(apperrors.CodeValidation, "Server name is required", 400)
	}
	if len(name) > maxNameLength {
		return nil, apperrors.New(apperrors.CodeValidation, "Server name is too long", 400)
	}
	if ip == "" {
		return nil, apperrors.New(apperrors.CodeValidation, "IP address is required", 400)
	}
	if net.ParseIP(ip) == nil {
		return nil, apperrors.New(apperrors.CodeValidation, "Invalid IP address format", 400)
	}

	if os == "" {
		os = "Ubuntu 22.04 LTS"
	}
	if provider == "" {
		provider = "AWS"
	}
	if location == "" {
		location = "Virginia, USA"
	}

	// Validate SSH fields
	if sshPort <= 0 || sshPort > 65535 {
		sshPort = 22
	}
	sshUser = strings.TrimSpace(sshUser)
	if sshUser == "" {
		sshUser = "root"
	}
	sshAuthMethod = strings.ToLower(strings.TrimSpace(sshAuthMethod))
	if sshAuthMethod != "password" && sshAuthMethod != "private_key" {
		sshAuthMethod = "password"
	}

	if sshAuthMethod == "password" && strings.TrimSpace(sshPassword) == "" {
		return nil, apperrors.New(apperrors.CodeValidation, "SSH Password is required for Password auth method", 400)
	}
	if sshAuthMethod == "private_key" && strings.TrimSpace(sshPrivateKey) == "" {
		return nil, apperrors.New(apperrors.CodeValidation, "SSH Private Key is required for Private Key auth method", 400)
	}

	return &CreateServerInput{
		Name:            name,
		IP:              ip,
		OS:              os,
		Provider:        provider,
		Location:        location,
		Tags:            tags,
		SSHPort:         sshPort,
		SSHUser:         sshUser,
		SSHAuthMethod:   sshAuthMethod,
		SSHPassword:     sshPassword,
		SSHPrivateKey:   sshPrivateKey,
		SSHPassphrase:   sshPassphrase,
	}, nil
}

// ValidatePowerAction validates bulk power action fields.
func ValidatePowerAction(ids []string, action string) (*PowerActionInput, error) {
	if len(ids) == 0 {
		return nil, apperrors.New(apperrors.CodeValidation, "Server IDs are required", 400)
	}
	action = strings.ToLower(strings.TrimSpace(action))
	validActions := map[string]bool{"start": true, "stop": true, "restart": true}
	if !validActions[action] {
		return nil, apperrors.New(apperrors.CodeValidation, "Action must be start, stop, or restart", 400)
	}
	return &PowerActionInput{IDs: ids, Action: action}, nil
}

// ValidateBulkDelete validates bulk delete fields.
func ValidateBulkDelete(ids []string) (*BulkDeleteInput, error) {
	if len(ids) == 0 {
		return nil, apperrors.New(apperrors.CodeValidation, "Server IDs are required for deletion", 400)
	}
	return &BulkDeleteInput{IDs: ids}, nil
}
