package domains

import (
	"context"
	"errors"
	"strings"

	"github.com/ShaharyarShakir/academy-os/internal/academies"
)

var (
	ErrAcademyNotFound = errors.New(
		"academy not found",
	)

	ErrInvalidHostname = errors.New(
		"invalid hostname",
	)
)

type Repository interface {
	FindBySubdomain(
		ctx context.Context,
		subdomain string,
	) (*academies.Academy, error)

	FindByCustomDomain(
		ctx context.Context,
		domain string,
	) (*academies.Academy, error)
}

type Resolver struct {
	repository Repository
}

func NewResolver(
	repository Repository,
) *Resolver {
	return &Resolver{
		repository: repository,
	}
}

func (r *Resolver) Resolve(
	ctx context.Context,
	host string,
) (*academies.Academy, error) {
	if idx := strings.Index(host, ":"); idx != -1 {
		host = host[:idx]
	}

	host = strings.ToLower(
		strings.TrimSpace(host),
	)

	// Custom domain takes precedence.
	academy, err :=
		r.repository.FindByCustomDomain(
			ctx,
			host,
		)

	if err == nil && academy != nil {
		return academy, nil
	}

	// Local/platform subdomain.
	subdomain, ok :=
		extractSubdomain(host)

	if !ok {
		return nil, ErrAcademyNotFound
	}

	return r.repository.FindBySubdomain(
		ctx,
		subdomain,
	)
}

func extractSubdomain(
	host string,
) (string, bool) {
	const suffix =
		".academyos.local"

	if !strings.HasSuffix(
		host,
		suffix,
	) {
		return "", false
	}

	subdomain :=
		strings.TrimSuffix(
			host,
			suffix,
		)

	if subdomain == "" ||
		subdomain == "app" {
		return "", false
	}

	return subdomain, true
}
