package database

import (
	"database/sql"
	"fmt"
	"log"
)

var migrations = []string{
	// 1. Create users table
	`CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`,

	// 2. Create refresh_tokens table
	`CREATE TABLE IF NOT EXISTS refresh_tokens (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		token TEXT UNIQUE NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);`,

	// 3. Create servers table
	`CREATE TABLE IF NOT EXISTS servers (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		ip TEXT NOT NULL,
		os TEXT,
		status TEXT NOT NULL DEFAULT 'offline',
		cpu_usage REAL DEFAULT 0,
		memory_usage REAL DEFAULT 0,
		memory_total REAL DEFAULT 0,
		disk_usage REAL DEFAULT 0,
		disk_total REAL DEFAULT 0,
		network_in REAL DEFAULT 0,
		network_out REAL DEFAULT 0,
		uptime INTEGER DEFAULT 0,
		location TEXT,
		provider TEXT,
		tags TEXT,
		ssh_port INTEGER NOT NULL DEFAULT 22,
		ssh_user TEXT NOT NULL DEFAULT 'root',
		ssh_auth_method TEXT NOT NULL DEFAULT 'password',
		ssh_password TEXT,
		ssh_private_key TEXT,
		ssh_passphrase TEXT,
		host_key TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`,

	// 4. Create monitoring_snapshots table
	`CREATE TABLE IF NOT EXISTS monitoring_snapshots (
		id TEXT PRIMARY KEY,
		server_id TEXT NOT NULL,
		cpu_usage REAL NOT NULL,
		memory_usage REAL NOT NULL,
		disk_usage REAL NOT NULL,
		network_in REAL NOT NULL,
		network_out REAL NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
	);`,

	// 5. Create activities table
	`CREATE TABLE IF NOT EXISTS activities (
		id TEXT PRIMARY KEY,
		message TEXT NOT NULL,
		type TEXT NOT NULL,
		user TEXT NOT NULL,
		server_id TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`,

	// 6. Create notifications table
	`CREATE TABLE IF NOT EXISTS notifications (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		message TEXT NOT NULL,
		type TEXT NOT NULL,
		read INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`,
}

// RunMigrations runs all database schema migrations.
func RunMigrations(db *sql.DB) error {
	log.Println("Running database migrations...")

	// Create migration tracking table if not exists
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY
	);`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get current version
	var currentVersion int
	err = db.QueryRow("SELECT COUNT(*) FROM schema_migrations").Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("failed to get migration version: %w", err)
	}

	log.Printf("Current schema version: %d. Total available migrations: %d", currentVersion, len(migrations))

	// Run pending migrations
	for i := currentVersion; i < len(migrations); i++ {
		version := i + 1
		log.Printf("Applying migration version %d...", version)

		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction for migration %d: %w", version, err)
		}

		if _, err := tx.Exec(migrations[i]); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to run migration %d query: %w", version, err)
		}

		if _, err := tx.Exec("INSERT INTO schema_migrations (version) VALUES (?)", version); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %d version: %w", version, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %d: %w", version, err)
		}

		log.Printf("Successfully applied migration version %d", version)
	}

	log.Println("Database migrations completed successfully")
	return nil
}
