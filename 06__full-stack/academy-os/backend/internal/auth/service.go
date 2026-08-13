package auth

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUnauthenticated    = errors.New("unauthenticated")
)

func NormalizeEmail(
	email string,
) (string, error) {
	email = strings.TrimSpace(email)
	email = strings.ToLower(email)

	if email == "" {
		return "", errors.New(
			"email is required",
		)
	}

	parsed, err := mail.ParseAddress(email)

	if err != nil || parsed.Address != email {
		return "", errors.New(
			"invalid email address",
		)
	}

	return email, nil
}

type Service struct {
	users    *database.UserRepository
	sessions *database.SessionRepository
}

func NewService(
	users *database.UserRepository,
	sessions *database.SessionRepository,
) *Service {
	return &Service{
		users:    users,
		sessions: sessions,
	}
}

func (s *Service) Signup(
	ctx context.Context,
	email string,
	password string,
	name string,
) (database.UserRecord, string, error) {
	email, err := NormalizeEmail(email)
	if err != nil {
		return database.UserRecord{}, "", err
	}

	name = strings.TrimSpace(name)
	if name == "" {
		return database.UserRecord{}, "", errors.New(
			"name is required",
		)
	}

	if len(name) > 100 {
		return database.UserRecord{}, "", errors.New(
			"name is too long",
		)
	}

	if err := ValidatePassword(password); err != nil {
		return database.UserRecord{}, "", err
	}

	passwordHash, err := HashPassword(password)
	if err != nil {
		return database.UserRecord{}, "", err
	}

	user, err := s.users.Create(
		ctx,
		email,
		passwordHash,
		name,
	)
	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			return database.UserRecord{}, "", errors.New("an account with this email already exists")
		}
		return database.UserRecord{}, "", fmt.Errorf("create user: %w", err)
	}

	token, tokenHash, err := GenerateSessionToken()
	if err != nil {
		return database.UserRecord{}, "", err
	}

	expiresAt := time.Now().UTC().Add(SessionLifetime)

	_, err = s.sessions.CreateWithTokenHash(
		ctx,
		user.ID,
		tokenHash,
		expiresAt,
	)
	if err != nil {
		return database.UserRecord{}, "", fmt.Errorf("create session: %w", err)
	}

	return user, token, nil
}

func (s *Service) Login(
	ctx context.Context,
	email string,
	password string,
) (database.UserRecord, string, error) {
	normalizedEmail, err := NormalizeEmail(email)
	if err != nil {
		return database.UserRecord{}, "", ErrInvalidCredentials
	}

	user, err := s.users.FindByEmail(ctx, normalizedEmail)
	if err != nil {
		return database.UserRecord{}, "", ErrInvalidCredentials
	}

	if !VerifyPassword(password, user.PasswordHash) {
		return database.UserRecord{}, "", ErrInvalidCredentials
	}

	token, tokenHash, err := GenerateSessionToken()
	if err != nil {
		return database.UserRecord{}, "", fmt.Errorf("generate session token: %w", err)
	}

	expiresAt := time.Now().UTC().Add(SessionLifetime)

	_, err = s.sessions.CreateWithTokenHash(
		ctx,
		user.ID,
		tokenHash,
		expiresAt,
	)
	if err != nil {
		return database.UserRecord{}, "", fmt.Errorf("create session: %w", err)
	}

	return user, token, nil
}

func (s *Service) Authenticate(
	ctx context.Context,
	token string,
) (database.UserRecord, error) {
	if token == "" {
		return database.UserRecord{}, ErrUnauthenticated
	}

	var sess database.Session
	var err error

	if sessionID, parseErr := uuid.Parse(token); parseErr == nil {
		sess, err = s.sessions.Find(ctx, sessionID)
	}
	if err != nil || sess.ID == uuid.Nil {
		tokenHash := HashSessionToken(token)
		sess, err = s.sessions.FindByTokenHash(ctx, tokenHash)
	}

	if err != nil || sess.ID == uuid.Nil {
		return database.UserRecord{}, ErrUnauthenticated
	}

	if time.Now().UTC().After(sess.ExpiresAt) {
		_ = s.sessions.Delete(ctx, sess.ID)
		return database.UserRecord{}, ErrUnauthenticated
	}

	user, err := s.users.FindByID(ctx, sess.UserID)
	if err != nil {
		return database.UserRecord{}, ErrUnauthenticated
	}

	_ = s.sessions.UpdateLastUsed(ctx, sess.ID)

	return user, nil
}

func (s *Service) Logout(
	ctx context.Context,
	token string,
) error {
	if token == "" {
		return nil
	}

	var sess database.Session
	var err error

	if sessionID, parseErr := uuid.Parse(token); parseErr == nil {
		sess, err = s.sessions.Find(ctx, sessionID)
	}
	if err != nil || sess.ID == uuid.Nil {
		tokenHash := HashSessionToken(token)
		sess, err = s.sessions.FindByTokenHash(ctx, tokenHash)
	}

	if err != nil || sess.ID == uuid.Nil {
		return nil
	}

	return s.sessions.Delete(ctx, sess.ID)
}
