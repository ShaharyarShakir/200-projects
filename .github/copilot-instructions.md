# Copilot instructions for this repository

## Repository shape

This repository is a collection of independent projects, not a single app or monorepo. Most work happens inside a specific project folder such as `06__full-stack/event-planner`, `04__ai/document_copilot`, `08__desktop-apps/utype`, or `05__backend/fastapi_blog`.

Important repo-wide rules:
- There is no root-level `package.json` and no shared build/test pipeline.
- Each project has its own stack, package manager, and commands.
- Many sub-projects have their own `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, or similar instructions; follow those before editing code.
- Root `AGENTS.md` applies as the repo-wide default, but project-local instructions override it when present.

## Environment and setup

Use the repo's environment tooling when available:
- `mise install` after entering the shell to install the configured runtimes
- `devbox` for reproducible tooling when a project expects it
- `pnpm`, `bun`, or `npm` based on the lockfile in the target project; do not guess the package manager

Before editing a project, check:
1. The nearest `AGENTS.md` or `CLAUDE.md`
2. `package.json`, `pyproject.toml`, or `go.mod`
3. README instructions for local setup and common workflows

## Build, test, and lint commands

Most projects are self-contained and expose their commands in the local `package.json`/tool config. Use the project-level scripts instead of repo-root commands.

Common patterns in this repo:

- JavaScript/TypeScript apps (Next.js/Vite/Nuxt/React):
  - Install dependencies: `pnpm install`, `bun install`, or `npm install` depending on the project
  - Run the app: `pnpm dev`, `bun run dev`, or `npm run dev`
  - Build: `pnpm build`, `bun run build`, or `npm run build`
  - Lint: `pnpm lint`, `bun run lint`, or `npm run lint`
  - Test: `pnpm test`, `bun test`, `vitest run`, or `jest`

- Single test examples:
  - Vitest: `pnpm vitest run path/to/file.test.ts` or `npx vitest run path/to/file.test.ts`
  - Jest: `pnpm jest path/to/file.test.ts --runInBand` or `npx jest path/to/file.test.ts --runInBand`
  - Pytest: `uv run pytest tests/test_file.py -q` or `pytest tests/test_file.py -q`
  - Go: `go test ./...` or `go test ./path/to/package -run TestName`

- Python/FastAPI apps:
  - Usually use `uv` and `pyproject.toml`
  - Example: `uv sync` then `uv run pytest` or `uv run pytest tests/test_example.py -q`
  - Some projects add `pytest` markers for integration tests; prefer `-m "not integration"` for the fast suite

- Go services:
  - Standard `go.mod` projects; install deps with `go mod download`
  - Run tests: `go test ./...`
  - Run a single test: `go test ./... -run TestName` or `go test ./internal/foo -run TestName`

- Nx workspaces:
  - Use `nx` commands from the workspace root, not raw package scripts if the project is set up as an Nx app

## Architecture snapshot

The repo is organized by stack and project type, not by a single shared application architecture.

High-level patterns that recur across the codebase:

- `01_Vanilla-JS`: small DOM/JS practice apps with minimal tooling and no build system
- `02__tailwindcss`: Tailwind demos on Vite or similar frontend toolchains
- `03__microservices`: multi-service systems that use separate package/service folders and shared packages
- `04__ai`: AI and agent projects, often combining frontend + backend, sometimes with FastAPI or Next.js
- `05__backend`: Go, FastAPI, and Node backend projects, often single-service apps
- `06__full-stack`: full-stack applications with patterns such as `apps/web` + `apps/api`, `frontend` + `backend`, or `client` + `server`
- `07__frontend`: frontend-only apps, often Vite or Astro
- `08__desktop-apps`: Electron/Tauri or native desktop tooling projects
- `demo-emdash`: a standalone CMS/blog template project with its own local instructions

Cross-project architecture conventions:
- Most apps are self-contained and can be opened directly in their project folder.
- Full-stack projects often split UI and API responsibilities into sibling folders instead of a single app root.
- Backend projects frequently use FastAPI, Express, NestJS, or Go; frontend projects frequently use Vite, Next.js, Nuxt, or Astro.
- AI projects often mix local frontends with Python or TypeScript API services and may require env vars or external service credentials.
- Some projects are intentionally incomplete or "in progress"; do not assume they represent a finished product.

## Key conventions specific to this repo

- Check project-local instructions before code changes; many projects already define working patterns and constraints.
- Match the package manager to the project lockfile or manifest rather than assuming `npm` or `pnpm`.
- Treat the repo as a collection of independent apps with no root smoke test; validate in the relevant app directory.
- Read the local README and package scripts before making changes. Many project setups differ significantly even inside the same category.
- Keep filesystem references accurate; directory names are inconsistent (`01_Vanilla-JS`, `04__ai`, `06__full-stack`, `demo-emdash`, etc.).
- For Next.js projects in this repository, assume you may need to check framework docs because versions may differ from model training assumptions.
- For Nuxt projects, generate `.nuxt/` or run the app build/dev flow first when type-checking or server bootstrapping is required.
- For Docker-based or external-service projects, verify whether Postgres/Redis/Mongo or similar services are required before assuming a local app can run standalone.
- When a project uses a database or AI service, check whether tests are integration-only and should be excluded from the default fast suite.

## Practical workflow

When working in this repo:
1. Identify the exact project you are changing.
2. Read that project's local instructions and README.
3. Determine the correct package manager and scripts from the local manifest.
4. Run the smallest relevant command: local dev server, targeted build, lint, or single-test invocation.
5. Keep changes scoped to the project being edited.

## Examples

Examples of typical commands in this repository:

- Next.js app: `cd 06__full-stack/event-planner && pnpm install && pnpm dev`
- Nuxt app: `cd 06__full-stack/my-tiny-apps && bun install && bun run dev`
- FastAPI app: `cd 05__backend/fastapi_blog && uv sync && uv run pytest`
- Go service: `cd 05__backend/url-shortener && go test ./...`
- Vite app: `cd 06__full-stack/shop-stack && pnpm install && pnpm test`

These examples are illustrative; always verify the exact scripts in the target project before running commands.
