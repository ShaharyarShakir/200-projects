package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
)

// UserRepository or ServerRepository manages query executions for the servers database table.
type ServerRepository interface {
	Create(ctx context.Context, s *models.Server) error
	GetByID(ctx context.Context, id string) (*models.Server, error)
	GetAll(ctx context.Context) ([]*models.Server, error)
	UpdateMetrics(ctx context.Context, s *models.Server) error
	UpdateHostKey(ctx context.Context, id string, hostKey string) error
	Delete(ctx context.Context, id string) error
	DeleteBulk(ctx context.Context, ids []string) error
}

type sqlServerRepository struct {
	db *sql.DB
}

// NewServerRepository constructs the concrete implementation of ServerRepository.
func NewServerRepository(db *sql.DB) ServerRepository {
	return &sqlServerRepository{db: db}
}

func (r *sqlServerRepository) Create(ctx context.Context, s *models.Server) error {
	tagsStr := strings.Join(s.Tags, ",")
	query := `
		INSERT INTO servers (
			id, name, ip, os, status, cpu_usage, memory_usage, memory_total,
			disk_usage, disk_total, network_in, network_out, uptime, location,
			provider, tags, ssh_port, ssh_user, ssh_auth_method, ssh_password,
			ssh_private_key, ssh_passphrase, host_key, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now()
	_, err := r.db.ExecContext(ctx, query,
		s.ID, s.Name, s.IP, s.OS, s.Status, s.CPUUsage, s.MemoryUsage, s.MemoryTotal,
		s.DiskUsage, s.DiskTotal, s.NetworkIn, s.NetworkOut, s.Uptime, s.Location,
		s.Provider, tagsStr, s.SSHPort, s.SSHUser, s.SSHAuthMethod, s.SSHPassword,
		s.SSHPrivateKey, s.SSHPassphrase, s.HostKey, now, now,
	)
	if err != nil {
		return fmt.Errorf("failed to insert server: %w", err)
	}
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

func (r *sqlServerRepository) GetByID(ctx context.Context, id string) (*models.Server, error) {
	query := `
		SELECT 
			id, name, ip, os, status, cpu_usage, memory_usage, memory_total,
			disk_usage, disk_total, network_in, network_out, uptime, location,
			provider, tags, ssh_port, ssh_user, ssh_auth_method, ssh_password,
			ssh_private_key, ssh_passphrase, host_key, created_at, updated_at
		FROM servers WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	return scanServerRow(row)
}

func (r *sqlServerRepository) GetAll(ctx context.Context) ([]*models.Server, error) {
	query := `
		SELECT 
			id, name, ip, os, status, cpu_usage, memory_usage, memory_total,
			disk_usage, disk_total, network_in, network_out, uptime, location,
			provider, tags, ssh_port, ssh_user, ssh_auth_method, ssh_password,
			ssh_private_key, ssh_passphrase, host_key, created_at, updated_at
		FROM servers ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query servers: %w", err)
	}
	defer rows.Close()

	var servers []*models.Server
	for rows.Next() {
		s, err := scanServerRows(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan server row: %w", err)
		}
		servers = append(servers, s)
	}
	return servers, nil
}

func (r *sqlServerRepository) UpdateMetrics(ctx context.Context, s *models.Server) error {
	query := `
		UPDATE servers 
		SET 
			status = ?, cpu_usage = ?, memory_usage = ?, memory_total = ?,
			disk_usage = ?, disk_total = ?, network_in = ?, network_out = ?,
			uptime = ?, os = ?, updated_at = ?
		WHERE id = ?
	`
	now := time.Now()
	_, err := r.db.ExecContext(ctx, query,
		s.Status, s.CPUUsage, s.MemoryUsage, s.MemoryTotal, s.DiskUsage, s.DiskTotal,
		s.NetworkIn, s.NetworkOut, s.Uptime, s.OS, now, s.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update server metrics: %w", err)
	}
	s.UpdatedAt = now
	return nil
}

func (r *sqlServerRepository) UpdateHostKey(ctx context.Context, id string, hostKey string) error {
	query := "UPDATE servers SET host_key = ?, updated_at = ? WHERE id = ?"
	_, err := r.db.ExecContext(ctx, query, hostKey, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update host key: %w", err)
	}
	return nil
}

func (r *sqlServerRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM servers WHERE id = ?"
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete server: %w", err)
	}
	return nil
}

func (r *sqlServerRepository) DeleteBulk(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	tx, err := pQueryBegin(ctx, r.db)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := "DELETE FROM servers WHERE id = ?"
	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to prepare delete statement: %w", err)
	}
	defer stmt.Close()

	for _, id := range ids {
		_, err := stmt.ExecContext(ctx, id)
		if err != nil {
			return fmt.Errorf("failed to delete server ID %s: %w", id, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit bulk deletes: %w", err)
	}
	return nil
}

// Scanner interfaces
type scanner interface {
	Scan(dest ...any) error
}

func scanServerRow(s scanner) (*models.Server, error) {
	var srv models.Server
	var tagsStr string
	var os, loc, prov, pwd, pkey, passphrase, hkey sql.NullString

	err := s.Scan(
		&srv.ID, &srv.Name, &srv.IP, &os, &srv.Status, &srv.CPUUsage,
		&srv.MemoryUsage, &srv.MemoryTotal, &srv.DiskUsage, &srv.DiskTotal,
		&srv.NetworkIn, &srv.NetworkOut, &srv.Uptime, &loc, &prov, &tagsStr,
		&srv.SSHPort, &srv.SSHUser, &srv.SSHAuthMethod, &pwd, &pkey, &passphrase,
		&hkey, &srv.CreatedAt, &srv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	srv.OS = os.String
	srv.Location = loc.String
	srv.Provider = prov.String
	srv.SSHPassword = pwd.String
	srv.SSHPrivateKey = pkey.String
	srv.SSHPassphrase = passphrase.String
	srv.HostKey = hkey.String

	if tagsStr != "" {
		srv.Tags = strings.Split(tagsStr, ",")
	} else {
		srv.Tags = []string{}
	}

	return &srv, nil
}

func scanServerRows(rows *sql.Rows) (*models.Server, error) {
	return scanServerRow(rows)
}

func pQueryBegin(ctx context.Context, db *sql.DB) (*sql.Tx, error) {
	return db.BeginTx(ctx, nil)
}
