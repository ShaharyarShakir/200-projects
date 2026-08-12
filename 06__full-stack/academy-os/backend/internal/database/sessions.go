package database

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SessionRepository struct {
	db *pgxpool.Pool
}

func NewSessionRepository(db *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{db: db}
}

type Session struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	ExpiresAt time.Time
}

func (r *SessionRepository) Create(
	ctx context.Context,
	userID uuid.UUID,
	duration time.Duration,
) (Session, error) {
	var session Session

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO sessions (
			user_id,
			expires_at
		)
		VALUES ($1, $2)
		RETURNING id, user_id, expires_at
		`,
		userID,
		time.Now().Add(duration),
	).Scan(
		&session.ID,
		&session.UserID,
		&session.ExpiresAt,
	)

	if err != nil {
		return Session{}, fmt.Errorf("create session: %w", err)
	}

	return session, nil
}