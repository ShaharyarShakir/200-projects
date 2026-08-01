package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository/db"
)

// ServerRepository manages query executions for the servers database table.
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
	queries *db.Queries
	db      *sql.DB
}

// NewServerRepository constructs the concrete implementation of ServerRepository.
func NewServerRepository(dbConn *sql.DB) ServerRepository {
	return &sqlServerRepository{
		queries: db.New(dbConn),
		db:      dbConn,
	}
}

func (r *sqlServerRepository) Create(ctx context.Context, s *models.Server) error {
	tagsStr := strings.Join(s.Tags, ",")
	now := time.Now()

	err := r.queries.CreateServer(ctx, db.CreateServerParams{
		ID:            s.ID,
		Name:          s.Name,
		Ip:            s.IP,
		Os:            s.OS,
		Status:        s.Status,
		CpuUsage:      s.CPUUsage,
		MemoryUsage:   s.MemoryUsage,
		MemoryTotal:   s.MemoryTotal,
		DiskUsage:     s.DiskUsage,
		DiskTotal:     s.DiskTotal,
		NetworkIn:     s.NetworkIn,
		NetworkOut:    s.NetworkOut,
		Uptime:        s.Uptime,
		Location:      s.Location,
		Provider:      s.Provider,
		Tags:          tagsStr,
		SshPort:       int32(s.SSHPort),
		SshUser:       s.SSHUser,
		SshAuthMethod: s.SSHAuthMethod,
		SshPassword:   s.SSHPassword,
		SshPrivateKey: s.SSHPrivateKey,
		SshPassphrase: s.SSHPassphrase,
		HostKey:       s.HostKey,
		CreatedAt:     now,
		UpdatedAt:     now,
	})
	if err != nil {
		return fmt.Errorf("failed to insert server: %w", err)
	}

	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

func (r *sqlServerRepository) GetByID(ctx context.Context, id string) (*models.Server, error) {
	row, err := r.queries.GetServerByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return mapToModelServer(row), nil
}

func (r *sqlServerRepository) GetAll(ctx context.Context) ([]*models.Server, error) {
	rows, err := r.queries.GetAllServers(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query servers: %w", err)
	}

	servers := make([]*models.Server, len(rows))
	for i, row := range rows {
		servers[i] = mapToModelServer(row)
	}
	return servers, nil
}

func (r *sqlServerRepository) UpdateMetrics(ctx context.Context, s *models.Server) error {
	now := time.Now()
	err := r.queries.UpdateServerMetrics(ctx, db.UpdateServerMetricsParams{
		Status:      s.Status,
		CpuUsage:    s.CPUUsage,
		MemoryUsage: s.MemoryUsage,
		MemoryTotal: s.MemoryTotal,
		DiskUsage:   s.DiskUsage,
		DiskTotal:   s.DiskTotal,
		NetworkIn:   s.NetworkIn,
		NetworkOut:  s.NetworkOut,
		Uptime:      s.Uptime,
		Os:          s.OS,
		UpdatedAt:   now,
		ID:          s.ID,
	})
	if err != nil {
		return fmt.Errorf("failed to update server metrics: %w", err)
	}
	s.UpdatedAt = now
	return nil
}

func (r *sqlServerRepository) UpdateHostKey(ctx context.Context, id string, hostKey string) error {
	err := r.queries.UpdateServerHostKey(ctx, db.UpdateServerHostKeyParams{
		HostKey:   hostKey,
		UpdatedAt: time.Now(),
		ID:        id,
	})
	if err != nil {
		return fmt.Errorf("failed to update host key: %w", err)
	}
	return nil
}

func (r *sqlServerRepository) Delete(ctx context.Context, id string) error {
	err := r.queries.DeleteServer(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete server: %w", err)
	}
	return nil
}

func (r *sqlServerRepository) DeleteBulk(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	err := r.queries.DeleteServersBulk(ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to delete servers bulk: %w", err)
	}
	return nil
}

func mapToModelServer(s db.Server) *models.Server {
	var tags []string
	if s.Tags != "" {
		tags = strings.Split(s.Tags, ",")
	} else {
		tags = []string{}
	}

	return &models.Server{
		ID:            s.ID,
		Name:          s.Name,
		IP:            s.Ip,
		Status:        s.Status,
		OS:            s.Os,
		CPUUsage:      s.CpuUsage,
		MemoryUsage:   s.MemoryUsage,
		MemoryTotal:   s.MemoryTotal,
		DiskUsage:     s.DiskUsage,
		DiskTotal:     s.DiskTotal,
		NetworkIn:     s.NetworkIn,
		NetworkOut:    s.NetworkOut,
		Uptime:        s.Uptime,
		Location:      s.Location,
		Provider:      s.Provider,
		Tags:          tags,
		SSHPort:       int(s.SshPort),
		SSHUser:       s.SshUser,
		SSHAuthMethod: s.SshAuthMethod,
		SSHPassword:   s.SshPassword,
		SSHPrivateKey: s.SshPrivateKey,
		SSHPassphrase: s.SshPassphrase,
		HostKey:       s.HostKey,
		CreatedAt:     s.CreatedAt,
		UpdatedAt:     s.UpdatedAt,
	}
}
