package database

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ShaharyarShakir/academy-os/internal/database/dbgen"
)

type SessionRepository struct {
	db *pgxpool.Pool
	q  *dbgen.Queries
}

func NewSessionRepository(db *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{
		db: db,
		q:  dbgen.New(db),
	}
}

type Session struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	ExpiresAt time.Time
}

func toPgTimestamptz(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

func (r *SessionRepository) Create(
	ctx context.Context,
	userID uuid.UUID,
	duration time.Duration,
) (Session, error) {
	expiresAt := time.Now().Add(duration)
	s, err := r.q.CreateSession(ctx, dbgen.CreateSessionParams{
		UserID:    toPgUUID(userID),
		ExpiresAt: toPgTimestamptz(expiresAt),
	})

	if err != nil {
		return Session{}, fmt.Errorf("create session: %w", err)
	}

	return Session{
		ID:        toGoogleUUID(s.ID),
		UserID:    toGoogleUUID(s.UserID),
		ExpiresAt: s.ExpiresAt.Time,
	}, nil
}

func (r *SessionRepository) CreateWithTokenHash(
	ctx context.Context,
	userID uuid.UUID,
	tokenHash []byte,
	expiresAt time.Time,
) (Session, error) {
	s, err := r.q.CreateSessionWithTokenHash(ctx, dbgen.CreateSessionWithTokenHashParams{
		UserID:    toPgUUID(userID),
		TokenHash: tokenHash,
		ExpiresAt: toPgTimestamptz(expiresAt),
	})

	if err != nil {
		return Session{}, fmt.Errorf("create session with token hash: %w", err)
	}

	return Session{
		ID:        toGoogleUUID(s.ID),
		UserID:    toGoogleUUID(s.UserID),
		ExpiresAt: s.ExpiresAt.Time,
	}, nil
}

func (r *SessionRepository) FindByTokenHash(
	ctx context.Context,
	tokenHash []byte,
) (Session, error) {
	s, err := r.q.GetSessionByTokenHash(ctx, tokenHash)

	if err != nil {
		return Session{}, fmt.Errorf("find session by token hash: %w", err)
	}

	return Session{
		ID:        toGoogleUUID(s.ID),
		UserID:    toGoogleUUID(s.UserID),
		ExpiresAt: s.ExpiresAt.Time,
	}, nil
}

func (r *SessionRepository) Find(
	ctx context.Context,
	sessionID uuid.UUID,
) (Session, error) {
	s, err := r.q.GetSessionByID(ctx, toPgUUID(sessionID))

	if err != nil {
		return Session{}, fmt.Errorf("find session: %w", err)
	}

	return Session{
		ID:        toGoogleUUID(s.ID),
		UserID:    toGoogleUUID(s.UserID),
		ExpiresAt: s.ExpiresAt.Time,
	}, nil
}

func (r *SessionRepository) Delete(
	ctx context.Context,
	sessionID uuid.UUID,
) error {
	err := r.q.DeleteSession(ctx, toPgUUID(sessionID))

	if err != nil {
		return fmt.Errorf("delete session: %w", err)
	}

	return nil
}

func (r *SessionRepository) UpdateLastUsed(
	ctx context.Context,
	sessionID uuid.UUID,
) error {
	err := r.q.UpdateSessionLastUsed(ctx, toPgUUID(sessionID))

	if err != nil {
		return fmt.Errorf("update session last used: %w", err)
	}

	return nil
}