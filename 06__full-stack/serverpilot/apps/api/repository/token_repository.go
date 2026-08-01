package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/repository/db"
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
	queries *db.Queries
	db      *sql.DB
}

// NewTokenRepository returns an instance of SQLTokenRepository.
func NewTokenRepository(dbConn *sql.DB) TokenRepository {
	return &SQLTokenRepository{
		queries: db.New(dbConn),
		db:      dbConn,
	}
}

// Create inserts a new refresh token record.
func (r *SQLTokenRepository) Create(ctx context.Context, id string, userID string, token string, expiresAt time.Time) error {
	return r.queries.CreateToken(ctx, db.CreateTokenParams{
		ID:        id,
		UserID:    userID,
		Token:     token,
		ExpiresAt: expiresAt,
	})
}

// GetByToken retrieves token details by token value.
func (r *SQLTokenRepository) GetByToken(ctx context.Context, token string) (userID string, tokenID string, expiresAt time.Time, err error) {
	row, err := r.queries.GetToken(ctx, token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", "", time.Time{}, nil
		}
		return "", "", time.Time{}, err
	}

	return row.UserID, row.ID, row.ExpiresAt, nil
}

// DeleteByToken removes a refresh token by value.
func (r *SQLTokenRepository) DeleteByToken(ctx context.Context, token string) error {
	return r.queries.DeleteToken(ctx, token)
}

// DeleteByUserID removes all refresh tokens belonging to a user.
func (r *SQLTokenRepository) DeleteByUserID(ctx context.Context, userID string) error {
	return r.queries.DeleteTokensByUserID(ctx, userID)
}
