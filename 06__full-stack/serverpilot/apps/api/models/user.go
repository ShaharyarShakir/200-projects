package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user model in the system.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserResponse represents the sanitized user response structure.
type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

// ToUserResponse converts a User model to a sanitized UserResponse.
func ToUserResponse(user *User) *UserResponse {
	return &UserResponse{
		ID:    user.ID,
		Email: user.Email,
	}
}

// HashPassword hashes a raw password string using bcrypt.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// ComparePassword compares a raw password against its stored hash.
func ComparePassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
