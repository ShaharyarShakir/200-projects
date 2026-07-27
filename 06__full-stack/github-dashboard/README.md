# GitDash - GitHub Analytics Dashboard

GitDash is a premium GitHub analytics and repository insights dashboard built using SvelteKit, TypeScript, TailwindCSS, Drizzle ORM, and PostgreSQL.

## Getting Started

### 1. Installation

Install the project dependencies using `pnpm`:

```sh
pnpm install
```

### 2. Run PostgreSQL Database

Start the local PostgreSQL container using Docker Compose:

```sh
pnpm run db:start
# or run in the background:
docker compose up -d
```

This runs a local PostgreSQL instance on port `5432` with username `root` and password `mysecretpassword`, initialized with a database named `local`.

### 3. Environment Setup

Copy the example environment file and configure any client credentials:

```sh
cp .env.example .env
```

The database connection string in `.env` is preconfigured to match the local Docker container:

```env
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
```

### 4. Generate & Run Database Migrations

Generate the Drizzle migrations based on the schema definitions:

```sh
pnpm run db:generate
```

Push the schema definitions directly to your database (recommended for development):

```sh
pnpm run db:push
# or run standard migrations
pnpm run db:migrate
```

### 5. Seed the Database

Seed the database with 5 sample repositories representing various codebases (TypeScript, Rust, Go, Python, Svelte) and metric counts:

```sh
pnpm run db:seed
```

### 6. Start Development Server

Launch the local Vite development server:

```sh
pnpm run dev -- --open
```

Navigate to [http://localhost:5173/dashboard](http://localhost:5173/dashboard) to view your dynamic repository insights dashboard.
