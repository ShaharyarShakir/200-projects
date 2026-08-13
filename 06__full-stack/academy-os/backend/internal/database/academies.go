package database

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ShaharyarShakir/academy-os/internal/academies"
)

type AcademyRepository struct {
	db *pgxpool.Pool
}

func NewAcademyRepository(db *pgxpool.Pool) *AcademyRepository {
	return &AcademyRepository{db: db}
}

type AcademyRecord struct {
	ID             uuid.UUID `json:"id"`
	OwnerUserID    uuid.UUID `json:"ownerUserId"`
	Name           string    `json:"name"`
	Slug           string    `json:"slug"`
	Subdomain      string    `json:"subdomain"`
	CustomDomain   string    `json:"customDomain"`
	Status         string    `json:"status"`
	Description    string    `json:"description"`
	LogoURL        string    `json:"logoUrl"`
	FaviconURL     string    `json:"faviconUrl"`
	PrimaryColor   string    `json:"primaryColor"`
	SecondaryColor string    `json:"secondaryColor"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type UpdateAcademyBrandingParams struct {
	Name           *string
	Description    *string
	LogoURL        *string
	FaviconURL     *string
	PrimaryColor   *string
	SecondaryColor *string
	CustomDomain   *string
}

func (r *AcademyRepository) Create(
	ctx context.Context,
	ownerUserID uuid.UUID,
	name string,
	slug string,
	subdomain string,
) (AcademyRecord, error) {
	if subdomain == "" {
		subdomain = slug
	}

	var academy AcademyRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO academies (
			owner_user_id,
			name,
			slug,
			subdomain,
			status
		)
		VALUES ($1, $2, $3, $4, 'active')
		RETURNING id, owner_user_id, name, slug, subdomain, COALESCE(custom_domain, ''), status, description, logo_url, favicon_url, primary_color, secondary_color, created_at, updated_at
		`,
		ownerUserID,
		name,
		slug,
		subdomain,
	).Scan(
		&academy.ID,
		&academy.OwnerUserID,
		&academy.Name,
		&academy.Slug,
		&academy.Subdomain,
		&academy.CustomDomain,
		&academy.Status,
		&academy.Description,
		&academy.LogoURL,
		&academy.FaviconURL,
		&academy.PrimaryColor,
		&academy.SecondaryColor,
		&academy.CreatedAt,
		&academy.UpdatedAt,
	)

	if err != nil {
		return AcademyRecord{}, fmt.Errorf("create academy: %w", err)
	}

	return academy, nil
}

func (r *AcademyRepository) FindByOwnerID(
	ctx context.Context,
	ownerUserID uuid.UUID,
) (AcademyRecord, error) {
	var academy AcademyRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, owner_user_id, name, slug, subdomain, COALESCE(custom_domain, ''), status, description, logo_url, favicon_url, primary_color, secondary_color, created_at, updated_at
		FROM academies
		WHERE owner_user_id = $1
		`,
		ownerUserID,
	).Scan(
		&academy.ID,
		&academy.OwnerUserID,
		&academy.Name,
		&academy.Slug,
		&academy.Subdomain,
		&academy.CustomDomain,
		&academy.Status,
		&academy.Description,
		&academy.LogoURL,
		&academy.FaviconURL,
		&academy.PrimaryColor,
		&academy.SecondaryColor,
		&academy.CreatedAt,
		&academy.UpdatedAt,
	)

	if err != nil {
		return AcademyRecord{}, fmt.Errorf("find academy by owner: %w", err)
	}

	return academy, nil
}

func (r *AcademyRepository) FindByID(
	ctx context.Context,
	id uuid.UUID,
) (AcademyRecord, error) {
	var academy AcademyRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, owner_user_id, name, slug, subdomain, COALESCE(custom_domain, ''), status, description, logo_url, favicon_url, primary_color, secondary_color, created_at, updated_at
		FROM academies
		WHERE id = $1
		`,
		id,
	).Scan(
		&academy.ID,
		&academy.OwnerUserID,
		&academy.Name,
		&academy.Slug,
		&academy.Subdomain,
		&academy.CustomDomain,
		&academy.Status,
		&academy.Description,
		&academy.LogoURL,
		&academy.FaviconURL,
		&academy.PrimaryColor,
		&academy.SecondaryColor,
		&academy.CreatedAt,
		&academy.UpdatedAt,
	)

	if err != nil {
		return AcademyRecord{}, fmt.Errorf("find academy by id: %w", err)
	}

	return academy, nil
}

func (r *AcademyRepository) FindBySubdomain(
	ctx context.Context,
	subdomain string,
) (*academies.Academy, error) {
	var a academies.Academy
	var customDomain string

	err := r.db.QueryRow(
		ctx,
		`
		SELECT
			id,
			owner_user_id,
			name,
			slug,
			subdomain,
			COALESCE(custom_domain, ''),
			status
		FROM academies
		WHERE subdomain = $1
		  AND status = 'active'
		LIMIT 1;
		`,
		subdomain,
	).Scan(
		&a.ID,
		&a.OwnerUserID,
		&a.Name,
		&a.Slug,
		&a.Subdomain,
		&customDomain,
		&a.Status,
	)

	if err != nil {
		return nil, fmt.Errorf("find academy by subdomain: %w", err)
	}

	if customDomain != "" {
		a.CustomDomain = &customDomain
	}

	return &a, nil
}

func (r *AcademyRepository) FindByCustomDomain(
	ctx context.Context,
	domain string,
) (*academies.Academy, error) {
	var a academies.Academy
	var customDomain string

	err := r.db.QueryRow(
		ctx,
		`
		SELECT
			id,
			owner_user_id,
			name,
			slug,
			subdomain,
			COALESCE(custom_domain, ''),
			status
		FROM academies
		WHERE custom_domain = $1
		  AND status = 'active'
		LIMIT 1;
		`,
		domain,
	).Scan(
		&a.ID,
		&a.OwnerUserID,
		&a.Name,
		&a.Slug,
		&a.Subdomain,
		&customDomain,
		&a.Status,
	)

	if err != nil {
		return nil, fmt.Errorf("find academy by custom domain: %w", err)
	}

	if customDomain != "" {
		a.CustomDomain = &customDomain
	}

	return &a, nil
}

func (r *AcademyRepository) FindBySlug(
	ctx context.Context,
	slug string,
) (AcademyRecord, error) {
	var academy AcademyRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, owner_user_id, name, slug, subdomain, COALESCE(custom_domain, ''), status, description, logo_url, favicon_url, primary_color, secondary_color, created_at, updated_at
		FROM academies
		WHERE slug = $1
		`,
		slug,
	).Scan(
		&academy.ID,
		&academy.OwnerUserID,
		&academy.Name,
		&academy.Slug,
		&academy.Subdomain,
		&academy.CustomDomain,
		&academy.Status,
		&academy.Description,
		&academy.LogoURL,
		&academy.FaviconURL,
		&academy.PrimaryColor,
		&academy.SecondaryColor,
		&academy.CreatedAt,
		&academy.UpdatedAt,
	)

	if err != nil {
		return AcademyRecord{}, fmt.Errorf("find academy by slug: %w", err)
	}

	return academy, nil
}

func (r *AcademyRepository) ResolveByHost(
	ctx context.Context,
	host string,
) (*AcademyRecord, error) {
	hostOnly := host
	if idx := strings.Index(hostOnly, ":"); idx != -1 {
		hostOnly = hostOnly[:idx]
	}

	targetSub := hostOnly
	if strings.HasSuffix(hostOnly, ".localhost") {
		targetSub = strings.TrimSuffix(hostOnly, ".localhost")
	} else if strings.HasSuffix(hostOnly, ".academyos.local") {
		targetSub = strings.TrimSuffix(hostOnly, ".academyos.local")
	} else if strings.HasSuffix(hostOnly, ".academyos.com") {
		targetSub = strings.TrimSuffix(hostOnly, ".academyos.com")
	}

	var academy AcademyRecord
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, owner_user_id, name, slug, subdomain, COALESCE(custom_domain, ''), status, description, logo_url, favicon_url, primary_color, secondary_color, created_at, updated_at
		FROM academies
		WHERE subdomain = $1 OR slug = $1 OR custom_domain = $2
		`,
		targetSub,
		hostOnly,
	).Scan(
		&academy.ID,
		&academy.OwnerUserID,
		&academy.Name,
		&academy.Slug,
		&academy.Subdomain,
		&academy.CustomDomain,
		&academy.Status,
		&academy.Description,
		&academy.LogoURL,
		&academy.FaviconURL,
		&academy.PrimaryColor,
		&academy.SecondaryColor,
		&academy.CreatedAt,
		&academy.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("resolve academy by host: %w", err)
	}

	return &academy, nil
}

func (r *AcademyRepository) UpdateBranding(
	ctx context.Context,
	academyID uuid.UUID,
	params UpdateAcademyBrandingParams,
) (AcademyRecord, error) {
	var academy AcademyRecord

	err := r.db.QueryRow(
		ctx,
		`
		UPDATE academies
		SET
			name = COALESCE($2, name),
			description = COALESCE($3, description),
			logo_url = COALESCE($4, logo_url),
			favicon_url = COALESCE($5, favicon_url),
			primary_color = COALESCE($6, primary_color),
			secondary_color = COALESCE($7, secondary_color),
			custom_domain = COALESCE($8, custom_domain),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, owner_user_id, name, slug, subdomain, COALESCE(custom_domain, ''), status, description, logo_url, favicon_url, primary_color, secondary_color, created_at, updated_at
		`,
		academyID,
		params.Name,
		params.Description,
		params.LogoURL,
		params.FaviconURL,
		params.PrimaryColor,
		params.SecondaryColor,
		params.CustomDomain,
	).Scan(
		&academy.ID,
		&academy.OwnerUserID,
		&academy.Name,
		&academy.Slug,
		&academy.Subdomain,
		&academy.CustomDomain,
		&academy.Status,
		&academy.Description,
		&academy.LogoURL,
		&academy.FaviconURL,
		&academy.PrimaryColor,
		&academy.SecondaryColor,
		&academy.CreatedAt,
		&academy.UpdatedAt,
	)

	if err != nil {
		return AcademyRecord{}, fmt.Errorf("update academy branding: %w", err)
	}

	return academy, nil
}

func (r *AcademyRepository) ListAll(
	ctx context.Context,
) ([]AcademyRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, owner_user_id, name, slug, subdomain, COALESCE(custom_domain, ''), status, description, logo_url, favicon_url, primary_color, secondary_color, created_at, updated_at
		FROM academies
		ORDER BY created_at DESC
		`,
	)
	if err != nil {
		return nil, fmt.Errorf("list all academies: %w", err)
	}
	defer rows.Close()

	var academies []AcademyRecord
	for rows.Next() {
		var academy AcademyRecord
		if err := rows.Scan(
			&academy.ID,
			&academy.OwnerUserID,
			&academy.Name,
			&academy.Slug,
			&academy.Subdomain,
			&academy.CustomDomain,
			&academy.Status,
			&academy.Description,
			&academy.LogoURL,
			&academy.FaviconURL,
			&academy.PrimaryColor,
			&academy.SecondaryColor,
			&academy.CreatedAt,
			&academy.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan academy: %w", err)
		}
		academies = append(academies, academy)
	}

	return academies, nil
}

func (r *AcademyRepository) UpdateStatus(
	ctx context.Context,
	academyID uuid.UUID,
	status string,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		UPDATE academies
		SET status = $2, updated_at = NOW()
		WHERE id = $1
		`,
		academyID,
		status,
	)
	if err != nil {
		return fmt.Errorf("update academy status: %w", err)
	}
	return nil
}
