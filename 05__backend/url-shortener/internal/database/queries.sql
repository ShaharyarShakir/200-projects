-- name: CreateURL :one
INSERT INTO urls (id, original_url, short_url)
VALUES (?, ?, ?)
RETURNING *;
-- name: GetURL :one
SELECT *
FROM urls
WHERE short_url = ?
LIMIT 1;