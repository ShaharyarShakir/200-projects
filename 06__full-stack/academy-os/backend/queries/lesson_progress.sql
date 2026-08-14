-- name: UpsertLessonProgress :one
INSERT INTO lesson_progress (
    id,
    tenant_id,
    user_id,
    lesson_id,
    position_seconds,
    completed_at,
    updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (tenant_id, user_id, lesson_id)
DO UPDATE SET
    position_seconds = EXCLUDED.position_seconds,
    completed_at = COALESCE(EXCLUDED.completed_at, lesson_progress.completed_at),
    updated_at = NOW()
RETURNING *;

-- name: GetLessonProgress :one
SELECT * FROM lesson_progress
WHERE tenant_id = $1
  AND user_id = $2
  AND lesson_id = $3;

-- name: ListLessonProgressForUser :many
SELECT * FROM lesson_progress
WHERE tenant_id = $1
  AND user_id = $2;
