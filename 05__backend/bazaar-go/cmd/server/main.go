package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ShaharyarShakir/bazaar-go/internal/config"
)

func main()  {
	cfg := config.Load()

	server := &http.Server{
		Addr: ":" + cfg.Port,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("BazaarGo API"))
		}),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,

	}
	serverErrors := make(chan error, 1)

	go func() {
		log.Printf("HTTP server listening on %s", cfg.Port)

		serverErrors <- server.ListenAndServe()
	}()
	shutdown := make(chan os.Signal, 1)

	signal.Notify(
		shutdown,
		os.Interrupt,
		syscall.SIGTERM,
	)

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}

	case sig := <-shutdown:
		log.Printf("shutdown signal received: %s", sig)

		ctx, cancel := context.WithTimeout(
			context.Background(),
			10*time.Second,
		)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("graceful shutdown failed: %v", err)
			server.Close()
		}
	}

	log.Println("server stopped")

}