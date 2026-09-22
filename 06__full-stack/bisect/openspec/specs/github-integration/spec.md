# github-integration Specification

## Purpose

Provides an asynchronous GitHub REST API client and repository synchronization mechanism for discovering and managing user repositories.

## Requirements

### Requirement: Reusable GitHub REST API Client
The system SHALL provide an asynchronous client wrapper around the GitHub REST API (`https://api.github.com`) using decrypted user tokens. The client SHALL support fetching the authenticated user's profile (`GET /user`), listing repositories accessible to the user with pagination (`GET /user/repos`), and retrieving repository details (`GET /repos/{owner}/{repo}`). The client SHALL handle GitHub rate limiting, authentication errors (HTTP 401/403), and network errors gracefully.

#### Scenario: Client fetches authenticated user
- **WHEN** client requests user profile with valid GitHub token
- **THEN** system returns parsed GitHub user data (`id`, `login`, `avatar_url`, `email`)

#### Scenario: Client handles GitHub API error
- **WHEN** GitHub API returns HTTP 401 Unauthorized or HTTP 403 Rate Limit Exceeded
- **THEN** system raises a structured domain exception with status code and error details

### Requirement: Repository Synchronization
The system SHALL provide an endpoint `POST /api/v1/repositories/sync` requiring JWT authentication that uses the user's decrypted GitHub token to fetch all accessible repositories from GitHub. For each repository, the system SHALL insert a new `Repository` record or update an existing record matched by `github_repo_id` and `owner_id`, updating `full_name`, `default_branch`, `clone_url`, `is_private`, and `updated_at`. The endpoint SHALL return a summary of synchronized repositories.

#### Scenario: User triggers repository sync
- **WHEN** authenticated user calls `POST /api/v1/repositories/sync`
- **THEN** system fetches repositories from GitHub, upserts them into the database for the user, and returns HTTP 200 with the list of synchronized repositories

#### Scenario: Repository sync without valid token
- **WHEN** user without a stored GitHub token calls `POST /api/v1/repositories/sync`
- **THEN** system returns HTTP 400 Bad Request indicating that GitHub account is not connected

### Requirement: List Synchronized Repositories
The system SHALL provide an endpoint `GET /api/v1/repositories` requiring JWT authentication that returns a paginated list of repositories owned by or synchronized for the authenticated user, ordered by most recently updated by default. The endpoint SHALL support `limit` (default 20, max 100) and `offset` (default 0) query parameters.

#### Scenario: User queries synchronized repositories
- **WHEN** authenticated user calls `GET /api/v1/repositories?limit=10&offset=0`
- **THEN** system returns HTTP 200 with the paginated list of repositories belonging to the user and total count

### Requirement: Retrieve Repository Details
The system SHALL provide an endpoint `GET /api/v1/repositories/{id}` requiring JWT authentication that returns the repository details for the given repository UUID. If the repository does not exist or does not belong to the authenticated user, the system SHALL return HTTP 404 Not Found.

#### Scenario: User queries existing repository by ID
- **WHEN** authenticated user calls `GET /api/v1/repositories/{id}` for a repository they own
- **THEN** system returns HTTP 200 with full repository details

#### Scenario: User queries non-existent or foreign repository
- **WHEN** user requests a repository UUID that does not exist or belongs to another user
- **THEN** system returns HTTP 404 Not Found
