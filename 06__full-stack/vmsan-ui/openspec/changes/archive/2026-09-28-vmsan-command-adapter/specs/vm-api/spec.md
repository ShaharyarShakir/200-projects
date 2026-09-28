# Spec Delta

## Purpose

Exposes a secure server-side REST API endpoint for fetching microVM status and details from the vmsan command adapter to frontend consumers.

## ADDED Requirements

### Requirement: MicroVM List Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms` that returns the list of microVMs retrieved from the vmsan adapter.

#### Scenario: Successful VM retrieval
- **WHEN** a client performs a `GET` request to `/api/vms` and the vmsan adapter succeeds
- **THEN** the endpoint returns HTTP 200 with a JSON body shaped as `{ "vms": VM[] }`

#### Scenario: Adapter failure response
- **WHEN** a client performs a `GET` request to `/api/vms` and the vmsan adapter encounters an execution error
- **THEN** the endpoint returns HTTP 500 with a structured JSON error response without exposing internal server stack traces
