package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Server ServerConfig
	Postgres PostgresConfig
	Redis RedisConfig
	S3 S3Config
}

type ServerConfig struct {
	Port           string
	AllowedOrigins []string
}

type PostgresConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
}

func (p PostgresConfig) ConnString() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		p.User, p.Password, p.Host, p.Port, p.Database,
	)
}

type RedisConfig struct {
	URL string
}

type S3Config struct {
	Endpoint        string
	Region          string
	AccessKeyID     string
	SecretAccessKey string
}

func Load() Config {
	return Config{
		Server: ServerConfig{
			Port:           getEnv("PORT", "8080"),
			AllowedOrigins: parseCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173")),
		},

		Postgres: PostgresConfig{
			Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     getEnv("POSTGRES_PORT", "5432"),
			User:     getEnv("POSTGRES_USER", "academy"),
			Password: getEnv("POSTGRES_PASSWORD", "academy_dev"),
			Database: getEnv("POSTGRES_DB", "academy_os"),
		},

		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", "redis://localhost:6379"),
		},

		S3: S3Config{
			Endpoint:        getEnv("S3_ENDPOINT", "http://localhost:3900"),
			Region:          getEnv("S3_REGION", "garage"),
			AccessKeyID:     getEnv("S3_ACCESS_KEY_ID", getEnv("S3_ACCESS_KEY", "")),
			SecretAccessKey: getEnv("S3_SECRET_ACCESS_KEY", getEnv("S3_SECRET_KEY", "")),
		},
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)

	if value == "" {
		return fallback
	}

	return value
}

func parseCSV(s string) []string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}