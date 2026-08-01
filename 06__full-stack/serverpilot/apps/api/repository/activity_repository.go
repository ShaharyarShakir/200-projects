package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
	"github.com/ShaharyarShakir/serverpilot/apps/api/repository/db"
)

// ActivityRepository handles CRUD operations for system activities and notifications.
type ActivityRepository interface {
	CreateActivity(ctx context.Context, act *models.Activity) error
	GetActivities(ctx context.Context, limit int) ([]*models.Activity, error)
	CreateNotification(ctx context.Context, notif *models.Notification) error
	GetNotifications(ctx context.Context) ([]*models.Notification, error)
	MarkNotificationsRead(ctx context.Context) error
}

type sqlActivityRepository struct {
	queries *db.Queries
	db      *sql.DB
}

// NewActivityRepository returns a new ActivityRepository.
func NewActivityRepository(dbConn *sql.DB) ActivityRepository {
	return &sqlActivityRepository{
		queries: db.New(dbConn),
		db:      dbConn,
	}
}

func (r *sqlActivityRepository) CreateActivity(ctx context.Context, act *models.Activity) error {
	if act.CreatedAt.IsZero() {
		act.CreatedAt = time.Now()
	}
	var srvID sql.NullString
	if act.ServerID != "" {
		srvID = sql.NullString{String: act.ServerID, Valid: true}
	}
	err := r.queries.CreateActivity(ctx, db.CreateActivityParams{
		ID:        act.ID,
		Message:   act.Message,
		Type:      act.Type,
		User:      act.User,
		ServerID:  srvID,
		CreatedAt: act.CreatedAt,
	})
	if err != nil {
		return fmt.Errorf("failed to insert activity: %w", err)
	}
	return nil
}

func (r *sqlActivityRepository) GetActivities(ctx context.Context, limit int) ([]*models.Activity, error) {
	rows, err := r.queries.GetActivities(ctx, int32(limit))
	if err != nil {
		return nil, fmt.Errorf("failed to query activities: %w", err)
	}

	list := make([]*models.Activity, len(rows))
	for i, row := range rows {
		list[i] = &models.Activity{
			ID:        row.ID,
			Message:   row.Message,
			Type:      row.Type,
			User:      row.User,
			ServerID:  row.ServerID.String,
			CreatedAt: row.CreatedAt,
		}
	}
	return list, nil
}

func (r *sqlActivityRepository) CreateNotification(ctx context.Context, notif *models.Notification) error {
	if notif.CreatedAt.IsZero() {
		notif.CreatedAt = time.Now()
	}
	err := r.queries.CreateNotification(ctx, db.CreateNotificationParams{
		ID:        notif.ID,
		Title:     notif.Title,
		Message:   notif.Message,
		Type:      notif.Type,
		Read:      notif.Read,
		CreatedAt: notif.CreatedAt,
	})
	if err != nil {
		return fmt.Errorf("failed to insert notification: %w", err)
	}
	return nil
}

func (r *sqlActivityRepository) GetNotifications(ctx context.Context) ([]*models.Notification, error) {
	rows, err := r.queries.GetNotifications(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query notifications: %w", err)
	}

	list := make([]*models.Notification, len(rows))
	for i, row := range rows {
		list[i] = &models.Notification{
			ID:        row.ID,
			Title:     row.Title,
			Message:   row.Message,
			Type:      row.Type,
			Read:      row.Read,
			CreatedAt: row.CreatedAt,
		}
	}
	return list, nil
}

func (r *sqlActivityRepository) MarkNotificationsRead(ctx context.Context) error {
	err := r.queries.MarkNotificationsRead(ctx)
	if err != nil {
		return fmt.Errorf("failed to mark notifications read: %w", err)
	}
	return nil
}
