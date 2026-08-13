package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS_PreflightAndOrigins(t *testing.T) {
	allowedOrigins := []string{"http://localhost:3000", "http://localhost:5173"}
	middleware := CORS(allowedOrigins)

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	handler := middleware(nextHandler)

	t.Run("Preflight OPTIONS request from allowed origin", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/courses", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		req.Header.Set("Access-Control-Request-Method", "POST")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Errorf("expected status 204 No Content, got %d", rec.Code)
		}

		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
			t.Errorf("expected Access-Control-Allow-Origin 'http://localhost:3000', got '%s'", got)
		}

		if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
			t.Errorf("expected Access-Control-Allow-Credentials 'true', got '%s'", got)
		}
	})

	t.Run("GET request from disallowed origin", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/courses", nil)
		req.Header.Set("Origin", "http://malicious-site.com")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", rec.Code)
		}

		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
			t.Errorf("expected empty Access-Control-Allow-Origin for disallowed origin, got '%s'", got)
		}
	})

	t.Run("GET request with no origin", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", rec.Code)
		}

		if got := rec.Body.String(); got != "OK" {
			t.Errorf("expected body 'OK', got '%s'", got)
		}
	})
}
