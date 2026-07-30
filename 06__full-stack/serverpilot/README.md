# ServerPilot Monorepo

ServerPilot is a production-ready monorepo application to manage and monitor cluster nodes. It features a Go HTTP backend API and a SvelteKit SPA frontend client.

## Tech Stack

### Frontend (`apps/web`)
*   **SvelteKit (v5)**: Single Page App (SPA) mode utilizing runes (`$state`, `$derived`, `$props`).
*   **TypeScript**: Type-safety across state and UI.
*   **Tailwind CSS (v4)**: Sleek glassmorphism look and dark mode styles.
*   **Bits UI**: Headless component primitives.
*   **TanStack Query (v6)**: Remote query caching and fetching state management.
*   **Superforms + Zod**: Highly robust validation schemas and form state binding.

### Backend (`apps/api`)
*   **Go (v1.26)**: Highly concurrent Go backend.
*   **Gorilla Mux**: Clean routing mapping.
*   **Turso (libSQL)**: Light, serverless SQL driver supporting local SQLite databases out-of-the-box.
*   **JWT Authentication**: Dual-token authorization (short-lived access tokens, database-backed refresh token cookie sessions).
*   **Bcrypt**: Robust password salting and hashing.
*   **Middlewares**: Tracer (Request ID), Logger, Panic Recovery, CORS credentials handler, and Auth interceptors.

---

## Directory Structure

```
.
├── apps/
│   ├── api/                  # Go Backend Service
│   │   ├── auth/             # Token signing and validation
│   │   ├── config/           # Config loading
│   │   ├── database/         # SQLite connect & migration engine
│   │   ├── handlers/         # HTTP routers
│   │   ├── middleware/       # Recovery, loggers, cors, auth
│   │   ├── models/           # DB schemas & response structs
│   │   ├── repository/       # Direct DB actions (SQL)
│   │   ├── services/         # Core business logic
│   │   └── main.go           # Server setup & shutdown hooks
│   │
│   └── web/                  # SvelteKit Frontend
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/ # Reusable UI pieces (Buttons, Inputs, Cards)
│       │   │   ├── api.ts      # Typed API client with auto-refresh
│       │   │   ├── auth.svelte.ts # Runes global auth session store
│       │   │   └── toast.svelte.ts # Runes global notification toast
│       │   └── routes/         # SPA Routing & Layout Guards
│       └── vite.config.ts    # Tailwind v4 plugin + Adapter Node config
│
├── Makefile                  # Orchestration task automation
├── docker-compose.yml        # Service multi-container builds
├── package.json              # Bun monorepo workspaces layout
└── README.md
```

---

## Getting Started

### Prerequisites
Make sure you have the following installed locally:
*   [Go](https://go.dev/doc/install) (v1.26 or newer)
*   [Bun](https://bun.sh/) (v1.1 or newer)
*   [Docker & Docker Compose](https://docs.docker.com/engine/install/) (Optional for container runs)

### Local Environment Setup
Create configurations for both apps. The default values will run out-of-the-box in development.

1.  **Backend Environment (`apps/api/.env`)**:
    ```env
    PORT=8080
    DB_URL=file:serverpilot.db
    DB_AUTH_TOKEN=
    JWT_ACCESS_SECRET=super_secret_access_key_12345!
    JWT_REFRESH_SECRET=super_secret_refresh_key_98765!
    ALLOWED_ORIGIN=http://localhost:5173
    ENV=development
    ```
2.  **Frontend Environment (`apps/web/.env`)**:
    ```env
    PUBLIC_API_URL=http://localhost:8080
    ```

### Command Execution (Makefile)

The project includes a root `Makefile` to quickly manage common development tasks:

*   **Install dependencies**:
    ```bash
    bun install
    ```
*   **Run Development Servers Concurrently**:
    This spins up the Go API (listening on `http://localhost:8080`) and SvelteKit client (listening on `http://localhost:5173`):
    ```bash
    make dev
    ```
*   **Verify Code Quality (Formatters & Linters)**:
    ```bash
    make lint
    ```
*   **Compile Production Builds Locally**:
    ```bash
    make build
    ```
*   **Launch Docker Compose Services**:
    This spins up both apps inside a containerized setup, exposing the frontend at `http://localhost:3000` and API at `http://localhost:8080`:
    ```bash
    make docker-up
    ```
*   **Teardown Containers**:
    ```bash
    make docker-down
    ```
*   **Clean Build Files & Database**:
    ```bash
    make clean
    ```

---

## Auth REST API Documentation

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <access_token>`.

| Route | Method | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Public | `{ "email": "...", "password": "..." }` | Creates user, sets HTTP-only refresh cookie, returns access token. |
| `/auth/login` | `POST` | Public | `{ "email": "...", "password": "..." }` | Verifies user, sets HTTP-only refresh cookie, returns access token. |
| `/auth/logout` | `POST` | Public | *None* | Revokes refresh token in database, purges HTTP-only cookie. |
| `/auth/refresh` | `POST` | Public | *Cookie-based* | Reads refresh cookie, issues new access token. |
| `/auth/me` | `GET` | Protected | *None* | Returns active authenticated user session payload. |
