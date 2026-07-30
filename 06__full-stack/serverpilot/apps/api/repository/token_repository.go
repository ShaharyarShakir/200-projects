package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// TokenRepository defines database operations for tracking refresh tokens.
type TokenRepository interface {
	Create(ctx context.Context, id string, userID string, token string, expiresAt time.Time) error
	GetByToken(ctx context.Context, token string) (userID string, tokenID string, expiresAt time.Time, err error)
	DeleteByToken(ctx context.Context, token string) error
	DeleteByUserID(ctx context.Context, userID string) error
}

// SQLTokenRepository implements TokenRepository.
type SQLTokenRepository struct {
	db *sql.DB
}

// NewTokenRepository returns an instance of SQLTokenRepository.
func NewTokenRepository(db *sql.DB) TokenRepository {
	return &SQLTokenRepository{db: db}
}

// Create inserts a new refresh token record.
func (r *SQLTokenRepository) Create(ctx context.Context, id string, userID string, token string, expiresAt time.Time) error {
	query := `INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, id, userID, token, expiresAt.Format(time.RFC3339))
	return err
}

// GetByToken retrieves token details by token value.
func (r *SQLTokenRepository) GetByToken(ctx context.Context, token string) (userID string, tokenID string, expiresAt time.Time, err error) {
	query := `SELECT user_id, id, expires_at FROM refresh_tokens WHERE token = ?`
	var expiresAtStr string
	err = r.db.QueryRowContext(ctx, query, token).Scan(&userID, &tokenID, &expiresAtStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", "", time.Time{}, nil
		}
		return "", "", time.Time{}, err
	}

	expiresAt, _ = time.Parse(time.RFC3339, expiresAtStr)
	if expiresAt.IsZero() {
		expiresAt, _ = time.Parse("2006-01-02 15:04:05", expiresAtStr)
	}

	return userID, tokenID, expiresAt, nil
}

// DeleteByToken removes a refresh token by value.
func (r *SQLTokenRepository) DeleteByToken(ctx context.Context, token string) error {
	query := `DELETE FROM refresh_tokens WHERE token = ?`
	_, err := r.db.ExecContext(ctx, query, token)
	return err
}

// DeleteByUserID removes all refresh tokens belonging to a user.
func (r *SQLTokenRepository) DeleteByUserID(ctx context.Context, userID string) error {
	query := `DELETE FROM refresh_tokens WHERE user_id = ?`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}
