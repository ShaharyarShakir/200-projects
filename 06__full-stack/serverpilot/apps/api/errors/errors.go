// Package errors defines application-wide error types and codes for consistent
// error handling across handlers, services, and middleware layers.
package errors

import (
	"errors"
	"fmt"
	"net/http"
)

// ErrorCode is a machine-readable identifier for application errors.
type ErrorCode string

const (
	CodeValidation   ErrorCode = "VALIDATION_ERROR"
	CodeUnauthorized ErrorCode = "UNAUTHORIZED"
	CodeForbidden    ErrorCode = "FORBIDDEN"
	CodeNotFound     ErrorCode = "NOT_FOUND"
	CodeConflict     ErrorCode = "CONFLICT"
	CodeRateLimited  ErrorCode = "RATE_LIMITED"
	CodeInternal     ErrorCode = "INTERNAL_ERROR"
	CodeBadRequest   ErrorCode = "BAD_REQUEST"
	CodeTimeout      ErrorCode = "REQUEST_TIMEOUT"
	CodeUserExists   ErrorCode = "USER_ALREADY_EXISTS"
	CodeInvalidCreds ErrorCode = "INVALID_CREDENTIALS"
	CodeInvalidToken ErrorCode = "INVALID_TOKEN"
	CodeDatabase     ErrorCode = "DATABASE_ERROR"
)

// AppError represents a structured application error with HTTP mapping.
type AppError struct {
	Code       ErrorCode `json:"code"`
	Message    string    `json:"message"`
	HTTPStatus int       `json:"-"`
	Err        error     `json:"-"`
}

// Error implements the error interface.
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap returns the underlying wrapped error for errors.Is/As chains.
func (e *AppError) Unwrap() error {
	return e.Err
}

// New creates a new AppError with the given code, message, and HTTP status.
func New(code ErrorCode, message string, httpStatus int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
	}
}

// Wrap creates an AppError wrapping an underlying error.
func Wrap(code ErrorCode, message string, httpStatus int, err error) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
		Err:        err,
	}
}

// --- Pre-defined sentinel errors for service layer ---

var (
	ErrUserAlreadyExists  = New(CodeUserExists, "User with this email already exists", http.StatusConflict)
	ErrInvalidCredentials = New(CodeInvalidCreds, "Invalid email or password", http.StatusUnauthorized)
	ErrInvalidToken       = New(CodeInvalidToken, "Invalid or expired token", http.StatusUnauthorized)
	ErrNotFound           = New(CodeNotFound, "Resource not found", http.StatusNotFound)
	ErrUnauthorized       = New(CodeUnauthorized, "Unauthorized", http.StatusUnauthorized)
	ErrValidation         = New(CodeValidation, "Validation failed", http.StatusBadRequest)
)

// IsAppError checks whether err is an *AppError.
func IsAppError(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return nil, false
}

// HTTPStatusFromError resolves the HTTP status code from any error type.
func HTTPStatusFromError(err error) int {
	if appErr, ok := IsAppError(err); ok {
		return appErr.HTTPStatus
	}
	return http.StatusInternalServerError
}

// MessageFromError extracts a user-facing message from any error type.
func MessageFromError(err error) string {
	if appErr, ok := IsAppError(err); ok {
		return appErr.Message
	}
	return "An internal server error occurred"
}

// CodeFromError extracts the error code from any error type.
func CodeFromError(err error) ErrorCode {
	if appErr, ok := IsAppError(err); ok {
		return appErr.Code
	}
	return CodeInternal
}
