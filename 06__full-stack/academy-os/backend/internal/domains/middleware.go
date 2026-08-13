package domains

import (
	"net/http"

	"github.com/ShaharyarShakir/academy-os/internal/academies"
)

type Middleware struct {
	resolver *Resolver
}

func NewMiddleware(resolver *Resolver) *Middleware {
	return &Middleware{resolver: resolver}
}

func (m *Middleware) ResolveAcademy(
	next http.Handler,
) http.Handler {
	return http.HandlerFunc(
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {
			academy, err :=
				m.resolver.Resolve(
					r.Context(),
					r.Host,
				)

			if err != nil {
				http.Error(
					w,
					"academy not found",
					http.StatusNotFound,
				)
				return
			}

			ctx :=
				academies.WithContext(
					r.Context(),
					academy,
				)

			next.ServeHTTP(
				w,
				r.WithContext(ctx),
			)
		},
	)
}
