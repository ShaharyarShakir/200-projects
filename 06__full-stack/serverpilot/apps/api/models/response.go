package models

// JSONResponse defines the standard payload structure for all API endpoints.
type JSONResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

// APIError details a structured error payload.
type APIError struct {
	Message string `json:"message"`
	Code    int    `json:"code,omitempty"`
}

// SuccessResponse creates a successful structured API response payload.
func SuccessResponse(data interface{}) *JSONResponse {
	return &JSONResponse{
		Success: true,
		Data:    data,
	}
}

// ErrorResponse creates a failed structured API response payload.
func ErrorResponse(message string, code int) *JSONResponse {
	return &JSONResponse{
		Success: false,
		Error: &APIError{
			Message: message,
			Code:    code,
		},
	}
}
