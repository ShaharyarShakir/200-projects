# backend-foundation Specification

## Purpose

Provides the foundational runtime environment, application lifecycle, environment settings, asynchronous database session handling, structured logging, and health check endpoints for the Bisect backend.

## Requirements

### Requirement: Application Configuration Management
The system SHALL load and validate all runtime configuration settings from environment variables and `.env` files using strict type schemas, falling back to sensible local development defaults when optional settings are omitted.

#### Scenario: Valid environment configuration loaded
- **WHEN** the FastAPI application initializes with valid environment variables
- **THEN** configuration values for database URL, API prefix, environment name, and logging level are successfully parsed and accessible via dependency injection

#### Scenario: Missing required environment configuration
- **WHEN** a mandatory configuration setting (such as database credentials in strict mode) fails validation
- **THEN** the application startup process terminates immediately with an explanatory validation error

### Requirement: Liveness and Readiness Health Check Endpoints
The system SHALL expose REST endpoints to report the operational health of the application and verify live database connectivity.

#### Scenario: Service liveness probe succeeds
- **WHEN** a client sends a `GET` request to `/health`
- **THEN** the server returns HTTP 200 with JSON payload `{"status": "ok", "service": "bisect-backend"}`

#### Scenario: Database readiness probe succeeds
- **WHEN** a client sends a `GET` request to `/health/db` and the database connection is healthy
- **THEN** the server executes a test query (`SELECT 1`) and returns HTTP 200 with JSON payload `{"status": "ok", "database": "connected"}`

#### Scenario: Database readiness probe detects failure
- **WHEN** a client sends a `GET` request to `/health/db` and the database is unreachable or refusing connections
- **THEN** the server catches the connection error and returns HTTP 503 with JSON payload describing the database connectivity failure

### Requirement: Structured Logging and Request Correlation
The system SHALL emit structured logs with timestamp, log level, message, and execution context for all incoming API requests and operational events. The system SHALL log every handled and unhandled error condition at error level together with the originating stack trace, so that a failure can be diagnosed from the logs alone without reproducing it. Handled error paths SHALL NOT record only a stringified exception message.

#### Scenario: API request logging
- **WHEN** an HTTP request is processed by the backend
- **THEN** the application logs the HTTP method, request path, status code, and latency in a consistent structured format

#### Scenario: Handled error records the stack trace
- **WHEN** a route or service catches an exception and converts it into an error response
- **THEN** the application logs the error at error level together with the full stack trace, the originating module and line, and the request path

#### Scenario: Every error path produces a log record
- **WHEN** a request results in any 4xx or 5xx response
- **THEN** at least one error-level log record exists for that request, and no error path emits a record containing only a stringified exception message

### Requirement: Unhandled Exception Containment
The system SHALL catch any exception that is not otherwise handled by a route or
an exception-specific handler, record it to the application log, and return a
JSON response with HTTP 500 containing a stable, non-sensitive error body. The
system SHALL NOT return an empty response body, a stack trace, or any internal
exception message to the client for an unhandled exception.

#### Scenario: Unhandled exception reaches the application boundary
- **WHEN** a request causes an exception that no route or specific handler intercepts
- **THEN** the system logs the exception with its full stack trace and returns HTTP 500 with a JSON body containing a generic error message and a stable machine-readable error code

#### Scenario: Unhandled exception does not leak internals to the client
- **WHEN** the system returns HTTP 500 for an unhandled exception
- **THEN** the response body contains neither the exception message, the exception type, nor any stack trace or source file reference

#### Scenario: Error response body is well-formed JSON
- **WHEN** a client receives an HTTP 500 response
- **THEN** the response has a JSON content type and a body containing both a `detail` field and a stable `code` field, consistent in shape with the 4xx error responses

### Requirement: Domain Error Status Code Mapping
The system SHALL define a single HTTP status code for each domain error class
raised by the backend, so that the status is a property of the error itself
rather than of whichever route happens to catch it. Routes SHALL NOT be required
to re-map error types to status codes individually. Each domain error class
SHALL map to a status consistent with its semantics, using 4xx for client-fault
conditions (for example invalid or revoked credentials, malformed input, and
exceeded rate limits) and 5xx for server-fault or upstream-failure conditions
(including third-party service failures).

#### Scenario: Domain error class has a defined status code
- **WHEN** any domain error class is inspected
- **THEN** it exposes a single HTTP status code attribute covering itself and all of its subclasses

#### Scenario: Invalid or revoked credentials produce 401
- **WHEN** a domain error indicating an invalid or revoked third-party credential is raised during a request
- **THEN** the system returns HTTP 401 with a JSON error body identifying the credential failure

#### Scenario: Rate limit condition produces 429
- **WHEN** a domain error indicating an exceeded third-party rate limit is raised during a request
- **THEN** the system returns HTTP 429 with a JSON error body identifying the rate limit

#### Scenario: Upstream service failure produces 502 or 503
- **WHEN** a domain error indicating that a third-party service failed or is unavailable is raised during a request
- **THEN** the system returns a 5xx status indicating an upstream dependency failure, and never a 4xx status

#### Scenario: Route-raised domain error needs no local mapping
- **WHEN** a handler raises a domain error without catching or re-statusing it
- **THEN** the system still returns that error's own status code to the client

### Requirement: Error Log Sanitization
The system SHALL pass all error log records through its secret-scrubbing logic
before writing them, so that credentials, bearer tokens, and encrypted token
material are redacted from error output. Sensitive values SHALL be redacted by
key name and by value pattern regardless of which code path produced the log
record.

#### Scenario: Error log containing a sensitive key is redacted
- **WHEN** an error is logged with a payload containing a key whose name matches a known sensitive key such as `access_token`, `encrypted_token`, or `password`
- **THEN** the written log record shows the key with its value redacted

#### Scenario: Error log containing a token-shaped value is redacted
- **WHEN** an error is logged with a value that matches a known secret pattern, such as a bearer or GitHub token value
- **THEN** the written log record shows the redacted placeholder rather than the secret value

#### Scenario: Redaction applies to unhandled exception records
- **WHEN** an unhandled exception is logged with the request context
- **THEN** the resulting log record, including its traceback text, passes through the same scrubbing logic as other error records
