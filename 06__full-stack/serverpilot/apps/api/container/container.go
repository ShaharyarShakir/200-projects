// Package container defines the Dependency Injection (DI) application container.
package container

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/config"
	"github.com/ShaharyarShakir/serverpilot/apps/api/database"
	"github.com/ShaharyarShakir/serverpilot/apps/api/handlers"
	"github.com/ShaharyarShakir/serverpilot/apps/api/logging"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
	"github.com/ShaharyarShakir/serverpilot/apps/api/ssh"
)

// Container manages application dependencies and wiring.
type Container struct {
	Config            *config.Config
	DB                *sql.DB
	Logger            *logging.Logger
	UserRepo          repository.UserRepository
	TokenRepo         repository.TokenRepository
	ServerRepo        repository.ServerRepository
	MetricsRepo       repository.MetricsRepository
	ActivityRepo      repository.ActivityRepository
	SSHConnectionPool *ssh.SSHConnectionPool
	AuthService       *services.AuthService
	DashboardService  *services.DashboardService
	ServerService     *services.ServerService
	MonitoringService *services.MonitoringService
	AuthHandler       *handlers.AuthHandler
	DashboardHandler  *handlers.DashboardHandler
}

// NewContainer initializes and wires all application dependencies.
func NewContainer(cfg *config.Config, logger *logging.Logger) (*Container, error) {
	// Connect to database
	db, err := database.Connect(cfg.DBURL, cfg.DBAuthToken)
	if err != nil {
		return nil, fmt.Errorf("database connection failed: %w", err)
	}

	// Run migrations
	if err := database.RunMigrations(db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("database migration failed: %w", err)
	}

	// Repositories
	userRepo := repository.NewUserRepository(db)
	tokenRepo := repository.NewTokenRepository(db)
	serverRepo := repository.NewServerRepository(db)
	metricsRepo := repository.NewMetricsRepository(db)
	activityRepo := repository.NewActivityRepository(db)

	// SSH Pool
	sshPool := ssh.NewSSHConnectionPool()

	// Services
	authService := services.NewAuthService(userRepo, tokenRepo, cfg.JWTAccessSecret, cfg.JWTRefreshSecret)
	dashboardService := services.NewDashboardService(serverRepo, metricsRepo, activityRepo, sshPool)
	serverService := services.NewServerService(serverRepo, sshPool)
	monitoringService := services.NewMonitoringService(serverRepo, metricsRepo, activityRepo, sshPool, logger)

	// Handlers
	authHandler := handlers.NewAuthHandler(authService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService, serverService)

	// Start background metrics collection (interval: 15s)
	monitoringService.Start(15 * time.Second)

	return &Container{
		Config:            cfg,
		DB:                db,
		Logger:            logger,
		UserRepo:          userRepo,
		TokenRepo:         tokenRepo,
		ServerRepo:        serverRepo,
		MetricsRepo:       metricsRepo,
		ActivityRepo:      activityRepo,
		SSHConnectionPool: sshPool,
		AuthService:       authService,
		DashboardService:  dashboardService,
		ServerService:     serverService,
		MonitoringService: monitoringService,
		AuthHandler:       authHandler,
		DashboardHandler:  dashboardHandler,
	}, nil
}

// Close closes any resources owned by the container (e.g. database pool, monitoring tickers, SSH connections).
func (c *Container) Close() error {
	if c.MonitoringService != nil {
		c.MonitoringService.Stop()
	}
	if c.SSHConnectionPool != nil {
		c.SSHConnectionPool.Close()
	}
	if c.DB != nil {
		return c.DB.Close()
	}
	return nil
}
