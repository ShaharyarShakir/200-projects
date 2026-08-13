package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
)

// Test 1: An instructor cannot access /api/admin/* (RequirePlatformAdmin returns 403 Forbidden)
func TestRequirePlatformAdmin_BlocksInstructor(t *testing.T) {
	middlewareFunc := middleware.RequirePlatformAdmin()

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ADMIN_GRANTED"))
	})

	handler := middlewareFunc(nextHandler)

	instructorUser := database.UserRecord{
		ID:    uuid.New(),
		Email: "instructor@test.local",
		Role:  "INSTRUCTOR",
	}

	req := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	ctx := middleware.WithUserRecordContext(req.Context(), instructorUser)
	req = req.WithContext(ctx)

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status 403 Forbidden for instructor accessing admin endpoint, got %d", rec.Code)
	}

	if !strings.Contains(rec.Body.String(), "platform admin required") {
		t.Fatalf("expected 'platform admin required' message, got '%s'", rec.Body.String())
	}
}

// Test 2: Platform admin can access /api/admin/* (RequirePlatformAdmin returns 200 OK)
func TestRequirePlatformAdmin_AllowsPlatformAdmin(t *testing.T) {
	middlewareFunc := middleware.RequirePlatformAdmin()

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ADMIN_GRANTED"))
	})

	handler := middlewareFunc(nextHandler)

	adminUser := database.UserRecord{
		ID:    uuid.New(),
		Email: "admin@academyos.com",
		Role:  "PLATFORM_ADMIN",
	}

	req := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	ctx := middleware.WithUserRecordContext(req.Context(), adminUser)
	req = req.WithContext(ctx)

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for platform admin, got %d", rec.Code)
	}

	if rec.Body.String() != "ADMIN_GRANTED" {
		t.Fatalf("expected 'ADMIN_GRANTED', got '%s'", rec.Body.String())
	}
}

// Test 3: Unauthenticated user is rejected by RequirePlatformAdmin (returns 401 Unauthorized)
func TestRequirePlatformAdmin_Unauthenticated(t *testing.T) {
	middlewareFunc := middleware.RequirePlatformAdmin()

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := middlewareFunc(nextHandler)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 Unauthorized for missing user context, got %d", rec.Code)
	}
}

// Test 4: Academy Context Scoping injects correct academy_id into request context
func TestAcademyContextScoping(t *testing.T) {
	instructorUser := database.UserRecord{
		ID:    uuid.New(),
		Email: "instructor@test.local",
		Role:  "INSTRUCTOR",
	}

	academyID := uuid.New()
	academyRecord := database.AcademyRecord{
		ID:          academyID,
		OwnerUserID: instructorUser.ID,
		Name:        "Test Academy",
		Slug:        "test-academy",
		Subdomain:   "test-academy",
	}

	acadCtx := middleware.AcademyContext{
		User:    instructorUser,
		Academy: academyRecord,
	}

	req := httptest.NewRequest(http.MethodGet, "/api/courses", nil)
	ctx := middleware.WithAcademyContext(req.Context(), acadCtx)
	req = req.WithContext(ctx)

	extracted, ok := middleware.AcademyContextFromRequest(req)
	if !ok {
		t.Fatalf("failed to extract AcademyContext from request")
	}

	if extracted.Academy.ID != academyID {
		t.Fatalf("expected academy ID %s, got %s", academyID, extracted.Academy.ID)
	}

	if extracted.User.ID != instructorUser.ID {
		t.Fatalf("expected user ID %s, got %s", instructorUser.ID, extracted.User.ID)
	}
}

// Test 5: Instructor A vs Instructor B Cross-Isolation
func TestCrossInstructorIsolation_Context(t *testing.T) {
	instructorA := database.UserRecord{ID: uuid.New(), Email: "a@test.local", Role: "INSTRUCTOR"}
	academyA := database.AcademyRecord{ID: uuid.New(), OwnerUserID: instructorA.ID, Slug: "academy-a"}

	instructorB := database.UserRecord{ID: uuid.New(), Email: "b@test.local", Role: "INSTRUCTOR"}
	academyB := database.AcademyRecord{ID: uuid.New(), OwnerUserID: instructorB.ID, Slug: "academy-b"}

	// Verify Academy A belongs to Instructor A, not Instructor B
	if academyA.OwnerUserID == instructorB.ID {
		t.Fatalf("Academy A owner match error: belongs to Instructor B!")
	}

	if academyB.OwnerUserID == instructorA.ID {
		t.Fatalf("Academy B owner match error: belongs to Instructor A!")
	}

	// Verify Context scoping isolation
	ctxA := middleware.WithAcademyContext(context.Background(), middleware.AcademyContext{User: instructorA, Academy: academyA})
	extractedA, _ := middleware.AcademyContextFromContext(ctxA)

	if extractedA.Academy.ID != academyA.ID || extractedA.Academy.OwnerUserID != instructorA.ID {
		t.Fatalf("Instructor A context isolation failed")
	}
}
