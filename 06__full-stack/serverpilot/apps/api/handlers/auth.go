package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/ShaharyarShakir/serverpilot/apps/api/middleware"
	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
)

// AuthHandler defines router entrypoints for registration, logins, logouts, and token refreshes.
type AuthHandler struct {
	authService *services.AuthService
	isProd      bool
}

// NewAuthHandler returns a new instance of AuthHandler.
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		isProd:      os.Getenv("ENV") == "production",
	}
}

// Register handles user registration request.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var input models.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Invalid request body", http.StatusBadRequest))
		return
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	if input.Email == "" || input.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Email and password are required", http.StatusBadRequest))
		return
	}

	if len(input.Password) < 6 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Password must be at least 6 characters long", http.StatusBadRequest))
		return
	}

	user, accessToken, refreshToken, err := h.authService.Register(r.Context(), input.Email, input.Password)
	if err != nil {
		if errors.Is(err, services.ErrUserAlreadyExists) {
			w.WriteHeader(http.StatusConflict)
			_ = json.NewEncoder(w).Encode(models.ErrorResponse("User with this email already exists", http.StatusConflict))
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Could not register user", http.StatusInternalServerError))
		return
	}

	h.setRefreshTokenCookie(w, refreshToken)

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]interface{}{
		"access_token": accessToken,
		"user":         user,
	}))
}

// Login verifies user credentials.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var input models.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Invalid request body", http.StatusBadRequest))
		return
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	if input.Email == "" || input.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Email and password are required", http.StatusBadRequest))
		return
	}

	user, accessToken, refreshToken, err := h.authService.Login(r.Context(), input.Email, input.Password)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(models.ErrorResponse("Invalid email or password", http.StatusUnauthorized))
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Could not process login", http.StatusInternalServerError))
		return
	}

	h.setRefreshTokenCookie(w, refreshToken)

	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]interface{}{
		"access_token": accessToken,
		"user":         user,
	}))
}

// Logout deletes active refresh tokens.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("refresh_token")
	var token string
	if err == nil {
		token = cookie.Value
	}

	if err := h.authService.Logout(r.Context(), token); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Could not complete logout", http.StatusInternalServerError))
		return
	}

	h.setRefreshTokenCookie(w, "") // Clear cookie

	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]string{
		"message": "Logged out successfully",
	}))
}

// Refresh generates a new access token.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Unauthorized: Missing refresh token", http.StatusUnauthorized))
		return
	}

	newAccessToken, err := h.authService.Refresh(r.Context(), cookie.Value)
	if err != nil {
		if errors.Is(err, services.ErrInvalidToken) {
			h.setRefreshTokenCookie(w, "") // Clear invalid cookie
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(models.ErrorResponse("Unauthorized: Invalid or expired refresh token", http.StatusUnauthorized))
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Could not refresh token", http.StatusInternalServerError))
		return
	}

	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]string{
		"access_token": newAccessToken,
	}))
}

// Me returns credentials details of the current authenticated user session.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	user := middleware.GetUser(r.Context())
	if user == nil {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(models.ErrorResponse("Unauthorized", http.StatusUnauthorized))
		return
	}

	_ = json.NewEncoder(w).Encode(models.SuccessResponse(map[string]interface{}{
		"user": map[string]string{
			"id":    user.ID,
			"email": user.Email,
		},
	}))
}

func (h *AuthHandler) setRefreshTokenCookie(w http.ResponseWriter, token string) {
	var maxAge int
	if token == "" {
		maxAge = -1 // expire immediately
	} else {
		maxAge = 7 * 24 * 60 * 60 // 7 days
	}

	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   h.isProd,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}
