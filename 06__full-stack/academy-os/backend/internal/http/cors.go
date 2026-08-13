package httpapi

import (
	"net/http"
	"strings"
)

// CORS returns an HTTP middleware that handles Cross-Origin Resource Sharing.
// It dynamically validates requested origins, supports credentials, handles preflight OPTIONS,
// and sets standard CORS security headers.
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			if origin != "" {
				if isOriginAllowed(origin, allowedOrigins) {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Vary", "Origin")
					w.Header().Set("Access-Control-Allow-Credentials", "true")
				}
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, X-Tenant-ID, X-Requested-With")
			w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Disposition")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func isOriginAllowed(origin string, allowedOrigins []string) bool {
	if len(allowedOrigins) == 0 {
		return true
	}
	for _, allowed := range allowedOrigins {
		if allowed == "*" || strings.EqualFold(allowed, origin) {
			return true
		}
		if strings.HasPrefix(allowed, "*.") {
			domainSuffix := allowed[1:]
			if strings.Contains(origin, domainSuffix) {
				return true
			}
		}
	}
	if strings.Contains(origin, ".academyos.local") || strings.Contains(origin, ".localhost") {
		return true
	}
	return false
}
