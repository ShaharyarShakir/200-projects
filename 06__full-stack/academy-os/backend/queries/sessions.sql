-- name: CreateSession :one
INSERT INTO sessions (
    user_id,
    expires_at
)
VALUES ($1, $2)
RETURNING *;

-- name: CreateSessionWithTokenHash :one
INSERT INTO sessions (
    user_id,
    token_hash,
    expires_at
)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetSessionByID :one
SELECT * FROM sessions
WHERE id = $1 AND expires_at > NOW();

-- name: GetSessionByTokenHash :one
SELECT * FROM sessions
WHERE token_hash = $1 AND expires_at > NOW();

-- name: DeleteSession :exec
DELETE FROM sessions
WHERE id = $1;

-- name: UpdateSessionLastUsed :exec
UPDATE sessions
SET last_used_at = NOW()
WHERE id = $1;
