package handlers

import (
	"html/template"
	"net/http"
	"strings"

	db "github.com/ShaharyarShakir/url-shortener/internal/database/generated"
	"github.com/google/uuid"
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

func GenerateShortURL() string {

	return uuid.NewString()[:8]
}

func (h *Handler) Shorten(
	w http.ResponseWriter,
	r *http.Request,
) {

	err := r.ParseForm()

	if err != nil {
		http.Error(w, "Bad Request", 400)
		return
	}

	originalURL := r.FormValue("url")

	shortURL := GenerateShortURL()

	_, err = h.Queries.CreateURL(
		r.Context(),
		db.CreateURLParams{
			ID:          shortURL,
			OriginalUrl: originalURL,
			ShortUrl:    shortURL,
		},
	)

	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	data := struct {
		ShortURL string
	}{
		ShortURL: shortURL,
	}

	h.Tmpl.ExecuteTemplate(
		w,
		"result.html",
		data,
	)
}

func (h *Handler) Redirect(
	w http.ResponseWriter,
	r *http.Request,
) {

	short := strings.TrimPrefix(
		r.URL.Path,
		"/r/",
	)

	urlRecord, err := h.Queries.GetURL(
		r.Context(),
		short,
	)

	if err != nil {

		http.NotFound(w, r)
		return
	}

	http.Redirect(
		w,
		r,
		urlRecord.OriginalUrl,
		http.StatusFound,
	)
}
