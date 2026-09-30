# Spec Delta

## ADDED Requirements

### Requirement: Single MicroVM Fetch Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms/:id` that validates the VM ID parameter, queries the manager client for the requested microVM state, and returns the microVM presentation model, or appropriate structured error responses upon failure. The endpoint MUST NOT invoke a privileged command path, MUST NOT bypass the manager, and MUST NOT reveal the control socket path or process internals in error responses.

#### Scenario: Successful single VM retrieval
- **WHEN** a client performs a `GET` request to `/api/vms/:id` with a valid, existing VM ID
- **THEN** the endpoint delegates to the VM service and returns HTTP 200 with `{ "vm": VM }` containing the complete presentation model

#### Scenario: Single VM retrieval for non-existent VM
- **WHEN** a client performs a `GET` request to `/api/vms/:id` for a VM ID that does not exist in the manager state
- **THEN** the endpoint returns HTTP 404 with error code `VM_NOT_FOUND` and message `Virtual machine not found`

#### Scenario: Invalid VM ID rejected before querying manager
- **WHEN** a client performs a `GET` request to `/api/vms/:id` with an invalid ID containing disallowed characters or exceeding 64 characters
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` without querying the manager

#### Scenario: Manager unavailable during single VM retrieval
- **WHEN** a client performs a `GET` request to `/api/vms/:id` and the manager socket is unavailable or unresponsive
- **THEN** the endpoint returns HTTP 503 with error code `MANAGER_UNAVAILABLE` without exposing socket paths or filesystem errors
