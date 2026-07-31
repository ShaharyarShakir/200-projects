package database

import (
	"database/sql"
	"fmt"
	"strings"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
	_ "modernc.org/sqlite"
)

// Connect opens a connection to SQLite/Turso database.
func Connect(dbURL, authToken string) (*sql.DB, error) {
	connStr := dbURL
	if authToken != "" {
		// Append token if remote connection and token is not already present.
		if strings.HasPrefix(dbURL, "libsql://") || strings.HasPrefix(dbURL, "http://") || strings.HasPrefix(dbURL, "https://") {
			if !strings.Contains(dbURL, "authToken=") {
				if strings.Contains(dbURL, "?") {
					connStr = fmt.Sprintf("%s&authToken=%s", dbURL, authToken)
				} else {
					connStr = fmt.Sprintf("%s?authToken=%s", dbURL, authToken)
				}
			}
		}
	}

	db, err := sql.Open("libsql", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
