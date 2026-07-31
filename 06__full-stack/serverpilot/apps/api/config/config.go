// Package config loads and validates the application configuration from environment variables.
package config

import (
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds the application configuration.
type Config struct {
	Port             string
	DBURL            string
	DBAuthToken      string
	JWTAccessSecret  string
	JWTRefreshSecret string
	AllowedOrigin    string
	Env              string
}

// LoadConfig loads the configuration from .env and system environment.
// It performs startup validation and returns an error if the config is invalid.
func LoadConfig() (*Config, error) {
	// Attempt to load .env file; ignore error if it doesn't exist
	_ = godotenv.Load()

	cfg := &Config{
		Port:             getEnv("PORT", "8080"),
		DBURL:            os.Getenv("DB_URL"),
		DBAuthToken:      os.Getenv("DB_AUTH_TOKEN"),
		JWTAccessSecret:  os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret: os.Getenv("JWT_REFRESH_SECRET"),
		AllowedOrigin:    getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		Env:              getEnv("ENV", "development"),
	}

	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return cfg, nil
}

// Validate checks the configuration for required variables and safety limits.
func (c *Config) Validate() error {
	if c.DBURL == "" {
		return errors.New("DB_URL environment variable is required")
	}

	if c.JWTAccessSecret == "" {
		return errors.New("JWT_ACCESS_SECRET environment variable is required")
	}
	if len(c.JWTAccessSecret) < 16 {
		return fmt.Errorf("JWT_ACCESS_SECRET is too short (must be at least 16 characters for production security)")
	}

	if c.JWTRefreshSecret == "" {
		return errors.New("JWT_REFRESH_SECRET environment variable is required")
	}
	if len(c.JWTRefreshSecret) < 16 {
		return fmt.Errorf("JWT_REFRESH_SECRET is too short (must be at least 16 characters for production security)")
	}

	validEnvs := map[string]bool{"development": true, "production": true, "test": true}
	c.Env = strings.ToLower(c.Env)
	if !validEnvs[c.Env] {
		return fmt.Errorf("ENV must be one of: development, production, test")
	}

	return nil
}

// IsProduction returns true if the application is running in production.
func (c *Config) IsProduction() bool {
	return c.Env == "production"
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
