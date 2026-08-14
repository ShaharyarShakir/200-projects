-- name: CreateAcademy :one
INSERT INTO academies (
    owner_user_id,
    name,
    slug,
    subdomain
)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetAcademyByID :one
SELECT * FROM academies
WHERE id = $1;

-- name: GetAcademyByOwnerID :one
SELECT * FROM academies
WHERE owner_user_id = $1;

-- name: GetAcademyBySlug :one
SELECT * FROM academies
WHERE slug = $1;

-- name: GetAcademyBySubdomainOrCustomDomain :one
SELECT * FROM academies
WHERE subdomain = $1 OR custom_domain = $1 OR slug = $1;

-- name: ListAcademies :many
SELECT * FROM academies
ORDER BY created_at DESC;
