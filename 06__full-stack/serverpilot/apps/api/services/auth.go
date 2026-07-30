package services

import (
	"context"
	"errors"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/auth"
	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/google/uuid"
)

var (
	ErrUserAlreadyExists  = errors.New("user already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid or expired token")
)

// AuthService handles authentication business logic.
type AuthService struct {
	userRepo         repository.UserRepository
	tokenRepo        repository.TokenRepository
	jwtAccessSecret  string
	jwtRefreshSecret string
}

// NewAuthService creates a new instance of AuthService.
func NewAuthService(userRepo repository.UserRepository, tokenRepo repository.TokenRepository, accessSecret, refreshSecret string) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		tokenRepo:        tokenRepo,
		jwtAccessSecret:  accessSecret,
		jwtRefreshSecret: refreshSecret,
	}
}

// Register registers a new user and issues authentication tokens.
func (s *AuthService) Register(ctx context.Context, email, password string) (*models.UserResponse, string, string, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, "", "", err
	}
	if existingUser != nil {
		return nil, "", "", ErrUserAlreadyExists
	}

	// Hash password
	passwordHash, err := models.HashPassword(password)
	if err != nil {
		return nil, "", "", err
	}

	// Create user
	now := time.Now()
	user := &models.User{
		ID:           uuid.New().String(),
		Email:        email,
		PasswordHash: passwordHash,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, "", "", err
	}

	// Issue tokens
	accessToken, refreshToken, err := s.issueTokens(ctx, user)
	if err != nil {
		return nil, "", "", err
	}

	return models.ToUserResponse(user), accessToken, refreshToken, nil
}

// Login verifies credentials and issues authentication tokens.
func (s *AuthService) Login(ctx context.Context, email, password string) (*models.UserResponse, string, string, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, "", "", err
	}
	if user == nil {
		return nil, "", "", ErrInvalidCredentials
	}

	// Verify password
	if !models.ComparePassword(password, user.PasswordHash) {
		return nil, "", "", ErrInvalidCredentials
	}

	// Issue tokens
	accessToken, refreshToken, err := s.issueTokens(ctx, user)
	if err != nil {
		return nil, "", "", err
	}

	return models.ToUserResponse(user), accessToken, refreshToken, nil
}

// Logout revokes the refresh token.
func (s *AuthService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}

	// Revoke token from database
	return s.tokenRepo.DeleteByToken(ctx, token)
}

// Refresh generates a new access token using a valid refresh token.
func (s *AuthService) Refresh(ctx context.Context, token string) (string, error) {
	if token == "" {
		return "", ErrInvalidToken
	}

	// Parse and validate token signature
	claims, err := auth.ParseRefreshToken(token, s.jwtRefreshSecret)
	if err != nil {
		return "", ErrInvalidToken
	}

	// Look up token in database
	userID, _, expiresAt, err := s.tokenRepo.GetByToken(ctx, token)
	if err != nil {
		return "", err
	}
	if userID == "" {
		return "", ErrInvalidToken // Token was revoked/deleted
	}

	// Check expiry
	if time.Now().After(expiresAt) {
		s.tokenRepo.DeleteByToken(ctx, token) // Clean up expired token
		return "", ErrInvalidToken
	}

	// Fetch user details
	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", ErrInvalidToken
	}

	// Generate a new access token
	newAccessToken, err := auth.GenerateAccessToken(user.ID, user.Email, s.jwtAccessSecret)
	if err != nil {
		return "", err
	}

	return newAccessToken, nil
}

// Helper to generate access + refresh tokens and record the session
func (s *AuthService) issueTokens(ctx context.Context, user *models.User) (accessToken, refreshToken string, err error) {
	// Access token
	accessToken, err = auth.GenerateAccessToken(user.ID, user.Email, s.jwtAccessSecret)
	if err != nil {
		return "", "", err
	}

	// Refresh token ID
	tokenID := uuid.New().String()
	refreshToken, err = auth.GenerateRefreshToken(user.ID, tokenID, s.jwtRefreshSecret)
	if err != nil {
		return "", "", err
	}

	// Save to DB
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	err = s.tokenRepo.Create(ctx, tokenID, user.ID, refreshToken, expiresAt)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
