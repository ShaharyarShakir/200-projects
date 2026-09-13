# AGENTS.md

## What this repo is

A collection of ~41 independent projects across 8 categories. Each project is self-contained with its own stack, package manager, and dev workflow. There is **no shared build, no monorepo tooling, and no root-level `package.json`** at the repo level.

## Directory layout

| Directory | Contents |
|---|---|
| `01_Vanilla-JS/` | Pure JS/HTML/CSS projects (no build tooling) |
| `02__tailwindcss/` | Tailwind CSS demos (Vite + npm) |
| `03__microservices/` | Nx workspaces with pnpm |
| `04__ai/` | AI projects — FastAPI, Next.js, Vite+React |
| `05__backend/` | Backend projects — Go, FastAPI, Node |
| `06__full-stack/` | Full-stack apps — Next.js, Nuxt, Express+React, Go+React |
| `07__frontend/` | Frontend-only — React, Astro, portfolio sites |
| `08__desktop-apps/` | Electron/Tauri desktop apps |
| `demo-emdash/` | EmDash CMS blog template (Astro) |

## Dev environment

- **Devbox** for reproducible toolchains (installed via `.envrc` direnv integration)
- **Mise** manages runtime versions: `bun`, `go`, `node`, `uv`
- **Dev Container** available (Node 22 + Bookworm) — see `.devcontainer/devcontainer.json`
- Run `mise install` after entering the shell to ensure toolchains are available

## Before editing any project

1. **Read the project's own `AGENTS.md` or `CLAUDE.md` first.** Many sub-projects have agent-specific instructions (e.g., `demo-emdash/AGENTS.md`, `04__ai/document_copilot/AGENTS.md`, `06__full-stack/my-tiny-apps/AGENTS.md`). These override any general guidance here.
2. **Check which package manager the project uses.** Most use `pnpm`, some use `bun` or `npm`. Look at the lockfile (`pnpm-lock.yaml`, `bun.lockb`, `package-lock.json`) to determine which — never guess.
3. **Check the project's `package.json` scripts** for dev/build/lint/test commands. There are no repo-wide scripts.

## Common patterns

- **Next.js projects** (`event-planner`, `eraser.io`): Read `node_modules/next/dist/docs/` before writing code — this repo's Next.js versions may have breaking changes vs training data.
- **Nuxt projects** (`my-tiny-apps`): Type-checking requires `.nuxt/` — run `bun run dev` or `bun run build` first.
- **Docker projects**: Many full-stack apps have `docker-compose.yml` or `compose.yaml`. Check if a project needs external services (Postgres, Redis, MongoDB) before assuming it runs standalone.
- **Nx workspaces** (`03__microservices/`): Use `nx` commands, not raw `npm`/`pnpm` — the workspace manages shared deps and affected targets.
- **Go projects** (`bazaar-go`, `serverpilot`): Use `go` commands; some have `Makefile` targets.

## Gotchas

- The root `.gitignore` excludes `node_modules`, `.devbox`, `.env`, `tmp/`, `.fake`. Individual projects may have their own `.gitignore` — check before assuming what's tracked.
- Many projects are "In Progress" per `Readme.md` — expect incomplete or broken states.
- Sub-project names use inconsistent casing and separators (`01_Vanilla-JS` vs `04__ai` vs `demo-emdash`). Match the exact casing when referencing paths.
- The `devconatiner-features.sh` file is misspelled (note: no "a" in "container"). It's the actual script, not a typo to fix.
