# Forkdevs — Development Guide

## Stack

Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (radix).

**Design:** Dark graphite (`#111`) + signal yellow (`#F5C542`). Inter font.

## Package Manager

This project uses **pnpm** exclusively. Never use npm, yarn, or bun.

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

## Branch Strategy

```
main
  └── develop
       ├── feature/hero-services
       ├── feature/work
       ├── feature/process-team
       └── feature/contact
```

- `main` — production-ready code
- `develop` — integration branch
- `feature/*` — feature worktrees

## Worktrunk Workflow

This project uses [Worktrunk](https://worktrunk.dev) for parallel development via Git worktrees.

### Commands

```bash
wt list                          # Show all worktrees
wt switch --create feature/name  # Create and switch to new feature
wt switch feature/name           # Switch to existing feature
wt switch -                      # Switch to previous worktree
wt merge develop                 # Merge current branch into develop
wt remove                        # Remove current worktree and branch
```

### Creating a feature

```bash
wt switch --create feature/name --base develop
```

### Finishing a feature

```bash
wt merge develop
```

Worktrunk runs pre-merge hooks (lint, typecheck, build) automatically.

## Feature Ownership

| Branch                  | Owns                                               |
| ----------------------- | -------------------------------------------------- |
| `feature/hero-services` | `src/components/hero/`, `src/components/services/` |
| `feature/work`          | `src/components/work/`                             |
| `feature/process-team`  | `src/components/process/`, `src/components/team/`  |
| `feature/contact`       | `src/components/contact/`                          |

**Rules:**

- Do not modify another feature's files
- Shared components live in `src/components/ui/` and `src/components/layout/`
- Design tokens live in `src/app/globals.css`
- Modify the root page only when necessary for integration

## Quality Gates

Code passes through these stages before merging:

```
Claude Code
    ↓
Husky local validation (pre-commit, pre-push)
    ↓
Claude /code-review
    ↓
CodeRabbit PR review
    ↓
GitHub Actions CI
    ↓
Merge into develop
```

### Stage 1: Claude Code

Implementation and initial self-review.

### Stage 2: Husky Local Validation

**Pre-commit** (fast):

- `lint-staged` — Prettier formatting + ESLint on staged files

**Pre-push** (deep):

- `pnpm typecheck` — TypeScript type checking
- `pnpm build` — Next.js production build

### Stage 3: Claude /code-review

Mandatory review before opening a PR. Inspects:

- Architecture compliance
- TypeScript safety
- React/Next.js correctness
- UI consistency and accessibility
- Scope discipline

### Stage 4: CodeRabbit Review

Automated PR review via CodeRabbit. Issues must be resolved before merge.

### Stage 5: GitHub Actions CI

Runs on PRs and pushes to `develop`/`main`:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

### Stage 6: Merge

After all checks pass, merge into `develop` via `wt merge develop` or GitHub merge.

## PR Expectations

Pull requests should include:

- Description of what changed and why
- Screenshots for UI changes
- Confirmation that lint, typecheck, and build pass
- Known limitations

## Conventional Commits

Use conventional commit messages:

```
feat: add hero section
feat: add services section
fix: correct mobile hero spacing
refactor: extract section heading
chore: update development tooling
```

## CodeRabbit Integration

CodeRabbit reviews PRs automatically when configured on the repository. The intended flow:

1. Developer creates PR
2. GitHub Actions CI runs
3. CodeRabbit reviews PR
4. Issues are fixed
5. Claude `/code-review` runs
6. Human review
7. Merge

## Local Validation

Before committing, always run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## File Structure

```
src/
├── app/              # Next.js pages and layouts
├── components/
│   ├── ui/           # Shared UI primitives (Button, etc.)
│   ├── layout/       # Layout components (Container, Section, etc.)
│   ├── hero/         # Hero feature
│   ├── services/     # Services feature
│   ├── work/         # Work feature
│   ├── process/      # Process feature
│   ├── team/         # Team feature
│   └── contact/      # Contact feature
├── data/             # Typed data files
└── lib/              # Utilities
```
