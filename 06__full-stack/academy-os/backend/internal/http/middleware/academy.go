package middleware

import (
	"context"
	"net/http"

	"github.com/ShaharyarShakir/academy-os/internal/database"
)

type AcademyContext struct {
	User    database.UserRecord
	Academy database.AcademyRecord
}

type academyContextKey string

const academyContextKeyValue academyContextKey = "academyContext"

func WithAcademyContext(
	ctx context.Context,
	acadCtx AcademyContext,
) context.Context {
	return context.WithValue(ctx, academyContextKeyValue, acadCtx)
}

func AcademyContextFromRequest(
	r *http.Request,
) (AcademyContext, bool) {
	val := r.Context().Value(academyContextKeyValue)
	acadCtx, ok := val.(AcademyContext)
	return acadCtx, ok
}

func AcademyContextFromContext(
	ctx context.Context,
) (AcademyContext, bool) {
	val := ctx.Value(academyContextKeyValue)
	acadCtx, ok := val.(AcademyContext)
	return acadCtx, ok
}

func WithInstructorAcademy(
	academies *database.AcademyRepository,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				user, ok := UserRecordFromContext(r.Context())
				if !ok {
					http.Error(w, "unauthorized", http.StatusUnauthorized)
					return
				}

				academy, err := academies.FindByOwnerID(r.Context(), user.ID)
				if err != nil {
					http.Error(w, "academy not found for instructor", http.StatusNotFound)
					return
				}

				acadCtx := AcademyContext{
					User:    user,
					Academy: academy,
				}

				ctx := WithAcademyContext(r.Context(), acadCtx)
				next.ServeHTTP(w, r.WithContext(ctx))
			},
		)
	}
}

func RequirePlatformAdmin() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				user, ok := UserRecordFromContext(r.Context())
				if !ok {
					http.Error(w, "unauthorized", http.StatusUnauthorized)
					return
				}

				if user.Role != "PLATFORM_ADMIN" {
					http.Error(w, "forbidden: platform admin required", http.StatusForbidden)
					return
				}

				next.ServeHTTP(w, r)
			},
		)
	}
}
