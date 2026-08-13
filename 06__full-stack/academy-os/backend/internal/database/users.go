package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ShaharyarShakir/academy-os/internal/database/dbgen"
)

type UserRepository struct {
	db *pgxpool.Pool
	q  *dbgen.Queries
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{
		db: db,
		q:  dbgen.New(db),
	}
}

type UserRecord struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Name         string
}

func (r *UserRepository) Create(
	ctx context.Context,
	email string,
	passwordHash string,
	name string,
) (UserRecord, error) {
	u, err := r.q.CreateUser(ctx, dbgen.CreateUserParams{
		Email:        email,
		PasswordHash: passwordHash,
		Name:         name,
	})

	if err != nil {
		return UserRecord{}, fmt.Errorf("create user: %w", err)
	}

	return UserRecord{
		ID:           toGoogleUUID(u.ID),
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		Name:         u.Name,
	}, nil
}

func (r *UserRepository) FindByEmail(
	ctx context.Context,
	email string,
) (UserRecord, error) {
	u, err := r.q.GetUserByEmail(ctx, email)

	if err != nil {
		return UserRecord{}, fmt.Errorf("find user by email: %w", err)
	}

	return UserRecord{
		ID:           toGoogleUUID(u.ID),
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		Name:         u.Name,
	}, nil
}

func (r *UserRepository) FindByID(
	ctx context.Context,
	id uuid.UUID,
) (UserRecord, error) {
	u, err := r.q.GetUserByID(ctx, toPgUUID(id))

	if err != nil {
		return UserRecord{}, fmt.Errorf("find user by id: %w", err)
	}

	return UserRecord{
		ID:           toGoogleUUID(u.ID),
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		Name:         u.Name,
	}, nil
}
