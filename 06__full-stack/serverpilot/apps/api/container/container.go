// Package container defines the Dependency Injection (DI) application container.
package container

import (
	"database/sql"
	"fmt"

	"github.com/ShaharyarShakir/serverpilot/apps/api/config"
	"github.com/ShaharyarShakir/serverpilot/apps/api/database"
	"github.com/ShaharyarShakir/serverpilot/apps/api/handlers"
	"github.com/ShaharyarShakir/serverpilot/apps/api/logging"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository"
	"github.com/ShaharyarShakir/serverpilot/apps/api/services"
)

// Container manages application dependencies and wiring.
type Container struct {
	Config           *config.Config
	DB               *sql.DB
	Logger           *logging.Logger
	UserRepo         repository.UserRepository
	TokenRepo        repository.TokenRepository
	AuthService      *services.AuthService
	DashboardService *services.DashboardService
	AuthHandler      *handlers.AuthHandler
	DashboardHandler *handlers.DashboardHandler
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
		db.Close()
		return nil, fmt.Errorf("database migration failed: %w", err)
	}

	// Repositories
	userRepo := repository.NewUserRepository(db)
	tokenRepo := repository.NewTokenRepository(db)

	// Services
	authService := services.NewAuthService(userRepo, tokenRepo, cfg.JWTAccessSecret, cfg.JWTRefreshSecret)
	dashboardService := services.NewDashboardService()

	// Handlers
	authHandler := handlers.NewAuthHandler(authService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)

	return &Container{
		Config:           cfg,
		DB:               db,
		Logger:           logger,
		UserRepo:         userRepo,
		TokenRepo:        tokenRepo,
		AuthService:      authService,
		DashboardService: dashboardService,
		AuthHandler:      authHandler,
		DashboardHandler: dashboardHandler,
	}, nil
}

// Close closes any resources owned by the container (e.g. database pool).
func (c *Container) Close() error {
	if c.DB != nil {
		return c.DB.Close()
	}
	return nil
}
