# Design

## Context

Phase 1A established the backend foundation: FastAPI application structure, async SQLModel/SQLAlchemy connection to PostgreSQL, Alembic migration framework, health endpoints, structured logging, and initial database entities (`User`, `Repository`, `Run`, `RunStep`).

Phase 1B implements GitHub authentication and repository synchronization on top of these foundations. See `proposal.md` for motivation and scope boundaries.

```
+-----------------------------------------------------------------------------------+
|                                  FastAPI App                                      |
|                                                                                   |
|  +---------------------------+            +------------------------------------+  |
|  |     /api/v1/auth          |            |     /api/v1/repositories           |  |
|  |  - /github/login          |            |  - GET / (paginated list)          |  |
|  |  - /github/callback       |            |  - POST /sync (sync with GitHub)   |  |
|  |  - GET /me                |            |  - GET /{id} (details)             |  |
|  +-------------+-------------+            +-----------------+------------------+  |
|                |                                            |                     |
|                v                                            v                     |
|  +---------------------------+            +------------------------------------+  |
|  |      Security / Auth      |            |         GitHub API Client          |  |
|  |  - CSRF state cookie      |            |  - Async httpx.AsyncClient         |  |
|  |  - Fernet encryption      |            |  - GET /user, GET /user/repos      |  |
|  |  - JWT encode/decode      |            |  - Rate limit & error handling     |  |
|  |  - get_current_user       |            |                                    |  |
|  +-------------+-------------+            +-----------------+------------------+  |
|                |                                            |                     |
|                +--------------------+  +--------------------+                     |
|                                     |  |                                          |
|                                     v  v                                          |
|                        +----------------------------+                             |
|                        |      Database Layer        |                             |
|                        |  - users table (encrypted) |                             |
|                        |  - repositories table      |                             |
|                        +----------------------------+                             |
+-----------------------------------------------------------------------------------+
```

## Goals / Non-Goals

**Goals:**
- Provide a clean, secure GitHub OAuth 2.0 login flow with stateless CSRF protection.
- Secure GitHub personal access tokens at rest via Fernet symmetric encryption.
- Issue minimal, stateless JWT access tokens (`sub`, `iat`, `exp`) for API authentication.
- Implement a reusable, async `httpx` GitHub REST API client with error handling.
- Synchronize and query user-owned GitHub repositories in PostgreSQL via clean REST endpoints (`/api/v1/repositories*`).
- Provide 100% mocked test coverage for GitHub API and auth flows without depending on external network access.

**Non-Goals:**
- No Redis or distributed state caches.
- No refresh token rotation or session revocation database tables.
- No repository cloning, workspace preparation, or Podman sandbox execution.
- No Claude/Anthropic API integration or prompt engineering.
- No Git branch/commit/push/PR operations on target repositories.
- No Next.js frontend UI components.

## Decisions

### 1. Stateless OAuth CSRF Protection via HTTP-Only Cookie
- **Decision**: Generate a 32-byte cryptographically secure random token (`secrets.token_urlsafe(32)`) on login redirect, set it in a short-lived (10-minute), HTTP-only, SameSite=Lax cookie (`github_oauth_state`), and send it as the `state` parameter to GitHub. On callback, verify equality between query `state` and the cookie value, then clear the cookie.
- **Rationale**: Completely stateless, requires zero server-side storage or Redis, and prevents cross-site request forgery during the OAuth handshake.
- **Alternatives Considered**:
  - *Server-side session store (Redis)*: Adds unnecessary operational complexity for a 7-day MVP.
  - *Signed JWT state*: Adds cryptographic signature overhead without tangible security benefit over a secure cookie comparison.

### 2. Symmetric Token Encryption with Fernet
- **Decision**: Use `cryptography.fernet.Fernet` (`AES-128-CBC` with `HMAC-SHA256` authentication) driven by a 32-byte URL-safe base64-encoded key configured in `Settings.ENCRYPTION_SECRET_KEY`.
- **Rationale**: Fernet provides authenticated encryption (ciphertext cannot be modified or tampered with), is standardized in Python, and prevents exposing raw developer GitHub tokens if the database is inspected or dumped.
- **Alternatives Considered**:
  - *Plaintext token storage*: Insecure; unacceptable for portfolio-grade GitHub integrations.
  - *HashiCorp Vault / Cloud KMS*: Overly complex for local single-instance deployment and MVP scope.

### 3. Minimal Stateless JWT API Authentication
- **Decision**: Use `pyjwt` with `HS256` to issue tokens upon successful OAuth callback containing claims:
  - `sub`: Stringified user UUID.
  - `iat`: Timestamp of issuance (UTC).
  - `exp`: Expiration timestamp (default: 7 days or configurable `JWT_EXPIRE_MINUTES`).
  Expose a FastAPI dependency `get_current_user` that extracts Bearer token, decodes claims, and queries the `User` from PostgreSQL.
- **Rationale**: Keeps backend services stateless, simplifies frontend API authorization, and aligns with standard REST security practices.
- **Alternatives Considered**:
  - *Database-backed session tokens*: Requires DB round-trips for session validation and explicit session cleanup tables.
  - *Complex OAuth2 with Refresh Tokens*: Unnecessary complexity for the 7-day MVP timeline.

### 4. Separate OAuth Flow from Reusable GitHub API Client
- **Decision**: Keep authorization-code exchange logic in `app/services/auth.py` and build a standalone `GitHubClient` in `app/services/github.py` initialized with a decrypted access token.
- **Rationale**: `GitHubClient` will be reused in future phases (repository inspection, commit analysis, PR creation) and should not be coupled to web request/response OAuth handling.

### 5. Repository Synchronization Architecture
- **Decision**: `POST /api/v1/repositories/sync` will fetch all user-accessible repos via `GitHubClient.list_repositories()`, perform upserts against the `Repository` table matching on `(github_repo_id, owner_id)`, and update attributes (`full_name`, `default_branch`, `clone_url`, `is_private`, `updated_at`).
- **Rationale**: Guarantees that local records remain in sync with GitHub state without requiring webhooks in Phase 1B.

## Risks / Trade-offs

- **[GitHub API Rate Limits]** → The `GitHubClient` inspects response headers (`x-ratelimit-remaining`) and maps HTTP 403 rate limit errors into a clear `GitHubRateLimitError` domain exception.
- **[Encryption Key Misconfiguration]** → Validate `ENCRYPTION_SECRET_KEY` format on application startup in Pydantic settings so missing or malformed keys fail fast before servicing requests.
- **[Token Leakage in Logs / API Responses]** → Ensure Pydantic response models (`UserRead`, `RepositoryRead`) strictly exclude `encrypted_token` and never log raw tokens or request authorization headers.

## Migration Plan

1. Update `backend/pyproject.toml` with `cryptography` and `pyjwt`.
2. Add new environment variable definitions to `backend/app/core/config.py` and `backend/.env.example`.
3. Database schema already includes `encrypted_token` on `users` table and all necessary fields on `repositories` table from Phase 1A; no disruptive database migrations required.
