package config

import (
	"os"
)

type Config struct {
	Server ServerConfig
	Postgres PostgresConfig
	Redis RedisConfig
	S3 S3Config
}

type ServerConfig struct {
	Port string
}

type PostgresConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
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
			Port: getEnv("PORT", "8080"),
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
			AccessKeyID:     getEnv("S3_ACCESS_KEY_ID", ""),
			SecretAccessKey: getEnv("S3_SECRET_ACCESS_KEY", ""),
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