# github-integration Specification

## Purpose

Provides an asynchronous GitHub REST API client and repository synchronization mechanism for discovering and managing user repositories.

## Requirements

### Requirement: Reusable GitHub REST API Client
The system SHALL provide an asynchronous client wrapper around the GitHub REST API (`https://api.github.com`) using decrypted user tokens. The client SHALL support fetching the authenticated user's profile (`GET /user`), listing repositories accessible to the user with pagination (`GET /user/repos`), and retrieving repository details (`GET /repos/{owner}/{repo}`). The client SHALL handle GitHub rate limiting, authentication errors (HTTP 401/403), and network errors gracefully. The client SHALL retry transient failures and rate limits according to a bounded retry policy, SHALL honor any retry delay the server specifies, SHALL give up after a fixed attempt limit or elapsed-time budget, and SHALL reuse a single pooled connection across the requests of one logical operation. A rate limit that remains after the retry budget is exhausted SHALL be reported as a rate-limit condition rather than as a generic upstream failure.

#### Scenario: Client fetches authenticated user
- **WHEN** client requests user profile with valid GitHub token
- **THEN** system returns parsed GitHub user data (`id`, `login`, `avatar_url`, `email`)

#### Scenario: Client handles GitHub API error
- **WHEN** GitHub API returns HTTP 401 Unauthorized or HTTP 403 Rate Limit Exceeded
- **THEN** system raises a structured domain exception with status code and error details

#### Scenario: Client retries a rate-limited request
- **WHEN** GitHub API rejects a request with a rate-limit response and the retry budget is not yet exhausted
- **THEN** system waits for the delay the server specified when one was provided, otherwise for an exponentially increasing delay with jitter, then reissues the same request and returns its successful result

#### Scenario: Client retries a transient network failure
- **WHEN** a request to GitHub fails with a transport-level error such as a connection reset or timeout, and the retry budget is not yet exhausted
- **THEN** system reissues the request and returns its successful result

#### Scenario: Client gives up after exhausting the retry budget
- **WHEN** GitHub continues to reject a request with a rate-limit response after the configured attempt limit or elapsed-time budget is reached
- **THEN** system raises a rate-limit domain error rather than a generic upstream failure, and the total elapsed time remains within the configured bound

#### Scenario: Client does not retry non-transient failures
- **WHEN** GitHub rejects a request with a non-transient error such as HTTP 401 or HTTP 404
- **THEN** system raises the corresponding domain error immediately without retrying

#### Scenario: Client reuses connections across a paginated operation
- **WHEN** the client fetches multiple pages of a paginated listing
- **THEN** all page requests are issued over a single pooled client connection rather than a newly constructed client per request

### Requirement: Repository Synchronization
The system SHALL provide an endpoint `POST /api/v1/repositories/sync` requiring JWT authentication that uses the user's decrypted GitHub token to fetch all accessible repositories from GitHub. For each repository, the system SHALL insert a new `Repository` record or update an existing record matched by the pair (`github_repo_id`, `owner_id`), updating `full_name`, `default_branch`, `clone_url`, `is_private`, and `updated_at`. Matching on `github_repo_id` alone SHALL NOT be used, so that a repository accessible to more than one user is stored as a distinct record per user and syncing SHALL NOT transfer ownership of an existing record to a different user. A synchronization that fails partway through SHALL leave the database unchanged rather than committing a partial repository set. The endpoint SHALL return a summary of synchronized repositories.

#### Scenario: User triggers repository sync
- **WHEN** authenticated user calls `POST /api/v1/repositories/sync`
- **THEN** system fetches repositories from GitHub, upserts them into the database for the user, and returns HTTP 200 with the list of synchronized repositories

#### Scenario: Repository sync without valid token
- **WHEN** user without a stored GitHub token calls `POST /api/v1/repositories/sync`
- **THEN** system returns HTTP 400 Bad Request indicating that GitHub account is not connected

#### Scenario: Shared repository is stored per user
- **WHEN** user A syncs a repository that user B has already synchronized
- **THEN** system creates a distinct record owned by user A and leaves user B's existing record, its attributes, and its ownership unchanged

#### Scenario: Repeated sync does not duplicate a user's own record
- **WHEN** the same user synchronizes a repository they have already synchronized
- **THEN** system updates that user's existing record in place and does not create a duplicate

#### Scenario: Failure partway through sync commits nothing
- **WHEN** a sync fails while processing the fetched repository set, after some records have already been staged
- **THEN** the transaction is rolled back, no partial or incomplete repository set remains visible, and the request returns an error response

#### Scenario: Sync reports rate limiting distinctly
- **WHEN** a sync cannot complete because GitHub's rate limit was exhausted
- **THEN** system returns HTTP 429 with an error body identifying the rate limit, rather than a generic server error

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
