package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	DBURL            string
	DBAuthToken      string
	JWTAccessSecret  string
	JWTRefreshSecret string
	AllowedOrigin    string
	Env              string
}

func LoadConfig() *Config {
	// Load .env file if it exists, otherwise fall back to environment variables.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment variables")
	}

	port := getEnv("PORT", "8080")
	dbURL := getEnv("DB_URL", "file:serverpilot.db")
	dbAuthToken := getEnv("DB_AUTH_TOKEN", "")
	jwtAccessSecret := getEnv("JWT_ACCESS_SECRET", "default_access_secret_key_12345!")
	jwtRefreshSecret := getEnv("JWT_REFRESH_SECRET", "default_refresh_secret_key_98765!")
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "http://localhost:5173")
	env := getEnv("ENV", "development")

	return &Config{
		Port:             port,
		DBURL:            dbURL,
		DBAuthToken:      dbAuthToken,
		JWTAccessSecret:  jwtAccessSecret,
		JWTRefreshSecret: jwtRefreshSecret,
		AllowedOrigin:    allowedOrigin,
		Env:              env,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
