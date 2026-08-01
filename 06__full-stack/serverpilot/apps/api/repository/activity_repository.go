package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/models"
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
	db *sql.DB
}

// NewActivityRepository returns a new ActivityRepository.
func NewActivityRepository(db *sql.DB) ActivityRepository {
	return &sqlActivityRepository{db: db}
}

func (r *sqlActivityRepository) CreateActivity(ctx context.Context, act *models.Activity) error {
	query := `
		INSERT INTO activities (id, message, type, user, server_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	if act.CreatedAt.IsZero() {
		act.CreatedAt = time.Now()
	}
	_, err := r.db.ExecContext(ctx, query, act.ID, act.Message, act.Type, act.User, act.ServerID, act.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert activity: %w", err)
	}
	return nil
}

func (r *sqlActivityRepository) GetActivities(ctx context.Context, limit int) ([]*models.Activity, error) {
	query := `
		SELECT id, message, type, user, server_id, created_at
		FROM activities
		ORDER BY created_at DESC
		LIMIT ?
	`
	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query activities: %w", err)
	}
	defer rows.Close()

	var list []*models.Activity
	for rows.Next() {
		var a models.Activity
		var srvID sql.NullString
		err := rows.Scan(&a.ID, &a.Message, &a.Type, &a.User, &srvID, &a.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan activity: %w", err)
		}
		a.ServerID = srvID.String
		list = append(list, &a)
	}
	return list, nil
}

func (r *sqlActivityRepository) CreateNotification(ctx context.Context, notif *models.Notification) error {
	query := `
		INSERT INTO notifications (id, title, message, type, read, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	if notif.CreatedAt.IsZero() {
		notif.CreatedAt = time.Now()
	}
	readVal := 0
	if notif.Read {
		readVal = 1
	}
	_, err := r.db.ExecContext(ctx, query, notif.ID, notif.Title, notif.Message, notif.Type, readVal, notif.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert notification: %w", err)
	}
	return nil
}

func (r *sqlActivityRepository) GetNotifications(ctx context.Context) ([]*models.Notification, error) {
	query := `
		SELECT id, title, message, type, read, created_at
		FROM notifications
		ORDER BY created_at DESC
		LIMIT 50
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	var list []*models.Notification
	for rows.Next() {
		var n models.Notification
		var readVal int
		err := rows.Scan(&n.ID, &n.Title, &n.Message, &n.Type, &readVal, &n.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}
		n.Read = (readVal == 1)
		list = append(list, &n)
	}
	return list, nil
}

func (r *sqlActivityRepository) MarkNotificationsRead(ctx context.Context) error {
	query := "UPDATE notifications SET read = 1 WHERE read = 0"
	_, err := r.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to mark notifications read: %w", err)
	}
	return nil
}
