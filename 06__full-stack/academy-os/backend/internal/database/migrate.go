package database

import (
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// RunMigrations runs pending migrations against target Postgres database URL.
func RunMigrations(databaseURL string, migrationsPath string) error {
	if migrationsPath == "" {
		migrationsPath = "migrations"
	}

	if _, err := os.Stat(migrationsPath); os.IsNotExist(err) {
		// Try parent path if running from cmd/api or subdirectories
		if _, err := os.Stat("../migrations"); err == nil {
			migrationsPath = "../migrations"
		}
	}

	sourceURL := fmt.Sprintf("file://%s", migrationsPath)

	m, err := migrate.New(sourceURL, databaseURL)
	if err != nil {
		return fmt.Errorf("failed to initialize migration instance: %w", err)
	}
	defer m.Close()

	version, dirty, vErr := m.Version()
	if vErr == nil && dirty {
		log.Printf("Detected dirty database migration state at version %d. Clearing dirty state to force version %d...", version, version-1)
		if fErr := m.Force(int(version - 1)); fErr != nil {
			return fmt.Errorf("failed to force clean migration state from version %d: %w", version, fErr)
		}
	}

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Println("Database schema is up to date")
			return nil
		}
		// If m.Up returns a dirty error on first attempt, attempt auto-healing force recovery
		var errDirty migrate.ErrDirty
		if errors.As(err, &errDirty) {
			log.Printf("Migration encountered dirty version %d. Auto-forcing version %d and retrying...", errDirty.Version, errDirty.Version-1)
			if fErr := m.Force(errDirty.Version - 1); fErr != nil {
				return fmt.Errorf("failed to auto-force migration version: %w", fErr)
			}
			if retryErr := m.Up(); retryErr != nil && !errors.Is(retryErr, migrate.ErrNoChange) {
				return fmt.Errorf("failed to apply migrations after force retry: %w", retryErr)
			}
			log.Println("Database migrations recovered and applied successfully after retry")
			return nil
		}
		return fmt.Errorf("failed to apply migrations: %w", err)
	}

	log.Println("Database migrations applied successfully")
	return nil
}
