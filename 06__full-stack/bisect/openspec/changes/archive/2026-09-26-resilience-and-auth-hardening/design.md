# Design

## Context

Constraints that shaped the approach, beyond the motivation in `proposal.md`:

**The `status_code` attribute already means something else.** `BisectError` has
no status attribute today. `GitHubAPIError.status_code` and
`AgentProviderError.status_code` store the **upstream** provider's HTTP status
(`app/services/github.py:78`, `app/services/agent/groq.py:82`). The spec
requires each error class to expose the status **Bisect** returns. These are
different values: GitHub's 403 for a rate limit should surface to the client as
429, and Groq's 401 should surface as 502, not 401. Adding `status_code` to the
base class would silently shadow the subclasses.

Reading every `.status_code` reference under `app/` shows the attribute is
**written but never read** outside `errors.py` — the "read" hits in
`services/sandbox/client.py` and `api/deps.py` are `httpx` response objects and
`HTTPException` kwargs, unrelated. The rename is therefore cheap: six write
sites, zero read sites.

**`github_repo_id` is uniquely indexed, so the ownership fix is a schema change.**
`alembic/versions/461b70848be3_initial_schema.py:52` creates
`ix_repositories_github_repo_id` with `unique=True`, and
`app/models/repository.py:16` declares `unique=True`. A second user syncing a
shared repository therefore cannot get their own row — today the code silently
reassigns ownership instead (`app/services/repository.py:49` sets
`existing_repo.owner_id = user.id`). Fixing the query without fixing the schema
just converts silent data corruption into an `IntegrityError`.

**Every 403 is currently classified as a rate limit.** `_handle_response_error`
(`app/services/github.py:91`) maps all 403s to `GitHubRateLimitError` and
already parses `Retry-After` (`:92-96`). But GitHub uses 403 for three
different conditions: primary rate limit (with `X-RateLimit-Remaining: 0`),
secondary/abuse rate limit (with `Retry-After`), and plain permission denial
(neither header). A blanket retry policy would retry permission denials three
times for nothing and still surface them as 429 to the user.

**No middleware can see the token.** The JWT lives in `localStorage`
(`frontend/src/lib/api/client.ts:18`), which is unreadable in a Next.js
`middleware.ts` edge context. Any guard is necessarily a client-side React
guard, and `AuthContext` only learns whether the session is valid after an
asynchronous `getMe()` call on mount
(`frontend/src/lib/auth/AuthContext.tsx:54-85`). That asynchrony is the reason
the spec requires a loading state and requires that protected pages not fire
data requests before it resolves.

**Test seams already exist.** `backend/tests/conftest.py` provides an
`httpx.AsyncClient` over `ASGITransport` with `get_session` overridden to
in-memory SQLite, and `respx` is a dev dependency — so handler tests, retry
tests, and cross-user isolation tests need no new fixtures. `respx` and
`pytest.raises` will drive the new backend tests; Vitest with jsdom and
Testing Library cover the frontend.

## Goals / Non-Goals

**Goals:**
- One place decides the HTTP status of a domain error, and no route re-maps it.
- Every 4xx/5xx leaves a log record containing the originating stack trace,
  scrubbed of secrets.
- A GitHub rate limit costs the user one bounded wait, not a hard failure; a
  permission denial fails immediately and is labeled correctly.
- A shared repository has an independent record per user, enforced by the
  database rather than by application discipline.
- A signed-out visitor deep-linking to `/workspace` lands on login, and returns
  to the page they wanted after signing in.

**Non-Goals:**
- Not changing the JWT storage model. `localStorage` stays; the token is still
  JS-readable and still XSS-exposed. This change does not make the token safe,
  only the routing honest about it. See `Migration Plan` for the follow-up.
- Not making guards server-enforceable. Until the token moves to a cookie, the
  guard is a UX affordance, not a security boundary. The backend's
  `get_current_user` remains the only real enforcement point.
- Not adopting structured JSON logs. `core/logging.py` imports `json` and never
  uses it; switching formats is a separate change with its own parsing story.
- Not retroactively repairing repository rows that were already reassigned.

## Decisions

### 1. Split the two status meanings: `status_code` is Bisect's, `upstream_status_code` is the provider's

Add `status_code: int = 500` as a **class attribute** on `BisectError` (not an
`__init__` parameter — it is a property of the class, not of the instance), and
override it per subclass. Rename the existing `status_code` constructor
parameter on `GitHubAPIError` and `AgentProviderError` to
`upstream_status_code`.

| Class | `status_code` (returned to client) | `upstream_status_code` |
|---|---|---|
| `BisectError` | 500 | — |
| `OAuthError` | 400 | — |
| `GitHubAPIError` | 502 | GitHub's status |
| `GitHubAuthError` | 401 | 401 |
| `GitHubRateLimitError` | 429 | 403 |
| `GitHubNotFoundError` | 404 | 404 |
| `ActionError`, `ActionParseError`, `ActionValidationError` | 400 | — |
| `InvalidStateTransitionError` | 409 | — |
| `LoopExecutionError` | 500 | — |
| `SandboxError`, `SandboxConnectionError` | 502 | — |
| `SandboxContainerError` | 500 | — |
| `SandboxExecutionError` | 500 | — |
| `SandboxTimeoutError` | 504 | — |
| `AgentProviderError` | 502 | provider's status |
| `AgentAuthenticationError` | 502 | 401 |
| `AgentRateLimitError` | 429 | 429 |

Note `AgentAuthenticationError` deliberately becomes 502, not 401: the client
*is* authenticated to Bisect; a bad Groq key is a server-side misconfiguration
and a 401 would make the frontend's 401 handler log the user out for a problem
they cannot fix.

*Alternatives considered.* (a) Reuse `status_code` for both meanings — rejected,
it collides and the value would mean different things depending on the class.
(b) Add `http_status` alongside the existing `status_code` — rejected: it leaves
two near-identical names, one of which is actively misleading, and invites
future code reading the wrong one. (c) A lookup dict in the handler mapping
class → status — rejected: it duplicates the class hierarchy, and adding a new
error class would silently fall through to a default.

### 2. Register handlers via `app.exception_handler`, and install a logging `Filter` for sanitization

Two handlers in `app/main.py`:
- `@app.exception_handler(BisectError)` — returns
  `JSONResponse(status_code=exc.status_code, content={"detail": exc.message, "code": type(exc).__name__})`,
  logs with `logger.exception`, and sanitizes `exc.message` and any attached
  payload before logging.
- `@app.exception_handler(Exception)` — returns HTTP 500 with a **fixed**
  generic detail (`"An internal server error occurred"`) and the code
  `"InternalServerError"`, logging the full traceback. It must not interpolate
  `exc` into the response.

The status codes come from `status.HTTP_...` constants to match the existing
style in `api/deps.py` and `api/v1/*.py`.

For sanitization, attach a `logging.Filter` to the handlers in
`setup_logging()` that runs the record's message and `args` through the
existing `sanitize_log_data`. This is chosen over sprinkling
`sanitize_log_data` calls at each `logger.exception` site because the
requirement is that *no* error path can leak a secret, and a per-call
convention is one forgotten call away from violating it. A filter is
unconditional and covers code that does not exist yet.

*Alternatives considered.* (a) Sanitize at each call site — rejected, unenforced
and repetitive across ~14 sites. (b) A custom `Logger` subclass — rejected,
larger surface, and a filter is the standard mechanism. (c) Sanitize only in the
exception handlers — rejected, it misses the non-exception error paths in
`services/agent/groq.py` and `core/db.py`.

One caveat is accepted: `logging.Filter.filter` cannot rewrite a record in
place, so the filter emits a **second, sanitized copy** of the record on a
dedicated `bisect.safe` logger and suppresses the original via
`record.msg = ""`. The alternative — mutating `record.msg`/`record.args`
in place — is simpler and is what we do, because the original record has not
been emitted yet at filter time. A test asserts the emitted text contains the
redaction marker.

### 3. Distinguish GitHub 403 subtypes before deciding to retry

`_handle_response_error` gains a `_classify_forbidden` step. On a 403 it reads
both headers and picks the error class:

- `Retry-After` present → `GitHubRateLimitError(retry_after=<parsed>)` —
  secondary/abuse limit, a short wait genuinely helps.
- `X-RateLimit-Remaining == 0` → `GitHubRateLimitError(retry_after=None)` —
  primary limit; the long wait comes from the backoff ceiling, since a
  primary limit may last an hour and retrying is usually futile.
- Neither → a new `GitHubPermissionError(GitHubAPIError)` with
  `status_code = 403` upstream and `status_code = 502` for Bisect. **Not
  retried.** This is the class that was previously indistinguishable from a
  rate limit and reported to users as one.

*Alternatives considered.* (a) Keep one `GitHubRateLimitError` for all 403s and
let the retry layer decide from headers — rejected, it pushes the classification
into every call site and makes the 429-vs-502 outcome unpredictable.
(b) Treat all 403s as fatal — rejected, it discards the real retry opportunity
the `Retry-After` value was captured for.

### 4. A single retry policy, implemented as an explicit loop, not a decorator

A private `_request_with_retry` helper on `GitHubClient` wraps one logical HTTP
call. Given the project's stated preference for explicit, simple architecture
over abstractions, this is a plain `for attempt in range(MAX_ATTEMPTS)` loop,
not a `tenacity` decorator or a new dependency.

Policy, from `app/core/config.py` so it is tunable without a code change:

```
GITHUB_MAX_ATTEMPTS       = 3
GITHUB_RETRY_BASE_DELAY   = 0.5   # seconds
GITHUB_RETRY_MAX_DELAY    = 8.0   # seconds, ceiling per wait
GITHUB_RETRY_TOTAL_BUDGET = 20.0  # seconds, wall-clock ceiling for the operation
GITHUB_REQUEST_TIMEOUT    = 10.0  # existing, made explicit
```

- Retryable: `GitHubRateLimitError` and `httpx.RequestError`.
  Non-retryable, raised straight through: `GitHubAuthError`,
  `GitHubPermissionError`, `GitHubNotFoundError`, `GitHubAPIError`, and
  `httpx.HTTPStatusError` for non-403 5xx beyond the cap.
- Delay for attempt *n*: `server_retry_after` if present, else
  `min(BASE * 2**n, MAX_DELAY) * uniform(0.5, 1.0)`. Jitter prevents a
  thundering herd when several users sync at once.
- **The total budget is checked before sleeping.** If
  `elapsed + delay > GITHUB_RETRY_TOTAL_BUDGET`, stop immediately and raise
  rather than sleeping past the ceiling. This is what keeps the endpoint's
  worst case bounded and testable.
- Exhaustion re-raises the **last** domain error, so the handler maps it to 429
  (rate limit) or 502 (transport) — the distinction survives to the client.

*Alternatives considered.* (a) `tenacity` — rejected, new dependency for a
policy that is 20 lines, and it hides the total-budget check that is the actual
requirement. (b) Retry inside `list_all_repositories` only — rejected, retries
must be per-request so a failure on page 7 does not restart pages 1-6.

### 5. One pooled client per logical operation

`GitHubClient` gains an optional injected `httpx.AsyncClient`; when absent it
creates one lazily and owns it. `list_all_repositories` creates one client for
the whole pagination loop and passes it down, so pages 1..N share a connection
pool instead of each opening a new TLS session. `_request_with_retry` retries
through the **same** client. `close()` is idempotent, and `__aenter__`/
`__aexit__` are added so `async with GitHubClient(...)` is the preferred call
form.

*Alternatives considered.* (a) A module-level shared client — rejected, it
would pool connections across users, mixing tokens on a shared client and
holding sockets open for the process lifetime. (b) Leave per-request clients —
rejected, a 10-page sync currently performs 10 TCP+TLS handshakes.

### 6. Migration: unique index → composite unique constraint

Alembic revision on `repositories`:
1. `op.drop_index("ix_repositories_github_repo_id", table_name="repositories")`
   — the index is `unique=True`, so dropping it is what removes the constraint.
2. `op.create_index("ix_repositories_github_repo_id", "repositories",
   ["github_repo_id"], unique=False)` — same name, non-unique, so existing
   single-column lookups and `ForeignKey` targets keep working.
3. `op.create_unique_constraint("uq_repositories_github_repo_id_owner_id",
   "repositories", ["github_repo_id", "owner_id"])`.

`app/models/repository.py:16` drops `unique=True` and keeps `index=True`. The
model and migration must agree, or `metadata.create_all` (used by the SQLite
test suite) will diverge from PostgreSQL.

Ordering note: step 1 must precede step 3. Creating the composite constraint
while the single-column unique index still exists fails, since the composite is
strictly weaker.

**Concurrency.** Two users syncing the same shared repository simultaneously can
still collide on the composite constraint. The upsert therefore commits **per
repository** inside a savepoint, and catches `IntegrityError` to re-select and
update — the standard read-modify-write race, handled by retry-on-conflict
rather than by holding a transaction-wide lock. This is why the total commit
count is bounded by the retry budget too, and it is the reason the "rollback on
partial failure" requirement is implemented as a single outer transaction with
nested savepoints rather than one big transaction.

*Alternatives considered.* (a) Deduplicate at the service layer with a check —
rejected, the database constraint is the only thing that actually prevents the
race. (b) A join table `user_repositories(user_id, repository_id)` — rejected as
correct long-term, but it rewrites every repository query and read path in the
app, far beyond this change.

### 7. Transaction boundary: one outer transaction, nested savepoints

`sync_repositories` opens the session transaction once, wraps each
per-repository upsert in `session.begin_nested()` (a SAVEPOINT), and rolls the
outer transaction back on any error that escapes. This gives atomicity (all or
nothing, per the spec) without a 1,000-repository single savepoint, and lets a
single conflicting row roll back to its savepoint instead of discarding the
whole batch. `session.refresh()` calls after commit are removed — the records
are already loaded in-session, and the refresh loop is where a mid-loop failure
would leave the commit applied but the response unwritten.

*Alternatives considered.* (a) Keep one commit at the end — rejected, it
commits a half-written set on mid-loop failure, which the spec forbids.
(b) Commit per repository with no outer transaction — rejected, it is the same
non-atomicity with more I/O.

### 8. Frontend guard: a `RequireAuth` wrapper plus an explicit public-route list

New `frontend/src/components/auth/RequireAuth.tsx` reads `useAuth()` and
renders exactly one of three things:

- `isLoading` → a loading state, children **not** rendered.
- `!isAuthenticated` → `router.replace(/?next=<current path>)`, children not
  rendered.
- otherwise → children.

Because children are unmounted until auth resolves, the `/workspace` data-fetch
effect never runs while unauthenticated — this is what satisfies the spec's
"no authenticated API request before the session resolves", and it is the main
reason this is a wrapper component rather than a check inside each page.

New `frontend/src/lib/auth/routes.ts` exports `PUBLIC_ROUTES = ["/",
"/auth/callback"]` and a `isPublicRoute(pathname)` helper. The default is
protected, per the spec. Each of `workspace/page.tsx`, `sessions/page.tsx`,
`activity/page.tsx`, and `settings/page.tsx` wraps its content in
`<RequireAuth>`. Wrapping at the page level (four small edits) is chosen over a
shared layout because `/` and `/auth/callback` do not share a layout with the
protected pages, so a layout would not cover them selectively.

Logout is changed to clear credentials **and** `router.replace("/")`. The spec
already required the clear; leaving the user on a protected page after logout
produced a redirect loop once guards landed, so the two must ship together.

*Alternatives considered.* (a) A Next.js `middleware.ts` — rejected, it cannot
read `localStorage`, so it could only guard unauthenticated-by-cookie and would
mislead future readers into thinking the route is protected server-side.
(b) Per-page `useEffect` checks — rejected, duplicated four times, racy against
the auth hydration, and fires the data request before resolving.

### 9. Return path via a `next` query parameter, validated against open redirect

The guard navigates to `/?next=%2Fworkspace`. The callback page reads `next`
after a successful exchange and replaces the hardcoded `/workspace` with the
validated value. Validation lives in one helper: reject unless the value starts
with a single `/` and the character after it is not `/` and not `\`, which
rejects `//evil.com` and `/\evil.com` — the two forms that turn a relative path
into a protocol-relative or backslash-normalized external URL. Anything
rejected falls back to `/workspace`. The 401 handler in `client.ts` writes
`window.location.pathname` into the same parameter before redirecting, so a
session that expires mid-session also returns the user where they were.

*Alternatives considered.* (a) Cookie-stored return path — rejected, adds a
cookie for a value needed once, and the 401 handler can compute it inline.
(b) Reading `next` on the login page and re-issuing the OAuth redirect with it
— rejected, the backend would have to thread it through the OAuth `state`
cookie, which is a larger change to `github-auth` for no gain.

## Risks / Trade-offs

**[A shared repository is reachable by many users, so the row count grows]**
→ One row per (repo, user) pair is the correct model and is bounded by
`sum(users' repo counts)`. A user with 200 repos syncing 10 of them creates 10
rows, not 200. The composite index keeps the per-page lookup on the existing
`ix_repositories_owner_id` path. Accepted.

**[Pre-existing reassigned rows are not repaired, and now become
ambiguous]** → After the migration, a repo that was stolen by user B remains
owned by B. When A next syncs, A gets a fresh correct row and B keeps a stale
one that will disappear only if a cleanup pass is written. Accepted for MVP;
flagged as a follow-up. The alternative — inferring true ownership from GitHub
at migration time — requires an API call per historical row and is not
worthwhile for local development data.

**[The global `Exception` handler hides bugs during development]** → Mitigation:
the response body is generic, but the **log** keeps the full traceback, and the
handler logs at `ERROR` with `exc_info`. Developers read the terminal, not the
response body. The existing `ENABLE_STACKTRACE` debug behavior is deliberately
not preserved, because leaking a traceback to the client is the thing being
fixed.

**[`logger.exception` outside an `except` block raises]** → All call sites are
inside `except` blocks by construction. A test asserts the global handler
emits a record containing `"Traceback"`, which fails loudly if a handler is
ever added outside an exception context.

**[The logging filter mutates records in place, which is unusual]** → Mitigation:
covered by a direct unit test on `sanitize_log_data` plus one on the filter
through `caplog`. Chosen over a second-logger-copy approach, which produced
duplicate output during prototyping.

**[Client-side guards protect nothing against a crafted request]** → Stated
plainly in `proposal.md` and here: `get_current_user` is the only real
boundary. The guard is a UX correctness fix, and the spec wording is chosen to
say "prevent rendering", not "prevent access", to avoid implying enforcement
that does not exist.

**[`GITHUB_RETRY_TOTAL_BUDGET = 20s` makes some syncs visibly slower]** → The
budget is a ceiling, not a floor; a healthy sync with no rate limiting never
sleeps. Users see a spinner, not an error, and the previous behavior on a rate
limit was an immediate 500. Net improvement.

**[A sleep in a sync request holds a DB connection open]** → The session is
opened after GitHub fetches complete, or the connection is released before the
retry loop. The task ordering enforces fetch-then-persist so the pool
(`DB_POOL_SIZE = 5`) is not starved by sleeping requests.

**[Frontend `router.replace` in render is a side effect in render]** → The
redirect is issued from a `useEffect` inside `RequireAuth`, not during render,
to satisfy React's purity rules and avoid double-invocation under StrictMode.

## Migration Plan

1. **Backend, no-deploy step.** Add the Alembic revision and the model change.
   Deploy and run `uv run alembic upgrade head` before the new code, so old
   code (which still matches on `github_repo_id` alone) continues to work
   against the new schema. Safe in this order: the composite constraint is
   weaker than the index it replaces only in the sense that it permits more
   rows; the old code's single-column query still returns exactly one row.
2. **Backend deploy.** Ship the error handlers, the retry policy, the
   owner-scoped upsert, and the logging filter. Apply the config defaults; no
   environment variables are required.
3. **Frontend deploy.** Ship `RequireAuth`, the public-route list, the 401
   redirect, and the logout redirect together. Shipping the guard without the
   logout redirect causes a redirect loop on logout; shipping the 401 redirect
   without the guard is harmless but incomplete.
4. **Rollback.** The code changes are independently revertable. The migration
   is **not** cleanly revertable after users have synced shared repositories,
   because re-adding the unique index on `github_repo_id` will fail if two rows
   now exist for the same repo. Rollback therefore means: revert code, leave the
   schema migrated. A downgrade path would need a dedup pass, which is why the
   forward migration is additive and the constraint is never tightened again.
5. **Verification.** `uv run pytest` and `pnpm test` must pass. Add a manual
   check that a shared repository synced by two users produces two rows and two
   distinct `GET /repositories` results.

## Open Questions

- Should the `Run` model's `repository_id` foreign key remain pointed at a
  per-user row, or move to a canonical repo row with ownership on a join table?
  Correct long-term, but it is a data-model decision beyond this change and it
  does not alter the specs, the approach, or the task breakdown here.
- Should the error `code` field use the exception class name
  (`GitHubRateLimitError`) or a stable wire-format slug (`github_rate_limited`)?
  The class name is chosen here because it is already the vocabulary in
  `errors.py`; if a stable public contract is wanted, a slug table is a
  follow-up. This does not change the specs, which require only a stable code.
