package validation

import (
	"strings"
	"testing"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		want    string
		wantErr bool
	}{
		{"Valid Email", "TEST@example.com", "test@example.com", false},
		{"Empty Email", "", "", true},
		{"Too Long Email", strings.Repeat("a", 250) + "@test.com", "", true},
		{"Invalid format - no domain", "test@", "", true},
		{"Invalid format - no @", "test.com", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ValidateEmail(tt.email)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateEmail() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ValidateEmail() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"Valid Password", "strongpassword123", false},
		{"Empty Password", "", true},
		{"Too Short Password", "12345", true},
		{"Too Long Password", strings.Repeat("a", 129), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePassword() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateCreateServerInput(t *testing.T) {
	tests := []struct {
		name      string
		srvName   string
		ip        string
		os        string
		provider  string
		location  string
		tags      []string
		wantErr   bool
		checkOS   string
		checkProv string
	}{
		{"Valid Input", "web-prod-01", "192.168.1.1", "Ubuntu 22.04 LTS", "AWS", "Virginia, USA", []string{"prod"}, false, "Ubuntu 22.04 LTS", "AWS"},
		{"Invalid IP", "web-prod-01", "999.999.999.999", "Ubuntu 22.04 LTS", "AWS", "Virginia, USA", []string{"prod"}, true, "", ""},
		{"Empty Name", "", "192.168.1.1", "Ubuntu", "AWS", "Virginia", nil, true, "", ""},
		{"Too Long Name", strings.Repeat("s", 101), "192.168.1.1", "Ubuntu", "AWS", "Virginia", nil, true, "", ""},
		{"Empty Optional Defaults", "web-prod-01", "192.168.1.1", "", "", "", nil, false, "Ubuntu 22.04 LTS", "AWS"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ValidateCreateServerInput(tt.srvName, tt.ip, tt.os, tt.provider, tt.location, tt.tags, 22, "root", "password", "mypassword", "", "")
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateCreateServerInput() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && got != nil {
				if got.OS != tt.checkOS {
					t.Errorf("expected OS %q, got %q", tt.checkOS, got.OS)
				}
				if got.Provider != tt.checkProv {
					t.Errorf("expected Provider %q, got %q", tt.checkProv, got.Provider)
				}
			}
		})
	}
}

func TestValidatePowerAction(t *testing.T) {
	tests := []struct {
		name    string
		ids     []string
		action  string
		wantErr bool
	}{
		{"Valid Action Start", []string{"srv_1"}, "start", false},
		{"Valid Action Restart Caps", []string{"srv_1"}, "RESTART", false},
		{"Empty IDs", []string{}, "start", true},
		{"Invalid Action Type", []string{"srv_1"}, "terminate", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ValidatePowerAction(tt.ids, tt.action)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePowerAction() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func BenchmarkValidateRegisterInput(b *testing.B) {
	email := "test@example.com"
	pass := "password123"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ValidateRegisterInput(email, pass)
	}
}

func BenchmarkValidateCreateServerInput(b *testing.B) {
	name := "api-gateway"
	ip := "10.0.0.1"
	osStr := "Ubuntu"
	provider := "GCP"
	loc := "Iowa"
	tags := []string{"gateway", "k8s"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ValidateCreateServerInput(name, ip, osStr, provider, loc, tags, 22, "root", "password", "mypassword", "", "")
	}
}
