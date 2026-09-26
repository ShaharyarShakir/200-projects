# Verification Notes

Recorded during implementation of `resilience-and-auth-hardening`.

## 8.1 Backend suite — PASS

`cd backend && uv run pytest -q` → **203 passed**.

No previously passing test was skipped or errored. The suite grew from 159 to
203 as groups 1-7 added coverage; the pre-existing tests all still pass.

## 8.2 Frontend suite — PASS

`cd frontend && pnpm test` → **14 files, 101 passed**.

Stable across repeated full-suite runs.

## 8.3 Lint / type check — SKIPPED (tools not configured)

`uv run ruff check app tests` and `uv run mypy app` were **not run**: neither
tool is configured in this project.

- `backend/pyproject.toml` has no `[tool.ruff]` or `[tool.mypy]` section.
- The `dev` dependency group contains only `pytest`, `pytest-asyncio`,
  `httpx`, `aiosqlite`, and `respx` — no `ruff`, no `mypy`.
- There is no `ruff.toml`, `.ruff.toml`, `mypy.ini`, `setup.cfg`, or `tox.ini`
  anywhere in `backend/`.
- `uv run ruff` fails with `Failed to spawn: ruff / No such file or directory`.

Adding either tool would introduce a project-wide convention that this change
does not own, so the task's documented skip path was taken instead.

Frontend type safety is still enforced: `pnpm exec tsc --noEmit` is clean and
`pnpm build` type-checks during the production build (see 8.4).

## 8.4 Production build — PASS

`cd frontend && pnpm build` → compiled successfully, all 7 routes generated,
`Linting and checking validity of types` stage passed.

### Pre-existing issue found (not caused by this change)

The build prints a non-fatal ESLint error:

```
ESLint: Cannot find module '.../eslint-config-next/core-web-vitals' imported
from frontend/eslint.config.mjs
```

`frontend/eslint.config.mjs` imports `eslint-config-next/core-web-vitals`
without the `.js` extension that the installed package requires, so
`pnpm lint` fails for reasons unrelated to this change. That file is untracked
and was not modified here. The production build still succeeds because Next
treats the lint step as non-fatal. Fixing it is a separate concern.

## 8.5 Manual verification — PARTIAL

Performed against a real `uvicorn` server on `127.0.0.1:8123` using the real
`backend/bisect.db` (SQLite, at Alembic head `b7e2c4a91d38`).

Verified live:

- `GET /health` → `200 {"status":"ok","service":"bisect-backend"}`.
- `GET /api/v1/repositories` with no token → `401`, unchanged behaviour.
- **Shared repository produces one row per user.** Seeded GitHub repo id
  `555001` for two users. Two rows were accepted under the new composite
  constraint. Through the live API, user A saw `total: 2`
  (`shared/live_user_a-view`, `a/only-mine`) and user B saw `total: 1`
  (`shared/live_user_b-view`) — each user sees only their own row.
- **Upstream error mapping.** `POST /api/v1/repositories/sync` with an invalid
  GitHub token returned
  `401 {"detail":"GitHub API error 401: Bad credentials","code":"GitHubAuthError"}`
  and made **exactly one** upstream call, confirming a 401 is not retried.
- **Secret sanitization.** `grep` over the server log found zero occurrences of
  the access token and no `Authorization` header, while tracebacks were still
  logged in full.

Not performed: the interactive GitHub OAuth sign-in in a browser. That needs
real GitHub OAuth app credentials and a browser session, which are not
available in this environment. The behaviours it would cover are instead
covered by automated tests:

| Behaviour | Test |
|---|---|
| Deep-link redirect while signed out | `frontend/src/test/require-auth.test.tsx` |
| Post-login return to the intended page | `frontend/src/test/auth-callback.test.tsx` |
| No authenticated request before auth resolves | `frontend/src/test/workspace-auth-guard.test.tsx` |
| Off-origin `next` rejection | `frontend/src/test/routes.test.ts` |

Test data seeded into `bisect.db` during this check was removed afterwards;
the database was returned to its original 1 user / 0 repositories.

## 8.6 OpenSpec validation — PASS

`openspec validate resilience-and-auth-hardening --strict` → valid, with the
three capability deltas present:

- `specs/backend-foundation/spec.md`
- `specs/github-integration/spec.md`
- `specs/frontend-workspace-ui/spec.md`

## Bugs this verification caught

1. **Partial syncs were being committed on SQLite.** Per-repository savepoints
   with no outer barrier meant the outermost `RELEASE SAVEPOINT` committed each
   row as it went, so a mid-loop failure left a partial repository set behind
   and the later `rollback()` had nothing to undo. Fixed by holding a savepoint
   open across the loop. Caught by
   `backend/tests/test_repository_sync_service.py::test_mid_loop_failure_commits_nothing`.
2. **The auth guard did not stop the workspace fetch.** Wrapping the page's
   returned JSX in `RequireAuth` still ran the page component's own
   `useEffect`, so repositories were fetched before auth resolved. Fixed by
   moving the page body into a `*Content` component that the guard wraps, so the
   fetching component does not mount. Caught by
   `frontend/src/test/workspace-auth-guard.test.tsx`.

## Test-suite stability

`frontend/src/test/workspace-page.test.tsx` had a pre-existing flaky assertion:
the `useSessionPoll` rejection can land after `waitFor`'s 1s default under
parallel load. Confirmed timing-related by reproducing a stable baseline in a
scratch copy with this change's tests removed. The assertion's timeout was
widened to 5s; no behaviour was changed.

## Observation, not changed

`app/core/db.py` logs a full traceback from its `except` clause for *every*
exception, including handled `BisectError`s that the global handler in
`app/main.py` already logs with a traceback. A single sync failure therefore
produces two tracebacks. This is pre-existing and outside the scope of this
change, but is worth a follow-up.
