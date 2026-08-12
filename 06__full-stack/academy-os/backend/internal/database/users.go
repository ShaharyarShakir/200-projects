package database

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
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
	var user UserRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO users (
			email,
			password_hash,
			name
		)
		VALUES ($1, $2, $3)
		RETURNING id, email, password_hash, name
		`,
		email,
		passwordHash,
		name,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
	)

	if err != nil {
		return UserRecord{}, fmt.Errorf("create user: %w", err)
	}

	return user, nil
}
