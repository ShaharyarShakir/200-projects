# Tasks

## 1. Dependencies & Configuration

- [x] 1.1 Add `cryptography` and `pyjwt` to `backend/pyproject.toml` runtime dependencies, add `respx` to dev dependencies, run `uv sync`, and verify lockfile builds cleanly
- [x] 1.2 Update `backend/app/core/config.py` with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`, `ENCRYPTION_SECRET_KEY`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, and `JWT_EXPIRE_MINUTES`, update `backend/.env.example`, and verify settings validation

## 2. Security Utilities & Cryptography

- [x] 2.1 Implement symmetric Fernet encryption/decryption helper functions (`encrypt_token`, `decrypt_token`) in `backend/app/core/security.py` and verify bidirectional cipher consistency
- [x] 2.2 Implement stateless JWT token issuance and decoding helper functions (`create_access_token`, `decode_access_token`) with `sub`, `iat`, and `exp` claims in `backend/app/core/security.py`
- [x] 2.3 Implement cryptographic OAuth state generator and cookie verification helpers in `backend/app/core/security.py`

## 3. Reusable GitHub REST API Client

- [x] 3.1 Implement custom exception hierarchy (`GitHubAPIError`, `GitHubAuthError`, `GitHubRateLimitError`, `GitHubNotFoundError`) in `backend/app/core/errors.py`
- [x] 3.2 Implement asynchronous `GitHubClient` in `backend/app/services/github.py` with `get_authenticated_user`, `list_repositories`, and `get_repository` methods using `httpx.AsyncClient`

## 4. Authentication Services, Dependencies & Endpoints

- [x] 4.1 Implement `OAuthService` in `backend/app/services/auth.py` to build GitHub authorization redirect URLs and exchange authorization codes for access tokens
- [x] 4.2 Implement `get_current_user` FastAPI dependency in `backend/app/api/deps.py` to resolve and validate Bearer JWT tokens against the database
- [x] 4.3 Implement authentication router in `backend/app/api/v1/auth.py` providing `GET /login`, `GET /callback`, and `GET /me`, wire router in `backend/app/main.py`, and verify endpoint schemas

## 5. Repository Management & Synchronization Endpoints

- [x] 5.1 Implement `RepositoryService` in `backend/app/services/repository.py` to upsert synchronized repositories into PostgreSQL for the authenticated user
- [x] 5.2 Implement repository router in `backend/app/api/v1/repositories.py` providing `GET /`, `POST /sync`, and `GET /{id}`, wire router in `backend/app/main.py`, and verify endpoint schemas

## 6. Testing Suite & Verification

- [x] 6.1 Implement `tests/test_security.py` covering Fernet token encryption/decryption, JWT signing/expiry, and OAuth state verification
- [x] 6.2 Implement `tests/test_github_client.py` covering `GitHubClient` methods, pagination, rate limits, and network error handling using mocked GitHub responses
- [x] 6.3 Implement `tests/test_auth_api.py` covering `/api/v1/auth/github/login`, `/api/v1/auth/github/callback` (happy path & CSRF mismatch), and `/api/v1/auth/me`
- [x] 6.4 Implement `tests/test_repositories_api.py` covering `GET /api/v1/repositories`, `POST /api/v1/repositories/sync`, and `GET /api/v1/repositories/{id}` with pagination and foreign user isolation
- [x] 6.5 Execute full test suite via `uv run pytest` and verify all tests pass cleanly
