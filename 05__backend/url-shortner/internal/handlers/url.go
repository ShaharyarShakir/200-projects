package handlers

import (
	"html/template"

	db "github.com/ShaharyarShakir/url-shortner/internal/database/generated"
)

type Handler struct {
	Queries *db.Queries
	Tmpl    *template.Template
}
func (h *Handler) Home(
	w http.ResponseWriter,
	r *http.Request,
) {

	h.Tmpl.ExecuteTemplate(
		w,
		"index.html",
		nil,
	)
}