package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

func Connect() (*sql.DB, error) {
	dbURL := os.Getenv("TURSO_DATABASE_URL")
	authToken := os.Getenv("TURSO_AUTH_TOKEN")

	dsn := fmt.Sprintf(
		"%s?authToken=%s",
		dbURL,
		authToken,
	)

	db, err := sql.Open("libsql", dsn)
	if err != nil {
		return nil, err
	}

	return db, nil
}
