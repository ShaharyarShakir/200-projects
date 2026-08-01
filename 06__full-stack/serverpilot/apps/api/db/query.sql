-- name: CreateUser :exec
INSERT INTO users (id, email, password_hash, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5);

-- name: GetUserByID :one
SELECT id, email, password_hash, created_at, updated_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, email, password_hash, created_at, updated_at
FROM users
WHERE email = $1;

-- name: CreateToken :exec
INSERT INTO refresh_tokens (id, user_id, token, expires_at)
VALUES ($1, $2, $3, $4);

-- name: GetToken :one
SELECT user_id, id, expires_at
FROM refresh_tokens
WHERE token = $1;

-- name: DeleteToken :exec
DELETE FROM refresh_tokens
WHERE token = $1;

-- name: DeleteTokensByUserID :exec
DELETE FROM refresh_tokens
WHERE user_id = $1;

-- name: CreateServer :exec
INSERT INTO servers (
	id, name, ip, os, status, cpu_usage, memory_usage, memory_total,
	disk_usage, disk_total, network_in, network_out, uptime, location,
	provider, tags, ssh_port, ssh_user, ssh_auth_method, ssh_password,
	ssh_private_key, ssh_passphrase, host_key, created_at, updated_at
) VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
);

-- name: GetServerByID :one
SELECT 
	id, name, ip, os, status, cpu_usage, memory_usage, memory_total,
	disk_usage, disk_total, network_in, network_out, uptime, location,
	provider, tags, ssh_port, ssh_user, ssh_auth_method, ssh_password,
	ssh_private_key, ssh_passphrase, host_key, created_at, updated_at
FROM servers
WHERE id = $1;

-- name: GetAllServers :many
SELECT 
	id, name, ip, os, status, cpu_usage, memory_usage, memory_total,
	disk_usage, disk_total, network_in, network_out, uptime, location,
	provider, tags, ssh_port, ssh_user, ssh_auth_method, ssh_password,
	ssh_private_key, ssh_passphrase, host_key, created_at, updated_at
FROM servers
ORDER BY created_at DESC;

-- name: UpdateServerMetrics :exec
UPDATE servers
SET 
	status = $1, cpu_usage = $2, memory_usage = $3, memory_total = $4,
	disk_usage = $5, disk_total = $6, network_in = $7, network_out = $8,
	uptime = $9, os = $10, updated_at = $11
WHERE id = $12;

-- name: UpdateServerHostKey :exec
UPDATE servers
SET host_key = $1, updated_at = $2
WHERE id = $3;

-- name: DeleteServer :exec
DELETE FROM servers
WHERE id = $1;

-- name: DeleteServersBulk :exec
DELETE FROM servers
WHERE id = ANY($1::text[]);

-- name: CreateActivity :exec
INSERT INTO activities (id, message, type, "user", server_id, created_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetActivities :many
SELECT id, message, type, "user", server_id, created_at
FROM activities
ORDER BY created_at DESC
LIMIT $1;

-- name: CreateNotification :exec
INSERT INTO notifications (id, title, message, type, read, created_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetNotifications :many
SELECT id, title, message, type, read, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 50;

-- name: MarkNotificationsRead :exec
UPDATE notifications
SET read = TRUE
WHERE read = FALSE;

-- name: InsertSnapshot :exec
INSERT INTO monitoring_snapshots (
	id, server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: GetSnapshotsByServer :many
SELECT id, server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, created_at
FROM monitoring_snapshots
WHERE server_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: GetSnapshotsSince :many
SELECT cpu_usage, memory_usage, network_in, network_out, created_at
FROM monitoring_snapshots
WHERE created_at >= $1
ORDER BY created_at ASC;
