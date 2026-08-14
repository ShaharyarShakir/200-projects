-- name: CreateCourse :one
INSERT INTO courses (
    academy_id,
    created_by,
    title,
    slug,
    description
)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListCoursesByAcademy :many
SELECT * FROM courses
WHERE academy_id = $1
ORDER BY created_at DESC;

-- name: GetCourseByIDAndAcademy :one
SELECT * FROM courses
WHERE id = $1 AND academy_id = $2;

-- name: GetCourse :one
SELECT
    id,
    academy_id,
    title,
    description,
    status
FROM courses
WHERE id = $1
  AND academy_id = $2;

-- name: ListPublishedCoursesByAcademyID :many
SELECT
    id,
    title,
    description
FROM courses
WHERE academy_id = $1
  AND status = 'published'
ORDER BY created_at DESC;

-- name: UpdateCourse :exec
UPDATE courses
SET
    title = $1,
    slug = $2,
    description = $3,
    updated_at = NOW()
WHERE id = $4 AND academy_id = $5;

-- name: DeleteCourse :exec
DELETE FROM courses
WHERE id = $1 AND academy_id = $2;
