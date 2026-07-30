.PHONY: dev dev-api dev-web build build-api build-web lint lint-api lint-web docker-up docker-down clean help

help:
	@echo "ServerPilot Development Makefile Commands:"
	@echo "  make dev         Run both API (Go) and web (SvelteKit) in development mode concurrently"
	@echo "  make dev-api     Run Go API only"
	@echo "  make dev-web     Run SvelteKit web client only"
	@echo "  make build       Build both API and web client for production"
	@echo "  make lint        Format and lint both backend and frontend"
	@echo "  make docker-up   Build and start containers in detached mode"
	@echo "  make docker-down Stop and remove containers"
	@echo "  make clean       Remove build artifacts, dependencies, and temporary SQLite databases"

dev:
	@echo "Starting development servers..."
	@make -j2 dev-api dev-web

dev-api:
	@echo "Starting Go API..."
	@cd apps/api && go run main.go

dev-web:
	@echo "Starting SvelteKit frontend..."
	@cd apps/web && bun run dev

build: build-api build-web

build-api:
	@echo "Building Go API..."
	@mkdir -p bin
	@cd apps/api && go build -o ../../bin/api main.go

build-web:
	@echo "Building SvelteKit frontend..."
	@cd apps/web && bun run build

lint: lint-api lint-web

lint-api:
	@echo "Vetting and formatting Go code..."
	@cd apps/api && go fmt ./... && go vet ./...

lint-web:
	@echo "Linting frontend..."
	@cd apps/web && bun run lint

docker-up:
	@echo "Building and starting Docker services..."
	docker-compose up --build -d

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

clean:
	@echo "Cleaning up..."
	@rm -rf bin/
	@rm -rf apps/api/bin/
	@rm -f apps/api/serverpilot.db*
	@rm -rf apps/web/.svelte-kit/
	@rm -rf apps/web/build/
	@rm -rf apps/web/node_modules/
	@rm -rf node_modules/
	@rm -f bun.lock
