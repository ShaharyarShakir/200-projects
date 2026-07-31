package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/ShaharyarShakir/serverpilot/apps/api/middleware"
	"github.com/ShaharyarShakir/serverpilot/apps/api/responses"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
	"github.com/ShaharyarShakir/serverpilot/apps/api/validation"
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
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		responses.BadRequest(w, "Invalid request body")
		return
	}

	// Validate inputs using centralized validation package
	input, err := validation.ValidateRegisterInput(body.Email, body.Password)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	user, accessToken, refreshToken, err := h.authService.Register(r.Context(), input.Email, input.Password)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	h.setRefreshTokenCookie(w, refreshToken)

	responses.Created(w, map[string]interface{}{
		"access_token": accessToken,
		"user":         user,
	})
}

// Login verifies user credentials.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		responses.BadRequest(w, "Invalid request body")
		return
	}

	// Validate inputs using centralized validation package
	input, err := validation.ValidateLoginInput(body.Email, body.Password)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	user, accessToken, refreshToken, err := h.authService.Login(r.Context(), input.Email, input.Password)
	if err != nil {
		responses.HandleError(w, err)
		return
	}

	h.setRefreshTokenCookie(w, refreshToken)

	responses.OK(w, map[string]interface{}{
		"access_token": accessToken,
		"user":         user,
	})
}

// Logout deletes active refresh tokens.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	var token string
	if err == nil {
		token = cookie.Value
	}

	if err := h.authService.Logout(r.Context(), token); err != nil {
		responses.HandleError(w, err)
		return
	}

	h.setRefreshTokenCookie(w, "") // Clear cookie

	responses.OK(w, map[string]string{
		"message": "Logged out successfully",
	})
}

// Refresh generates a new access token.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		responses.Unauthorized(w, "Unauthorized: Missing refresh token")
		return
	}

	newAccessToken, err := h.authService.Refresh(r.Context(), cookie.Value)
	if err != nil {
		h.setRefreshTokenCookie(w, "") // Clear invalid cookie on failure
		responses.HandleError(w, err)
		return
	}

	responses.OK(w, map[string]string{
		"access_token": newAccessToken,
	})
}

// Me returns credentials details of the current authenticated user session.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r.Context())
	if user == nil {
		responses.Unauthorized(w, "Unauthorized")
		return
	}

	responses.OK(w, map[string]interface{}{
		"user": map[string]string{
			"id":    user.ID,
			"email": user.Email,
		},
	})
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
