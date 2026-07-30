package middleware

import (
	"encoding/json"
	"log"
	"net/http"
	"runtime/debug"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
)

// Recovery catches panics, prints a debug stack trace, and sends a standard 500 JSON response.
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				reqID := GetRequestID(r.Context())
				log.Printf("[%s] CRITICAL PANIC RECOVERED: %v\n%s", reqID, err, debug.Stack())

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)

				resp := models.ErrorResponse("An internal server error occurred", http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(resp)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
