package middleware

import (
	"net/http"

	"github.com/ShaharyarShakir/serverpilot/apps/api/responses"
)

// BodyLimit restricts the maximum size of incoming request bodies.
func BodyLimit(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.ContentLength > maxBytes {
				responses.BadRequest(w, "Request payload too large")
				return
			}
			// Wrap body reader to enforce limit during read
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}
