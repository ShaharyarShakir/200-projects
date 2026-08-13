package database

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantRepository struct {
	db *pgxpool.Pool
}

func NewTenantRepository(db *pgxpool.Pool) *TenantRepository {
	return &TenantRepository{db: db}
}

type TenantRecord struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Slug           string    `json:"slug"`
	Description    string    `json:"description"`
	LogoURL        string    `json:"logoUrl"`
	FaviconURL     string    `json:"faviconUrl"`
	PrimaryColor   string    `json:"primaryColor"`
	SecondaryColor string    `json:"secondaryColor"`
	CustomDomain   string    `json:"customDomain"`
}

type UpdateBrandingParams struct {
	Name           *string
	Description    *string
	LogoURL        *string
	FaviconURL     *string
	PrimaryColor   *string
	SecondaryColor *string
	CustomDomain   *string
}

func (r *TenantRepository) Create(
	ctx context.Context,
	name string,
	slug string,
) (TenantRecord, error) {
	var tenant TenantRecord

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO tenants (
			name,
			slug
		)
		VALUES ($1, $2)
		RETURNING id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, custom_domain
		`,
		name,
		slug,
	).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Description,
		&tenant.LogoURL,
		&tenant.FaviconURL,
		&tenant.PrimaryColor,
		&tenant.SecondaryColor,
		&tenant.CustomDomain,
	)

	if err != nil {
		return TenantRecord{}, fmt.Errorf("create tenant: %w", err)
	}

	return tenant, nil
}

func (r *TenantRepository) CreateWithOwnerTx(
	ctx context.Context,
	name string,
	slug string,
	userID uuid.UUID,
	role string,
) (TenantRecord, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return TenantRecord{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var tenant TenantRecord
	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO tenants (name, slug)
		VALUES ($1, $2)
		RETURNING id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, custom_domain
		`,
		name,
		slug,
	).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Description,
		&tenant.LogoURL,
		&tenant.FaviconURL,
		&tenant.PrimaryColor,
		&tenant.SecondaryColor,
		&tenant.CustomDomain,
	)
	if err != nil {
		return TenantRecord{}, fmt.Errorf("create tenant in tx: %w", err)
	}

	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO memberships (tenant_id, user_id, role)
		VALUES ($1, $2, $3)
		`,
		tenant.ID,
		userID,
		role,
	)
	if err != nil {
		return TenantRecord{}, fmt.Errorf("create membership in tx: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return TenantRecord{}, fmt.Errorf("commit tx: %w", err)
	}

	return tenant, nil
}


func (r *TenantRepository) UpdateBranding(
	ctx context.Context,
	tenantID uuid.UUID,
	params UpdateBrandingParams,
) (TenantRecord, error) {
	var tenant TenantRecord

	err := r.db.QueryRow(
		ctx,
		`
		UPDATE tenants
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
		RETURNING id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, custom_domain
		`,
		tenantID,
		params.Name,
		params.Description,
		params.LogoURL,
		params.FaviconURL,
		params.PrimaryColor,
		params.SecondaryColor,
		params.CustomDomain,
	).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Description,
		&tenant.LogoURL,
		&tenant.FaviconURL,
		&tenant.PrimaryColor,
		&tenant.SecondaryColor,
		&tenant.CustomDomain,
	)

	if err != nil {
		return TenantRecord{}, fmt.Errorf("update tenant branding: %w", err)
	}

	return tenant, nil
}

func (r *TenantRepository) FindBySlug(
	ctx context.Context,
	slug string,
) (TenantRecord, error) {
	var tenant TenantRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, custom_domain
		FROM tenants
		WHERE slug = $1
		`,
		slug,
	).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Description,
		&tenant.LogoURL,
		&tenant.FaviconURL,
		&tenant.PrimaryColor,
		&tenant.SecondaryColor,
		&tenant.CustomDomain,
	)

	if err != nil {
		return TenantRecord{}, fmt.Errorf("find tenant by slug: %w", err)
	}

	return tenant, nil
}

func (r *TenantRepository) FindByID(
	ctx context.Context,
	id uuid.UUID,
) (TenantRecord, error) {
	var tenant TenantRecord

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, custom_domain
		FROM tenants
		WHERE id = $1
		`,
		id,
	).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Description,
		&tenant.LogoURL,
		&tenant.FaviconURL,
		&tenant.PrimaryColor,
		&tenant.SecondaryColor,
		&tenant.CustomDomain,
	)

	if err != nil {
		return TenantRecord{}, fmt.Errorf("find tenant by id: %w", err)
	}

	return tenant, nil
}

func (r *TenantRepository) ResolveByDomain(
	ctx context.Context,
	domain string,
) (*TenantRecord, error) {
	hostOnly := domain
	if idx := strings.Index(hostOnly, ":"); idx != -1 {
		hostOnly = hostOnly[:idx]
	}

	targetSlug := hostOnly
	if strings.HasSuffix(hostOnly, ".localhost") {
		targetSlug = strings.TrimSuffix(hostOnly, ".localhost")
	} else if strings.HasSuffix(hostOnly, ".academyos.local") {
		targetSlug = strings.TrimSuffix(hostOnly, ".academyos.local")
	}

	var tenant TenantRecord
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, name, slug, description, logo_url, favicon_url, primary_color, secondary_color, custom_domain
		FROM tenants
		WHERE slug = $1 OR custom_domain = $2
		`,
		targetSlug,
		hostOnly,
	).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Description,
		&tenant.LogoURL,
		&tenant.FaviconURL,
		&tenant.PrimaryColor,
		&tenant.SecondaryColor,
		&tenant.CustomDomain,
	)

	if err != nil {
		return nil, fmt.Errorf("resolve tenant by domain: %w", err)
	}

	return &tenant, nil
}
