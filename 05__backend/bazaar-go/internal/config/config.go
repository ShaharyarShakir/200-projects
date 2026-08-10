package config

import "os"

type Config struct {
	AppEnv string
	Port string

	Database DatabaseConfig

}
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func Load() Config {
	return Config {
		AppEnv: getEnv("AppEnv","development"),
		Port: getEnv("Port","8080"),

		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "bazaar"),
			Password: getEnv("DB_PASSWORD", "bazaar"),
			Name:     getEnv("DB_NAME", "bazaar"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
	}
}

func getEnv(key, fallback string) string {
	value, exists := os.LookupEnv(key)

	if !exists || value == "" {
		return fallback
	}

	return value
}