package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ShaharyarShakir/serverpilot/apps/api/auth"
	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
)

type userContextKeyType string

// UserContextKey defines the key for storing user claims in the request context.
const UserContextKey userContextKeyType = "user"

// UserClaims holds user ID and email fetched from verified JWT tokens.
type UserClaims struct {
	ID    string
	Email string
}

// Auth parses access tokens from the request headers and sets UserClaims on the context if valid.
func Auth(jwtAccessSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				next.ServeHTTP(w, r)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				next.ServeHTTP(w, r)
				return
			}

			tokenStr := parts[1]
			claims, err := auth.ParseAccessToken(tokenStr, jwtAccessSecret)
			if err != nil {
				// Don't set user context, request continues (Authenticate middleware blocks if needed)
				next.ServeHTTP(w, r)
				return
			}

			userClaims := &UserClaims{
				ID:    claims.UserID,
				Email: claims.Email,
			}

			ctx := context.WithValue(r.Context(), UserContextKey, userClaims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Authenticate protects endpoints by returning 401 JSON responses for unauthenticated requests.
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := GetUser(r.Context())
		if user == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			resp := models.ErrorResponse("Unauthorized: Missing or invalid token", http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(resp)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// GetUser retrieves the UserClaims from the context, returning nil if not authenticated.
func GetUser(ctx context.Context) *UserClaims {
	if user, ok := ctx.Value(UserContextKey).(*UserClaims); ok {
		return user
	}
	return nil
}
