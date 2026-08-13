package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/auth"
	"github.com/ShaharyarShakir/academy-os/internal/database"
)

type userContextKey string

const (
	userContextKeyValue       userContextKey = "userContext"
	userRecordContextKeyValue userContextKey = "userRecordContext"
)

func WithUserIDContext(
	ctx context.Context,
	userID uuid.UUID,
) context.Context {
	return context.WithValue(
		ctx,
		userContextKeyValue,
		userID,
	)
}

func UserIDFromContext(
	ctx context.Context,
) (uuid.UUID, bool) {
	value := ctx.Value(userContextKeyValue)
	userID, ok := value.(uuid.UUID)
	return userID, ok
}

func WithUserRecordContext(
	ctx context.Context,
	user database.UserRecord,
) context.Context {
	ctx = context.WithValue(ctx, userContextKeyValue, user.ID)
	return context.WithValue(ctx, userRecordContextKeyValue, user)
}

func UserRecordFromContext(
	ctx context.Context,
) (database.UserRecord, bool) {
	value := ctx.Value(userRecordContextKeyValue)
	user, ok := value.(database.UserRecord)
	return user, ok
}

func WithAuth(
	sessions *database.SessionRepository,
	users *database.UserRepository,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				var tokenStr string

				// 1. Check cookies (academyos_session, session_id, or session)
				if cookie, err := r.Cookie("academyos_session"); err == nil && cookie.Value != "" {
					tokenStr = cookie.Value
				} else if cookie, err := r.Cookie("session_id"); err == nil && cookie.Value != "" {
					tokenStr = cookie.Value
				} else if cookie, err := r.Cookie("session"); err == nil && cookie.Value != "" {
					tokenStr = cookie.Value
				}

				// 2. Check Authorization or X-Session-ID header
				if tokenStr == "" {
					authHeader := r.Header.Get("Authorization")
					if strings.HasPrefix(authHeader, "Bearer ") {
						tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
					} else if xSession := r.Header.Get("X-Session-ID"); xSession != "" {
						tokenStr = xSession
					}
				}

				if tokenStr == "" {
					http.Error(
						w,
						"unauthorized",
						http.StatusUnauthorized,
					)
					return
				}

				var session database.Session
				var err error

				if sessionID, parseErr := uuid.Parse(tokenStr); parseErr == nil {
					session, err = sessions.Find(r.Context(), sessionID)
				}
				if err != nil || session.ID == uuid.Nil {
					tokenHash := auth.HashSessionToken(tokenStr)
					session, err = sessions.FindByTokenHash(r.Context(), tokenHash)
				}

				if err != nil {
					http.Error(
						w,
						"unauthorized",
						http.StatusUnauthorized,
					)
					return
				}

				if session.ExpiresAt.Before(time.Now()) {
					http.Error(
						w,
						"session expired",
						http.StatusUnauthorized,
					)
					return
				}

				userRecord, err := users.FindByID(r.Context(), session.UserID)
				if err != nil {
					http.Error(
						w,
						"unauthorized",
						http.StatusUnauthorized,
					)
					return
				}

				ctx := WithUserRecordContext(r.Context(), userRecord)
				next.ServeHTTP(w, r.WithContext(ctx))
			},
		)
	}
}
