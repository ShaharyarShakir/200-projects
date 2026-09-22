# Proposal

## Why

Bisect needs to authenticate developers through GitHub and discover their repositories so it can subsequently analyze test failures and create PRs. In Phase 1A, the backend foundation, database entities, and health endpoints were established. Phase 1B introduces the authentication and repository discovery foundation: GitHub OAuth 2.0 authentication, stateless CSRF protection, symmetric token encryption at rest, minimal JWT session management, and synchronization of user repositories via an asynchronous GitHub API client.

## What Changes

- Add GitHub OAuth 2.0 login and callback flow (`/api/v1/auth/github/login`, `/api/v1/auth/github/callback`) using authorization-code exchange.
- Implement stateless OAuth CSRF protection using a cryptographically secure, short-lived HTTP-only cookie validated upon callback return.
- Implement token encryption and decryption utilities using `cryptography.fernet.Fernet` (`AES-128-CBC` + `HMAC-SHA256`) to protect GitHub user access tokens at rest in PostgreSQL.
- Implement minimal stateless JWT session token generation and verification (`sub`, `iat`, `exp`) using `pyjwt` or `python-jose`.
- Implement a FastAPI dependency `get_current_user` to authenticate incoming API requests via Bearer JWT tokens.
- Add an authenticated user profile endpoint `GET /api/v1/auth/me`.
- Build an asynchronous, typed GitHub REST API client using `httpx.AsyncClient` supporting authenticated user lookup, paginated repository listing, and repository detail lookup with rate limit and error handling.
- Implement repository endpoints:
  - `GET /api/v1/repositories`: List synchronized repositories for the authenticated user with pagination and sorting.
  - `POST /api/v1/repositories/sync`: Trigger on-demand synchronization from GitHub into local database records.
  - `GET /api/v1/repositories/{id}`: Retrieve repository details owned by the authenticated user.
- Update `backend/app/core/config.py` and `.env.example` with GitHub OAuth credentials, encryption keys, and JWT settings.
- Add dependencies (`cryptography`, `pyjwt`) to `backend/pyproject.toml`.
- Provide comprehensive test coverage with mocked GitHub HTTP responses and token lifecycle verification.

## Non-Goals & Out of Scope

- No Git clone, workspace setup, Podman sandbox creation, or test execution (deferred to Phase 2).
- No Anthropic / Claude API integration or prompt loops (deferred to Phase 3).
- No repository branch creation, commit creation, push operations, or PR creation (deferred to Phase 4).
- No Redis or distributed session caching.
- No refresh tokens, user role permissions, or complex session tables.
- No WebSockets or frontend Next.js dashboard work.
- Claude Code must not mutate the Bisect source repository's Git history or remotes.

## Capabilities

### New Capabilities
- `github-auth`: GitHub OAuth 2.0 authentication flow, stateless CSRF cookie protection, Fernet token encryption at rest, minimal JWT token issuance/verification, and current user profile endpoint.
- `github-integration`: Asynchronous GitHub API client for fetching user details and repository listings, synchronizing repositories with local PostgreSQL storage, and querying repository records.

### Modified Capabilities
<!-- None: No existing specs are modified. -->

## Impact

- **Backend Dependencies**: Added `cryptography` and `pyjwt` (or `python-jose[cryptography]`) to `backend/pyproject.toml`.
- **Configuration**: New settings in `app/core/config.py` for `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`, `ENCRYPTION_SECRET_KEY`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, and `JWT_EXPIRE_MINUTES`.
- **API Surface**: New endpoints under `/api/v1/auth/*` and `/api/v1/repositories/*`.
- **Database**: Uses existing `users` and `repositories` tables created in Phase 1A; updates token storage and metadata mapping.
- **Testing**: Added unit and integration tests using mocked GitHub API responses via `respx` or `httpx` mocking fixtures.
