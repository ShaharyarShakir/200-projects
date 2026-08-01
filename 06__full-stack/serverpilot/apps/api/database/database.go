package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

// Connect opens a connection to PostgreSQL database.
func Connect(dbURL, authToken string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
