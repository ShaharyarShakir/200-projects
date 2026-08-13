package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/ShaharyarShakir/academy-os/internal/auth"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
)

type AuthHandler struct {
	users        *database.UserRepository
	sessions     *database.SessionRepository
	academies    *database.AcademyRepository
	authService  *auth.Service
	cookieSecure bool
}

func NewAuthHandler(
	users *database.UserRepository,
	sessions *database.SessionRepository,
	academies *database.AcademyRepository,
) *AuthHandler {
	return &AuthHandler{
		users:        users,
		sessions:     sessions,
		academies:    academies,
		authService:  auth.NewService(users, sessions),
		cookieSecure: false,
	}
}

func (h *AuthHandler) SetCookieSecure(secure bool) {
	h.cookieSecure = secure
}

type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

func (h *AuthHandler) getSessionToken(r *http.Request) string {
	if cookie, err := r.Cookie("academyos_session"); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	if cookie, err := r.Cookie("session_id"); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	if cookie, err := r.Cookie("session"); err == nil && cookie.Value != "" {
		return cookie.Value
	}

	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	if xSession := r.Header.Get("X-Session-ID"); xSession != "" {
		return xSession
	}

	return ""
}

func (h *AuthHandler) setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "academyos_session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(auth.SessionLifetime.Seconds()),
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(auth.SessionLifetime.Seconds()),
	})
}

func (h *AuthHandler) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "academyos_session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, token, err := h.authService.Signup(
		r.Context(),
		req.Email,
		req.Password,
		req.Name,
	)

	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			writeJSONError(w, http.StatusConflict, err.Error())
			return
		}
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.setSessionCookie(w, token)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"user": map[string]any{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
		"academy": nil,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, token, err := h.authService.Login(
		r.Context(),
		req.Email,
		req.Password,
	)

	if errors.Is(err, auth.ErrInvalidCredentials) {
		writeJSONError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	h.setSessionCookie(w, token)

	var academyAny any = nil
	if user.Role == auth.RoleInstructor {
		if acad, err := h.academies.FindByOwnerID(r.Context(), user.ID); err == nil {
			academyAny = acad
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"user": map[string]any{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
		"academy": academyAny,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token := h.getSessionToken(r)

	_ = h.authService.Logout(r.Context(), token)

	h.clearSessionCookie(w)

	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserRecordFromContext(r.Context())
	if !ok {
		token := h.getSessionToken(r)
		var err error
		user, err = h.authService.Authenticate(r.Context(), token)
		if err != nil {
			writeJSONError(w, http.StatusUnauthorized, "unauthenticated")
			return
		}
	}

	var academyAny any = nil
	if user.Role == auth.RoleInstructor {
		if acad, err := h.academies.FindByOwnerID(r.Context(), user.ID); err == nil {
			academyAny = acad
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"user": map[string]any{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
		"academy": academyAny,
	})
}
