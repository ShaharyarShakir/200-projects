package repository

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/database"
	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	_ "github.com/lib/pq"
)

func setupTestDB(t *testing.T) (*sql.DB, func()) {
	testDBURL := os.Getenv("TEST_DB_URL")
	if testDBURL == "" {
		testDBURL = "postgres://postgres:postgres@localhost:5433/serverpilot?sslmode=disable"
	}

	db, err := sql.Open("postgres", testDBURL)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	// Run migrations
	err = database.RunMigrations(db)
	if err != nil {
		db.Close()
		t.Fatalf("failed to run migrations: %v", err)
	}

	// Truncate tables cascade to ensure a clean start
	_, err = db.Exec("TRUNCATE TABLE users, refresh_tokens, servers, monitoring_snapshots, activities, notifications CASCADE")
	if err != nil {
		db.Close()
		t.Fatalf("failed to truncate tables: %v", err)
	}

	cleanup := func() {
		_, _ = db.Exec("TRUNCATE TABLE users, refresh_tokens, servers, monitoring_snapshots, activities, notifications CASCADE")
		db.Close()
	}

	return db, cleanup
}

func TestSQLUserRepository(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	ctx := context.Background()

	now := time.Now().Truncate(time.Second) // SQLite does not always store microsecond precision depending on formatting
	user := &models.User{
		ID:           "usr_1",
		Email:        "repo@example.com",
		PasswordHash: "hashed_pass_123",
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// 1. Create User
	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// 2. Get By ID
	fetched, err := repo.GetByID(ctx, "usr_1")
	if err != nil {
		t.Fatalf("failed to get user by ID: %v", err)
	}
	if fetched == nil {
		t.Fatal("user not found by ID")
	}
	if fetched.Email != user.Email {
		t.Errorf("expected email %q, got %q", user.Email, fetched.Email)
	}
	if fetched.PasswordHash != user.PasswordHash {
		t.Errorf("expected hash %q, got %q", user.PasswordHash, fetched.PasswordHash)
	}

	// 3. Get By Email
	fetchedEmail, err := repo.GetByEmail(ctx, "repo@example.com")
	if err != nil {
		t.Fatalf("failed to get user by Email: %v", err)
	}
	if fetchedEmail == nil {
		t.Fatal("user not found by Email")
	}
	if fetchedEmail.ID != user.ID {
		t.Errorf("expected ID %q, got %q", user.ID, fetchedEmail.ID)
	}

	// 4. Get Non-existent
	fetchedNone, err := repo.GetByID(ctx, "nonexistent")
	if err != nil {
		t.Fatalf("error fetching nonexistent user: %v", err)
	}
	if fetchedNone != nil {
		t.Errorf("expected nil for nonexistent user, got %v", fetchedNone)
	}
}

func TestSQLTokenRepository(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	repo := NewTokenRepository(db)
	ctx := context.Background()

	userID := "usr_1"
	tokenVal := "my_refresh_token_string"
	tokenID := "tok_1"
	expiry := time.Now().Add(1 * time.Hour).Truncate(time.Second)

	// Create a dummy user first due to foreign key constraint
	userRepo := NewUserRepository(db)
	_ = userRepo.Create(ctx, &models.User{
		ID:           userID,
		Email:        "token@example.com",
		PasswordHash: "hash",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	})

	// 1. Create Token
	err := repo.Create(ctx, tokenID, userID, tokenVal, expiry)
	if err != nil {
		t.Fatalf("failed to create refresh token: %v", err)
	}

	// 2. Get Token
	fUserID, fTokenID, fExpiry, err := repo.GetByToken(ctx, tokenVal)
	if err != nil {
		t.Fatalf("failed to get token: %v", err)
	}
	if fUserID != userID {
		t.Errorf("expected userID %q, got %q", userID, fUserID)
	}
	if fTokenID != tokenID {
		t.Errorf("expected tokenID %q, got %q", tokenID, fTokenID)
	}
	// Check expiry (give 2 seconds allowance for conversion jitter)
	if fExpiry.Sub(expiry).Abs() > 2*time.Second {
		t.Errorf("expected expiry close to %v, got %v", expiry, fExpiry)
	}

	// 3. Delete Token
	err = repo.DeleteByToken(ctx, tokenVal)
	if err != nil {
		t.Fatalf("failed to delete token: %v", err)
	}

	// 4. Verify Deleted
	fUserIDDeleted, _, _, err := repo.GetByToken(ctx, tokenVal)
	if err != nil {
		t.Fatalf("failed to query deleted token: %v", err)
	}
	if fUserIDDeleted != "" {
		t.Error("expected empty user ID for deleted token")
	}
}
