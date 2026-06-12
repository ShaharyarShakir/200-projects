package main

import (
	"html/template"
	"log"
	"net/http"

	"github.com/ShaharyarShakir/url-shortener/internal/database"
	db "github.com/ShaharyarShakir/url-shortener/internal/database/generated"
	"github.com/ShaharyarShakir/url-shortener/internal/handlers"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	conn, err := database.Connect()

	if err != nil {
		log.Fatal(err)
	}

	queries := db.New(conn)

	tmpl := template.Must(
		template.ParseGlob(
			"web/templates/*.html",
		),
	)

	h := &handlers.Handler{
		Queries: queries,
		Tmpl:    tmpl,
	}

	http.HandleFunc("/", h.Home)
	http.HandleFunc("/shorten", h.Shorten)
	http.HandleFunc("/r/", h.Redirect)

	fs := http.FileServer(
		http.Dir("./web/static"),
	)

	http.Handle(
		"/static/",
		http.StripPrefix(
			"/static/",
			fs,
		),
	)

	log.Println("Server running :3000")

	log.Fatal(
		http.ListenAndServe(
			":3000",
			nil,
		),
	)
}
