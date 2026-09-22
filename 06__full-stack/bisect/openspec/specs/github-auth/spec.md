# github-auth Specification

## Purpose

Enables secure developer authentication via GitHub OAuth 2.0 with CSRF protection, token encryption at rest, and stateless JWT API sessions.

## Requirements

### Requirement: GitHub OAuth Authorization Redirect
The system SHALL provide an endpoint `GET /api/v1/auth/github/login` that redirects the user's browser to GitHub's OAuth authorization URL (`https://github.com/login/oauth/authorize`) with `client_id`, `redirect_uri`, requested scopes (`read:user`, `repo`), and a cryptographically secure random `state` parameter. The system SHALL set an HTTP-only, secure, short-lived cookie containing this `state` value.

#### Scenario: User initiates GitHub OAuth login
- **WHEN** user sends `GET /api/v1/auth/github/login`
- **THEN** system responds with HTTP 307 redirect to `https://github.com/login/oauth/authorize` containing `client_id`, `redirect_uri`, `scope`, and `state`, and sets a `github_oauth_state` cookie

### Requirement: GitHub OAuth Callback Handling
The system SHALL provide an endpoint `GET /api/v1/auth/github/callback` that receives `code` and `state` parameters from GitHub. The system SHALL verify that the incoming `state` parameter matches the value in the `github_oauth_state` cookie. If valid, the system SHALL exchange the `code` for an access token via GitHub's token endpoint (`https://github.com/login/oauth/access_token`). If invalid or missing, the system SHALL reject the request with HTTP 400 Bad Request.

#### Scenario: Successful OAuth callback
- **WHEN** user is redirected to `GET /api/v1/auth/github/callback` with matching `state` and valid `code`
- **THEN** system exchanges code for token, stores/updates user record, deletes the state cookie, and returns a JSON response containing an access JWT token

#### Scenario: CSRF state mismatch or missing cookie
- **WHEN** callback is invoked with a mismatched `state` or missing `github_oauth_state` cookie
- **THEN** system returns HTTP 400 with an error detail indicating invalid OAuth state

### Requirement: Encrypted Token Storage at Rest
The system SHALL encrypt GitHub access tokens using symmetric encryption before persisting them into the `User` database table, and SHALL decrypt them in memory only when performing authorized GitHub API requests. Plaintext tokens SHALL NEVER be logged or returned in API responses.

#### Scenario: User access token persisted securely
- **WHEN** OAuth token exchange completes for a user
- **THEN** system stores the ciphertext in `users.encrypted_token` and the plaintext value is never exposed in API responses or logs

### Requirement: JWT API Authentication and User Context
The system SHALL issue JSON Web Tokens (JWT) containing standard claims (`sub` with User UUID, `iat`, and `exp`). The system SHALL provide a `get_current_user` dependency that extracts the Bearer token from the `Authorization` header, verifies its signature and expiration, retrieves the active `User` from the database, and injects it into endpoint handlers. If the token is invalid, expired, or missing, the system SHALL return HTTP 401 Unauthorized.

#### Scenario: Authenticated request with valid JWT
- **WHEN** client sends a request with header `Authorization: Bearer <valid_jwt>`
- **THEN** system resolves the user and executes the protected endpoint

#### Scenario: Request with expired or invalid JWT
- **WHEN** client sends a request with an invalid or expired token
- **THEN** system returns HTTP 401 Unauthorized

### Requirement: Authenticated User Profile Endpoint
The system SHALL provide an endpoint `GET /api/v1/auth/me` requiring valid JWT Bearer authentication that returns the current authenticated user's profile details (`id`, `github_user_id`, `github_username`, `avatar_url`, `created_at`, `updated_at`). The response SHALL NOT include `encrypted_token` or sensitive credentials.

#### Scenario: Current user requests profile
- **WHEN** authenticated user calls `GET /api/v1/auth/me`
- **THEN** system returns HTTP 200 with the user's public profile attributes and omits sensitive token data
