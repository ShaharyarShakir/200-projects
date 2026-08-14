-- name: CreateEnrollment :one
INSERT INTO enrollments (
    id,
    tenant_id,
    user_id,
    course_id
)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetEnrollment :one
SELECT * FROM enrollments
WHERE tenant_id = $1 AND user_id = $2 AND course_id = $3;

-- name: ListUserEnrollments :many
SELECT * FROM enrollments
WHERE tenant_id = $1 AND user_id = $2
ORDER BY created_at DESC;
