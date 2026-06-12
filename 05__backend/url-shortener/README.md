# URL Shortener

A lightweight, fast URL Shortener built with **Go**, **HTMX**, and **Turso (libSQL)**. It uses Go's standard library `net/http` for routing and `html/template` for rendering.

## Features

- **URL Shortening**: Instantly generate short aliases for long URLs.
- **Redirection**: Seamlessly redirect users from the shortened URL to the original destination.
- **Dynamic UI**: Uses HTMX to submit the form asynchronously and swap in the shortened URL result without a full page reload.
- **Cloud Database**: Persists data in a Turso (libSQL) database.
- **Hot Reloading**: Configured with Air for a fast local developer feedback loop.

---

## Tech Stack

- **Backend**: Go (Golang)
- **Frontend**: HTMX, HTML, Vanilla CSS
- **Database**: Turso (libSQL)
- **Query Builder**: SQLC (for compile-time safe SQL queries)

---

## Getting Started

### 1. Prerequisites
- [Go](https://go.dev/) (version 1.26 or later recommended)
- [Turso CLI](https://docs.turso.tech/cli) (optional, to manage your database)

### 2. Configuration
Create a `.env` file in the root directory and add your Turso credentials:

```env
TURSO_DATABASE_URL="libsql://your-db-name-your-username.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
```

### 3. Initialize the Database
Ensure the `urls` table exists in your Turso database. You can execute the SQL schema from [schema.sql](schema.sql):

```sql
CREATE TABLE urls (
    id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_url TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Run the Application
You can start the server in two ways:

#### With Air (Hot Reloading)
If you have [Air](https://github.com/air-verse/air) installed:
```bash
air
```

#### Standard Go Run
```bash
go run cmd/server/main.go
```

The server will start at: **`http://localhost:3000`**

---

## Development

### Generating Database Code (SQLC)
If you modify [schema.sql](schema.sql) or the query definitions under `internal/database/queries.sql`, regenerate the Go database queries by running:
```bash
sqlc generate
```

### Project Structure

```text
├── .air.toml                  # Air configuration for hot reload
├── .env                       # Environment variables (Database URL & Token)
├── cmd/
│   └── server/
│       └── main.go            # Application entrypoint & HTTP server definition
├── go.mod                     # Go module dependencies
├── internal/
│   ├── database/              # Database connection & SQLC generated code
│   └── handlers/              # HTTP handlers (Home, Shorten, Redirect)
├── schema.sql                 # Database table schema definition
├── sqlc.yaml                  # SQLC generator configuration
└── web/
    ├── static/                # Static assets (CSS styles)
    └── templates/             # HTML templates (HTMX pages)
```
