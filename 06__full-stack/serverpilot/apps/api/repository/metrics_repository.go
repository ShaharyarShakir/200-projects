package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository/db"
)

// MetricsRepository handles persisting and querying server performance metrics history.
type MetricsRepository interface {
	InsertSnapshot(ctx context.Context, snapshot *models.MonitoringSnapshot) error
	GetHistory(ctx context.Context, serverID string, limit int) ([]*models.MonitoringSnapshot, error)
	GetAggregatedHistory(ctx context.Context, hours int) ([]models.MetricPoint, []models.MetricPoint, []models.MetricPoint, error)
}

type sqlMetricsRepository struct {
	queries *db.Queries
	db      *sql.DB
}

// NewMetricsRepository constructs a new MetricsRepository.
func NewMetricsRepository(dbConn *sql.DB) MetricsRepository {
	return &sqlMetricsRepository{
		queries: db.New(dbConn),
		db:      dbConn,
	}
}

func (r *sqlMetricsRepository) InsertSnapshot(ctx context.Context, snapshot *models.MonitoringSnapshot) error {
	if snapshot.CreatedAt.IsZero() {
		snapshot.CreatedAt = time.Now()
	}
	err := r.queries.InsertSnapshot(ctx, db.InsertSnapshotParams{
		ID:         snapshot.ID,
		ServerID:   snapshot.ServerID,
		CpuUsage:   snapshot.CPUUsage,
		MemoryUsage: snapshot.MemoryUsage,
		DiskUsage:   snapshot.DiskUsage,
		NetworkIn:   snapshot.NetworkIn,
		NetworkOut:  snapshot.NetworkOut,
		CreatedAt:   snapshot.CreatedAt,
	})
	if err != nil {
		return fmt.Errorf("failed to insert monitoring snapshot: %w", err)
	}
	return nil
}

func (r *sqlMetricsRepository) GetHistory(ctx context.Context, serverID string, limit int) ([]*models.MonitoringSnapshot, error) {
	rows, err := r.queries.GetSnapshotsByServer(ctx, db.GetSnapshotsByServerParams{
		ServerID: serverID,
		Limit:    int32(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query metrics history: %w", err)
	}

	history := make([]*models.MonitoringSnapshot, len(rows))
	for i, row := range rows {
		history[i] = &models.MonitoringSnapshot{
			ID:          row.ID,
			ServerID:    row.ServerID,
			CPUUsage:    row.CpuUsage,
			MemoryUsage: row.MemoryUsage,
			DiskUsage:   row.DiskUsage,
			NetworkIn:   row.NetworkIn,
			NetworkOut:  row.NetworkOut,
			CreatedAt:   row.CreatedAt,
		}
	}
	return history, nil
}

func (r *sqlMetricsRepository) GetAggregatedHistory(ctx context.Context, hours int) ([]models.MetricPoint, []models.MetricPoint, []models.MetricPoint, error) {
	startTime := time.Now().Add(time.Duration(-hours) * time.Hour)

	rows, err := r.queries.GetSnapshotsSince(ctx, startTime)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to query time-series aggregates: %w", err)
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

		for _, s := range rows {
			if (s.CreatedAt.After(slotStart) || s.CreatedAt.Equal(slotStart)) && s.CreatedAt.Before(slotEnd) {
				cpuSum += s.CpuUsage
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
