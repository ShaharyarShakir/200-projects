package main

import (
	"fmt"
	"net/http"
)

func main() {

	http.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w,
			`<!DOCTYPE html>
<html>
<head>
	<title>TaskBoard</title>
	<script src="https://unpkg.com/htmx.org@2.0.9"></script>
</head>
<body>
	<h1>Welcome to TaskBoard</h1>
	<button hx-get="/hello" hx-target="#output">Click me</button>
<div id="output"></div>	
</body>
</html>`)

	})
	http.HandleFunc("GET /hello", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `<p>Hello from the server</p>`)
	})
	fmt.Println("Server is running on http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
