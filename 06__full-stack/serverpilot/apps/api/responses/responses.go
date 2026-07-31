// Package responses provides centralized JSON response helpers for all HTTP handlers.
package responses

import (
	"encoding/json"
	"net/http"

	apperrors "github.com/ShaharyarShakir/serverpilot/apps/api/errors"
)

// JSONResponse is the standard API envelope returned by all endpoints.
type JSONResponse struct {
	Success bool       `json:"success"`
	Data    any        `json:"data,omitempty"`
	Error   *ErrorBody `json:"error,omitempty"`
}

// ErrorBody holds structured error details in API responses.
type ErrorBody struct {
	Message string             `json:"message"`
	Code    apperrors.ErrorCode `json:"code,omitempty"`
}

// JSON writes a raw JSON payload with the given status code.
func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// Success writes a successful JSON response with data payload.
func Success(w http.ResponseWriter, status int, data any) {
	JSON(w, status, &JSONResponse{
		Success: true,
		Data:    data,
	})
}

// OK writes a 200 OK success response.
func OK(w http.ResponseWriter, data any) {
	Success(w, http.StatusOK, data)
}

// Created writes a 201 Created success response.
func Created(w http.ResponseWriter, data any) {
	Success(w, http.StatusCreated, data)
}

// Error writes a failed JSON response with message and optional error code.
func Error(w http.ResponseWriter, status int, message string, code apperrors.ErrorCode) {
	JSON(w, status, &JSONResponse{
		Success: false,
		Error: &ErrorBody{
			Message: message,
			Code:    code,
		},
	})
}

// HandleError maps an application error to the appropriate HTTP response.
func HandleError(w http.ResponseWriter, err error) {
	if appErr, ok := apperrors.IsAppError(err); ok {
		Error(w, appErr.HTTPStatus, appErr.Message, appErr.Code)
		return
	}
	Error(w, http.StatusInternalServerError, "An internal server error occurred", apperrors.CodeInternal)
}

// BadRequest writes a 400 validation error response.
func BadRequest(w http.ResponseWriter, message string) {
	Error(w, http.StatusBadRequest, message, apperrors.CodeValidation)
}

// Unauthorized writes a 401 unauthorized response.
func Unauthorized(w http.ResponseWriter, message string) {
	Error(w, http.StatusUnauthorized, message, apperrors.CodeUnauthorized)
}

// Conflict writes a 409 conflict response.
func Conflict(w http.ResponseWriter, message string) {
	Error(w, http.StatusConflict, message, apperrors.CodeConflict)
}

// RateLimited writes a 429 too many requests response.
func RateLimited(w http.ResponseWriter, message string) {
	Error(w, http.StatusTooManyRequests, message, apperrors.CodeRateLimited)
}
