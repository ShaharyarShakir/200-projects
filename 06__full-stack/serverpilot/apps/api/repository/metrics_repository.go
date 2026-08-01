package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
)

// MetricsRepository handles persisting and querying server performance metrics history.
type MetricsRepository interface {
	InsertSnapshot(ctx context.Context, snapshot *models.MonitoringSnapshot) error
	GetHistory(ctx context.Context, serverID string, limit int) ([]*models.MonitoringSnapshot, error)
	GetAggregatedHistory(ctx context.Context, hours int) ([]models.MetricPoint, []models.MetricPoint, []models.MetricPoint, error)
}

type sqlMetricsRepository struct {
	db *sql.DB
}

// NewMetricsRepository constructs a new MetricsRepository.
func NewMetricsRepository(db *sql.DB) MetricsRepository {
	return &sqlMetricsRepository{db: db}
}

func (r *sqlMetricsRepository) InsertSnapshot(ctx context.Context, snapshot *models.MonitoringSnapshot) error {
	query := `
		INSERT INTO monitoring_snapshots (
			id, server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	if snapshot.CreatedAt.IsZero() {
		snapshot.CreatedAt = time.Now()
	}
	_, err := r.db.ExecContext(ctx, query,
		snapshot.ID, snapshot.ServerID, snapshot.CPUUsage, snapshot.MemoryUsage,
		snapshot.DiskUsage, snapshot.NetworkIn, snapshot.NetworkOut, snapshot.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert monitoring snapshot: %w", err)
	}
	return nil
}

func (r *sqlMetricsRepository) GetHistory(ctx context.Context, serverID string, limit int) ([]*models.MonitoringSnapshot, error) {
	query := `
		SELECT id, server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, created_at
		FROM monitoring_snapshots
		WHERE server_id = ?
		ORDER BY created_at DESC
		LIMIT ?
	`
	rows, err := r.db.QueryContext(ctx, query, serverID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query metrics history: %w", err)
	}
	defer rows.Close()

	var history []*models.MonitoringSnapshot
	for rows.Next() {
		var s models.MonitoringSnapshot
		err := rows.Scan(
			&s.ID, &s.ServerID, &s.CPUUsage, &s.MemoryUsage,
			&s.DiskUsage, &s.NetworkIn, &s.NetworkOut, &s.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan metrics row: %w", err)
		}
		history = append(history, &s)
	}
	return history, nil
}

func (r *sqlMetricsRepository) GetAggregatedHistory(ctx context.Context, hours int) ([]models.MetricPoint, []models.MetricPoint, []models.MetricPoint, error) {
	startTime := time.Now().Add(time.Duration(-hours) * time.Hour)
	
	// Query all snapshots in the time window
	query := `
		SELECT cpu_usage, memory_usage, network_in, network_out, created_at
		FROM monitoring_snapshots
		WHERE created_at >= ?
		ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, startTime)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to query time-series aggregates: %w", err)
	}
	defer rows.Close()

	var snapshots []models.MonitoringSnapshot
	for rows.Next() {
		var s models.MonitoringSnapshot
		err := rows.Scan(&s.CPUUsage, &s.MemoryUsage, &s.NetworkIn, &s.NetworkOut, &s.CreatedAt)
		if err != nil {
			return nil, nil, nil, fmt.Errorf("failed to scan row: %w", err)
		}
		snapshots = append(snapshots, s)
	}

	cpuHistory := make([]models.MetricPoint, hours)
	memHistory := make([]models.MetricPoint, hours)
	netHistory := make([]models.MetricPoint, hours)

	now := time.Now()
	for i := hours - 1; i >= 0; i-- {
		slotStart := now.Add(time.Duration(-i) * time.Hour).Truncate(time.Hour)
		slotEnd := slotStart.Add(time.Hour)
		timeStr := slotStart.Format("15:04")

		var cpuSum, memSum, netSum float64
		var count int

		for _, s := range snapshots {
			if (s.CreatedAt.After(slotStart) || s.CreatedAt.Equal(slotStart)) && s.CreatedAt.Before(slotEnd) {
				cpuSum += s.CPUUsage
				memSum += s.MemoryUsage
				netSum += (s.NetworkIn + s.NetworkOut)
				count++
			}
		}

		index := (hours - 1) - i
		if count > 0 {
			cpuHistory[index] = models.MetricPoint{Timestamp: timeStr, Value: cpuSum / float64(count)}
			memHistory[index] = models.MetricPoint{Timestamp: timeStr, Value: memSum / float64(count)}
			netHistory[index] = models.MetricPoint{Timestamp: timeStr, Value: netSum / float64(count)}
		} else {
			// Fallback placeholder/default values if no records exist in slot
			cpuHistory[index] = models.MetricPoint{Timestamp: timeStr, Value: 0.0}
			memHistory[index] = models.MetricPoint{Timestamp: timeStr, Value: 0.0}
			netHistory[index] = models.MetricPoint{Timestamp: timeStr, Value: 0.0}
		}
	}

	return cpuHistory, memHistory, netHistory, nil
}
