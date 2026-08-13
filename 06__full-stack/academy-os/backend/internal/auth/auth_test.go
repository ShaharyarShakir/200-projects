package auth

import (
	"testing"
)

func TestNormalizeEmail(t *testing.T) {
	tests := []struct {
		input    string
		expected string
		wantErr  bool
	}{
		{" John@Example.com ", "john@example.com", false},
		{"sarah@academy.com", "sarah@academy.com", false},
		{"", "", true},
		{"invalid-email", "", true},
	}

	for _, tt := range tests {
		got, err := NormalizeEmail(tt.input)
		if tt.wantErr && err == nil {
			t.Errorf("NormalizeEmail(%q) expected error, got nil", tt.input)
		}
		if !tt.wantErr && err != nil {
			t.Errorf("NormalizeEmail(%q) unexpected error: %v", tt.input, err)
		}
		if got != tt.expected {
			t.Errorf("NormalizeEmail(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestPasswordHashingAndVerification(t *testing.T) {
	password := "correct-horse-battery-staple"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if !VerifyPassword(password, hash) {
		t.Errorf("VerifyPassword failed for correct password")
	}

	if VerifyPassword("wrong-password", hash) {
		t.Errorf("VerifyPassword succeeded for wrong password")
	}
}

func TestPasswordValidation(t *testing.T) {
	if err := ValidatePassword("short"); err == nil {
		t.Errorf("ValidatePassword accepted short password")
	}

	if err := ValidatePassword("validpassword123"); err != nil {
		t.Errorf("ValidatePassword rejected valid password: %v", err)
	}
}

func TestSessionTokenGeneration(t *testing.T) {
	token, hash, err := GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken failed: %v", err)
	}

	if token == "" || len(hash) == 0 {
		t.Errorf("Invalid token or hash generated")
	}
}
