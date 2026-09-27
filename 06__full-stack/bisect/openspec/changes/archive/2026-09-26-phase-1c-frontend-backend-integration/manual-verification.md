# Manual Verification Checklist (tasks 8.4 and 8.5)

These two tasks require a real browser and a real GitHub sign-in, so they are
verified by hand rather than by the automated suites. Everything else in this
change is covered by `uv run pytest` (278 tests) and `pnpm test` (266 tests).

**Both 8.4 and 8.5 were verified by hand and are checked off** (2026-09-26).
Re-run these steps after changing the auth flow, the OAuth callback URL, or any
of the four views covered by task 6.5 — those are the changes most likely to
break the flow, and 8.4/8.5 are the only checks in this change that a unit test
cannot stand in for.

Fixing the sign-in flow required two changes, both of which should be preserved:

- `GITHUB_REDIRECT_URI` points at the **frontend** callback
  (`http://localhost:3000/auth/callback`), and the GitHub OAuth app's registered
  Authorization callback URL must match it exactly.
- `fetchApi` sends `credentials: "include"`, without which the cross-origin
  code exchange drops the `github_oauth_state` CSRF cookie and sign-in fails
  with "Invalid or missing OAuth state parameter".

## Prerequisites

Docker is not needed. `backend/.env` already points at SQLite
(`sqlite+aiosqlite:///./bisect.db`) and already holds working GitHub OAuth
credentials.

The OAuth callback URL registered in the GitHub OAuth app **must** be
`http://localhost:3000/auth/callback` — the frontend page, not the backend
endpoint. GitHub sends the browser there with `code` and `state`; the frontend
then exchanges the code with the backend via `authApi.handleCallback`, so the
JWT never appears in a URL. `GITHUB_REDIRECT_URI` in `backend/.env` must match.
Pointing the callback at the backend instead dumps a raw JSON token response
into the browser and leaves the user stranded.

Terminal 1 — backend:

```sh
cd backend
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

Confirm `http://localhost:8000/health` returns 200 before continuing.

Terminal 2 — frontend:

```sh
cd frontend
pnpm dev
```

Open `http://localhost:3000`.

## 8.4 End-to-end flow

| # | Action | Expected |
|---|---|---|
| 1 | On `http://localhost:3000`, click **Sign in with GitHub** | Redirects to GitHub, then back to the app authenticated |
| 2 | Confirm you are signed in | The header shows your GitHub username instead of a sign-in button |
| 3 | Go to `/workspace`, click **Sync Repos** | Your GitHub repositories appear in the repository selector |
| 4 | Pick a repository, type a distinctive task prompt, click **Start Task** | A session is created; the session inspector and activity feed populate |
| 5 | Open `/sessions` in a new tab, then **reload the page (F5)** | The session from step 4 is still listed, with its prompt and running status |
| 6 | Open `/activity` | The session picker lists your sessions |
| 7 | Select the session from step 4 | Its events appear in chronological order, oldest first |
| 8 | Return to `/workspace` and switch to **Bisect Timeline** | Shows "Bisect timeline not available yet" — no fabricated commits |
| 9 | Switch to **Diff & Patch Review** | Shows "Diff review not available yet" — no fabricated diff |

Steps 8 and 9 are the task 6.6 behaviour and are the easiest thing to
regress, so confirm no sample commits, hashes, or diff lines appear.

## 8.5 Failure states

The JWT lives in `localStorage` under `bisect_auth_token`, and there is no
`/login` route — an unauthenticated visitor is sent to the landing page
(`/`) carrying a `returnPath` query parameter, which is the intended
"login prompt" behaviour.

| # | Action | Expected |
|---|---|---|
| 1 | Open a **private/incognito** window (no token) and go straight to `http://localhost:3000/sessions` | Redirects to the landing page with the GitHub sign-in CTA. The session list does not render |
| 2 | While signed in, open devtools → Application → Local Storage and set `bisect_auth_token` to `expired` | — |
| 3 | Navigate to `/workspace` | Redirects back to the sign-in prompt rather than a half-rendered page |
| 4 | Sign in again | You are returned to the page you were on, not the landing page |
| 5 | Stop the backend (Ctrl-C in terminal 1), then reload `/sessions` | A visible **"Could not load sessions"** error with a working **retry** control — not a blank page |
| 6 | Restart the backend and click **retry** | The list loads normally |
| 7 | On `/workspace`, click the refresh control with the backend still stopped | An error state appears, and the refresh control stays usable afterwards |

Step 5 is the requirement that an unreachable backend shows an error state
with retry rather than a blank view. A blank page, a permanent spinner, or a
raw stack trace is a failure.

## Recording the result

Report which steps passed or failed. On success, check off 8.4 and 8.5 in
`tasks.md`. If anything fails, leave the box unchecked and send me the step
number plus what you saw, and I will fix it.
