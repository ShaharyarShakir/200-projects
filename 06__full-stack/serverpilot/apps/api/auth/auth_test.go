package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateAndParseAccessToken(t *testing.T) {
	secret := "my_super_secret_key_12345!"
	userID := "user_123"
	email := "test@example.com"

	// 1. Generate token
	tokenStr, err := GenerateAccessToken(userID, email, secret)
	if err != nil {
		t.Fatalf("failed to generate access token: %v", err)
	}

	if tokenStr == "" {
		t.Fatal("generated token is empty")
	}

	// 2. Parse token
	claims, err := ParseAccessToken(tokenStr, secret)
	if err != nil {
		t.Fatalf("failed to parse access token: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected UserID %q, got %q", userID, claims.UserID)
	}
	if claims.Email != email {
		t.Errorf("expected Email %q, got %q", email, claims.Email)
	}
}

func TestGenerateAndParseRefreshToken(t *testing.T) {
	secret := "my_super_secret_key_54321!"
	userID := "user_123"
	tokenID := "token_xyz"

	// 1. Generate token
	tokenStr, err := GenerateRefreshToken(userID, tokenID, secret)
	if err != nil {
		t.Fatalf("failed to generate refresh token: %v", err)
	}

	if tokenStr == "" {
		t.Fatal("generated token is empty")
	}

	// 2. Parse token
	claims, err := ParseRefreshToken(tokenStr, secret)
	if err != nil {
		t.Fatalf("failed to parse refresh token: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected UserID %q, got %q", userID, claims.UserID)
	}
	if claims.TokenID != tokenID {
		t.Errorf("expected TokenID %q, got %q", tokenID, claims.TokenID)
	}
}

func TestExpiredTokens(t *testing.T) {
	secret := "my_super_secret_key_12345!"

	// Test Expired Access Token
	claims := AccessClaims{
		UserID: "user_123",
		Email:  "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-5 * time.Minute)), // 5 mins in past
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-10 * time.Minute)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))

	_, err := ParseAccessToken(tokenStr, secret)
	if err == nil {
		t.Fatal("expected error parsing expired access token, got nil")
	}
	if err != ErrExpiredToken {
		t.Errorf("expected ErrExpiredToken, got %v", err)
	}

	// Test Expired Refresh Token
	refClaims := RefreshClaims{
		UserID:  "user_123",
		TokenID: "token_xyz",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-10 * time.Minute)),
		},
	}
	refToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refClaims)
	refTokenStr, _ := refToken.SignedString([]byte(secret))

	_, err = ParseRefreshToken(refTokenStr, secret)
	if err == nil {
		t.Fatal("expected error parsing expired refresh token, got nil")
	}
	if err != ErrExpiredToken {
		t.Errorf("expected ErrExpiredToken, got %v", err)
	}
}

func TestInvalidTokenSignature(t *testing.T) {
	secret := "my_super_secret_key_12345!"
	wrongSecret := "wrong_secret_key_987654!"

	tokenStr, _ := GenerateAccessToken("user_123", "test@example.com", secret)

	_, err := ParseAccessToken(tokenStr, wrongSecret)
	if err == nil {
		t.Fatal("expected error parsing token with wrong secret, got nil")
	}
	if err != ErrInvalidToken {
		t.Errorf("expected ErrInvalidToken, got %v", err)
	}
}

// Benchmarks

func BenchmarkGenerateAccessToken(b *testing.B) {
	secret := "my_super_secret_key_12345!"
	userID := "user_123"
	email := "test@example.com"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = GenerateAccessToken(userID, email, secret)
	}
}

func BenchmarkParseAccessToken(b *testing.B) {
	secret := "my_super_secret_key_12345!"
	userID := "user_123"
	email := "test@example.com"
	tokenStr, _ := GenerateAccessToken(userID, email, secret)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ParseAccessToken(tokenStr, secret)
	}
}
