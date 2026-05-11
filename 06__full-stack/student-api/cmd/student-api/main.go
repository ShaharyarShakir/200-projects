package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ShaharyarShakir/student-api/internal/config"
	"github.com/ShaharyarShakir/student-api/internal/http/handlers/student"
)

func main() {

	// load config
	cfg := config.MustLoad()
	// setup logger
	// database setup
	// setup router
	router := http.NewServeMux()
	router.HandleFunc("POST /api/students", student.New())

	server := http.Server{
		Addr:    cfg.Addr,
		Handler: router,
	}
	slog.Info("server started on ", slog.String(" ", cfg.Addr))
	fmt.Printf("server started on  %s", cfg.Addr)
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		err := server.ListenAndServe()
		if err != nil {
			log.Fatalf("Failed to start the server: %v", err)
		}
	}()
	<-done
	slog.Info("Shutting down the server")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Error Shutting down the server", slog.String("error: ", err.Error()))
	}
	slog.Info("Server Shutdown successfully")
	// if err != nil {
	// 	slog.Error("Error Shutting down the server", slog.String("error: ", err.Error()))
	// }
}
