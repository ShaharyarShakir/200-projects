package middleware

import (
	"net/http"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/logging"
)

type responseWriter struct {
	http.ResponseWriter
	status  int
	written int64
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if rw.status == 0 {
		rw.status = http.StatusOK
	}
	n, err := rw.ResponseWriter.Write(b)
	rw.written += int64(n)
	return n, err
}

// Logger returns a middleware that logs detailed HTTP request info using the structured logger.
func Logger(logger *logging.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			reqID := GetRequestID(r.Context())

			rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rw, r)

			// Log the completed request using the structured logger
			logger.Request(
				reqID,
				r.Method,
				r.URL.Path,
				rw.status,
				time.Since(start),
				rw.written,
				r.RemoteAddr,
			)
		})
	}
}
