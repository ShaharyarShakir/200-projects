package services

import (
	"context"
	"database/sql"
	"os"
	"testing"

	"github.com/ShaharyarShakir/serverpilot/apps/api/database"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/ShaharyarShakir/serverpilot/apps/api/ssh"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

func setupServiceTestDB(t *testing.T) (*sql.DB, func()) {
	dbPath := "test_services.db"
	_ = os.Remove(dbPath)

	db, err := sql.Open("libsql", "file:"+dbPath)
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = database.RunMigrations(db)
	if err != nil {
		db.Close()
		os.Remove(dbPath)
		t.Fatalf("failed to run migrations: %v", err)
	}

	cleanup := func() {
		db.Close()
		_ = os.Remove(dbPath)
	}

	return db, cleanup
}

func TestAuthService(t *testing.T) {
	db, cleanup := setupServiceTestDB(t)
	defer cleanup()

	userRepo := repository.NewUserRepository(db)
	tokenRepo := repository.NewTokenRepository(db)
	accessSecret := "my_access_secret_key_12345!"
	refreshSecret := "my_refresh_secret_key_54321!"

	svc := NewAuthService(userRepo, tokenRepo, accessSecret, refreshSecret)
	ctx := context.Background()

	email := "service@example.com"
	pass := "pass123456"

	// 1. Test Register
	userResp, accessToken, refreshToken, err := svc.Register(ctx, email, pass)
	if err != nil {
		t.Fatalf("failed to register user: %v", err)
	}
	if userResp.Email != email {
		t.Errorf("expected email %s, got %s", email, userResp.Email)
	}
	if accessToken == "" || refreshToken == "" {
		t.Error("tokens should not be empty")
	}

	// 2. Test Duplicate Register
	_, _, _, err = svc.Register(ctx, email, pass)
	if err == nil {
		t.Error("expected error for duplicate user registration, got nil")
	}

	// 3. Test Login Success
	loginResp, loginAccess, loginRefresh, err := svc.Login(ctx, email, pass)
	if err != nil {
		t.Fatalf("failed to login: %v", err)
	}
	if loginResp.Email != email {
		t.Errorf("expected email %s, got %s", email, loginResp.Email)
	}
	if loginAccess == "" || loginRefresh == "" {
		t.Error("login tokens should not be empty")
	}

	// 4. Test Login Incorrect Password
	_, _, _, err = svc.Login(ctx, email, "wrongpass")
	if err == nil {
		t.Error("expected login error with wrong password, got nil")
	}

	// 5. Test Refresh Token
	newAccess, err := svc.Refresh(ctx, loginRefresh)
	if err != nil {
		t.Fatalf("failed to refresh token: %v", err)
	}
	if newAccess == "" {
		t.Error("refreshed access token is empty")
	}

	// 6. Test Logout (Revocation)
	err = svc.Logout(ctx, loginRefresh)
	if err != nil {
		t.Fatalf("failed to logout: %v", err)
	}

	// 7. Verify Refresh Token is now invalid
	_, err = svc.Refresh(ctx, loginRefresh)
	if err == nil {
		t.Error("expected error refreshing with revoked token, got nil")
	}
}

func TestDashboardService(t *testing.T) {
	db, cleanup := setupServiceTestDB(t)
	defer cleanup()

	serverRepo := repository.NewServerRepository(db)
	metricsRepo := repository.NewMetricsRepository(db)
	activityRepo := repository.NewActivityRepository(db)
	sshPool := ssh.NewSSHConnectionPool()
	defer sshPool.Close()

	svc := NewDashboardService(serverRepo, metricsRepo, activityRepo, sshPool)

	// 1. Get Dashboard Stats
	stats := svc.GetDashboardStats()
	if stats.TotalServers != 2 {
		t.Errorf("expected 2 seeded servers, got %d", stats.TotalServers)
	}

	// 2. Filter Servers by Provider
	servers := svc.GetServers("", "", "AWS")
	if len(servers) != 1 {
		t.Errorf("expected 1 AWS server, got %d", len(servers))
	}

	// 3. Add Server
	ctx := context.Background()
	newSrv, err := svc.AddServer(ctx, "custom-node", "10.0.0.9", "Ubuntu", "DigitalOcean", "Paris", []string{"custom"}, 22, "root", "password", "pwd", "", "")
	if err != nil {
		t.Fatalf("failed to add server: %v", err)
	}
	if newSrv.Name != "custom-node" {
		t.Errorf("expected server name 'custom-node', got %q", newSrv.Name)
	}

	// Check updated stats
	stats = svc.GetDashboardStats()
	if stats.TotalServers != 3 {
		t.Errorf("expected 3 servers after addition, got %d", stats.TotalServers)
	}

	// 4. Power Action (Stop Server)
	err = svc.PowerAction([]string{newSrv.ID}, "stop")
	if err != nil {
		t.Fatalf("failed power action: %v", err)
	}

	// 5. Bulk Delete
	err = svc.BulkDelete([]string{newSrv.ID})
	if err != nil {
		t.Fatalf("failed bulk delete: %v", err)
	}

	stats = svc.GetDashboardStats()
	if stats.TotalServers != 2 {
		t.Errorf("expected 2 servers after deletion, got %d", stats.TotalServers)
	}
}

func setupBenchmarkDashboardService(b *testing.B) (*DashboardService, func()) {
	db, err := sql.Open("libsql", "file::memory:")
	if err != nil {
		b.Fatalf("failed to open in-memory DB: %v", err)
	}
	err = database.RunMigrations(db)
	if err != nil {
		db.Close()
		b.Fatalf("failed to run migrations: %v", err)
	}

	serverRepo := repository.NewServerRepository(db)
	metricsRepo := repository.NewMetricsRepository(db)
	activityRepo := repository.NewActivityRepository(db)
	sshPool := ssh.NewSSHConnectionPool()

	svc := NewDashboardService(serverRepo, metricsRepo, activityRepo, sshPool)
	cleanup := func() {
		sshPool.Close()
		db.Close()
	}
	return svc, cleanup
}

func BenchmarkGetDashboardStats(b *testing.B) {
	svc, cleanup := setupBenchmarkDashboardService(b)
	defer cleanup()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = svc.GetDashboardStats()
	}
}

func BenchmarkGetServersFiltered(b *testing.B) {
	svc, cleanup := setupBenchmarkDashboardService(b)
	defer cleanup()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = svc.GetServers("daemon", "offline", "")
	}
}
