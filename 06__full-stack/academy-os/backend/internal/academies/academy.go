package academies

import (
	"context"
)

type Academy struct {
	ID           string  `json:"id"`
	OwnerUserID  string  `json:"owner_user_id"`
	Name         string  `json:"name"`
	Slug         string  `json:"slug"`
	Subdomain    string  `json:"subdomain"`
	CustomDomain *string `json:"custom_domain"`
	Status       string  `json:"status"`
}

type academyCtxKey struct{}

var contextKey = academyCtxKey{}

func WithContext(ctx context.Context, academy *Academy) context.Context {
	return context.WithValue(ctx, contextKey, academy)
}

func FromContext(ctx context.Context) (*Academy, bool) {
	academy, ok := ctx.Value(contextKey).(*Academy)
	return academy, ok
}
