package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
)

// UserRepository defines database interactions for users.
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
}

// SQLUserRepository implements UserRepository.
type SQLUserRepository struct {
	db *sql.DB
}

// NewUserRepository returns an instance of SQLUserRepository.
func NewUserRepository(db *sql.DB) UserRepository {
	return &SQLUserRepository{db: db}
}

// Create inserts a user into the database.
func (r *SQLUserRepository) Create(ctx context.Context, user *models.User) error {
	query := `INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, user.ID, user.Email, user.PasswordHash, user.CreatedAt.Format(time.RFC3339), user.UpdatedAt.Format(time.RFC3339))
	return err
}

// GetByID fetches a user by their ID.
func (r *SQLUserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = ?`
	var user models.User
	var createdAtStr, updatedAtStr string
	err := r.db.QueryRowContext(ctx, query, id).Scan(&user.ID, &user.Email, &user.PasswordHash, &createdAtStr, &updatedAtStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	user.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	if user.CreatedAt.IsZero() {
		user.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	}
	user.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAtStr)
	if user.UpdatedAt.IsZero() {
		user.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAtStr)
	}

	return &user, nil
}

// GetByEmail fetches a user by their email address.
func (r *SQLUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = ?`
	var user models.User
	var createdAtStr, updatedAtStr string
	err := r.db.QueryRowContext(ctx, query, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &createdAtStr, &updatedAtStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	user.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	if user.CreatedAt.IsZero() {
		user.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	}
	user.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAtStr)
	if user.UpdatedAt.IsZero() {
		user.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAtStr)
	}

	return &user, nil
}
