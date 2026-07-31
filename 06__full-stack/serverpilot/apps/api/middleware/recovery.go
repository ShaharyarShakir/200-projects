package middleware

import (
	"fmt"
	"net/http"
	"runtime/debug"

	"github.com/ShaharyarShakir/serverpilot/apps/api/logging"
	"github.com/ShaharyarShakir/serverpilot/apps/api/responses"
)

// Recovery recovers from panics and logs critical diagnostics using the structured logger.
func Recovery(logger *logging.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					reqID := GetRequestID(r.Context())
					stack := string(debug.Stack())

					logger.Error("panic recovered", map[string]any{
						"request_id": reqID,
						"error":      fmt.Sprintf("%v", err),
						"stack":      stack,
					})

					responses.Error(
						w,
						http.StatusInternalServerError,
						"An internal server error occurred",
						"INTERNAL_ERROR",
					)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
