package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository/db"
)

// UserRepository defines database interactions for users.
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
}

// SQLUserRepository implements UserRepository.
type SQLUserRepository struct {
	queries *db.Queries
	db      *sql.DB
}

// NewUserRepository returns an instance of SQLUserRepository.
func NewUserRepository(dbConn *sql.DB) UserRepository {
	return &SQLUserRepository{
		queries: db.New(dbConn),
		db:      dbConn,
	}
}

// Create inserts a user into the database.
func (r *SQLUserRepository) Create(ctx context.Context, user *models.User) error {
	return r.queries.CreateUser(ctx, db.CreateUserParams{
		ID:           user.ID,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	})
}

// GetByID fetches a user by their ID.
func (r *SQLUserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	row, err := r.queries.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &models.User{
		ID:           row.ID,
		Email:        row.Email,
		PasswordHash: row.PasswordHash,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
	}, nil
}

// GetByEmail fetches a user by their email address.
func (r *SQLUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	row, err := r.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &models.User{
		ID:           row.ID,
		Email:        row.Email,
		PasswordHash: row.PasswordHash,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
	}, nil
}
