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
	return &UserRepository{
		db: db,
	}
}

type UserRecord struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	Role         string    `json:"role"`
}

func (r *UserRepository) Create(
	ctx context.Context,
	email string,
	passwordHash string,
	name string,
	role string,
) (UserRecord, error) {
	if role == "" {
		role = "INSTRUCTOR"
	}

	var user UserRecord
	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO users (email, password_hash, name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, password_hash, name, role
		`,
		email,
		passwordHash,
		name,
		role,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Role,
	)

	if err != nil {
		return UserRecord{}, fmt.Errorf("create user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) FindByEmail(
	ctx context.Context,
	email string,
) (UserRecord, error) {
	var user UserRecord
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, email, password_hash, name, role
		FROM users
		WHERE email = $1
		`,
		email,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Role,
	)

	if err != nil {
		return UserRecord{}, fmt.Errorf("find user by email: %w", err)
	}

	return user, nil
}

func (r *UserRepository) FindByID(
	ctx context.Context,
	id uuid.UUID,
) (UserRecord, error) {
	var user UserRecord
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, email, password_hash, name, role
		FROM users
		WHERE id = $1
		`,
		id,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Role,
	)

	if err != nil {
		return UserRecord{}, fmt.Errorf("find user by id: %w", err)
	}

	return user, nil
}

func (r *UserRepository) ListAll(
	ctx context.Context,
) ([]UserRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, email, password_hash, name, role
		FROM users
		ORDER BY created_at DESC
		`,
	)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var users []UserRecord
	for rows.Next() {
		var user UserRecord
		if err := rows.Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}
