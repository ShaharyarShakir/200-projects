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
The system SHALL emit structured logs with timestamp, log level, message, and execution context for all incoming API requests and operational events.

#### Scenario: API request logging
- **WHEN** an HTTP request is processed by the backend
- **THEN** the application logs the HTTP method, request path, status code, and latency in a consistent structured format
