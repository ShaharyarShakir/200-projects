# VM API Specification

## Purpose

Exposes a secure server-side REST API endpoint for fetching microVM status and details from the vmsan command adapter to frontend consumers.

## Requirements

### Requirement: MicroVM List Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms` that returns the list of microVMs retrieved from the vmsan adapter, and returns standardized structured errors upon failure.

#### Scenario: Successful VM retrieval
- **WHEN** a client performs a `GET` request to `/api/vms` and the vmsan adapter succeeds
- **THEN** the endpoint returns HTTP 200 with a JSON body shaped as `{ "vms": VM[] }`

#### Scenario: Adapter failure response
- **WHEN** a client performs a `GET` request to `/api/vms` and the vmsan adapter encounters an execution error
- **THEN** the endpoint returns HTTP 500 with a structured JSON error response `{ "error": { "code": "VMSAN_COMMAND_FAILED", "message": string } }` without exposing internal server stack traces, host paths, or environment variables

### Requirement: MicroVM Creation Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms` that validates resource parameters and creates a new microVM via the vmsan adapter.

#### Scenario: Successful VM creation
- **WHEN** a client sends a `POST` request to `/api/vms` with valid configuration (e.g. `runtime: "node22"`, `vcpus: 2`, `memoryMiB: 512`)
- **THEN** the endpoint invokes the adapter to create the microVM and returns HTTP 201 or HTTP 200 with `{ "success": true, "result": ... }` or structured creation confirmation

#### Scenario: Missing or malformed JSON payload
- **WHEN** a client sends a `POST` request to `/api/vms` with an empty body, malformed JSON, or non-JSON content-type
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

#### Scenario: Invalid resource parameters
- **WHEN** a client sends a `POST` request with an unsupported runtime (e.g. `runtime: "invalid"`), invalid vCPUs (`vcpus < 1` or non-integer), or invalid memory (`memoryMiB < 128` or non-integer)
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` detailing the validation failure

#### Scenario: Unknown or disallowed extra properties
- **WHEN** a client sends a `POST` request containing arbitrary fields (such as `command`, `flags`, or arbitrary shell strings)
- **THEN** the endpoint strips or ignores arbitrary fields and only forwards validated whitelist properties to the adapter

### Requirement: MicroVM Start Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/start` that validates the VM ID and starts the specified microVM.

#### Scenario: Successful VM start
- **WHEN** a client sends a `POST` request to `/api/vms/:id/start` with a valid, existing VM ID
- **THEN** the endpoint invokes `startVM` on the adapter and returns HTTP 200 with `{ "success": true, "vmId": string }`

#### Scenario: Start non-existent VM
- **WHEN** a client sends a `POST` request to start a VM that does not exist or is not found by vmsan
- **THEN** the endpoint returns HTTP 404 with error code `VM_NOT_FOUND`

#### Scenario: Invalid VM state for start
- **WHEN** a client sends a `POST` request to start a VM that is already running or in an incompatible state
- **THEN** the endpoint returns HTTP 409 with error code `INVALID_VM_STATE` or `OPERATION_CONFLICT`

### Requirement: MicroVM Stop Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/stop` that validates the VM ID and stops the specified microVM.

#### Scenario: Successful VM stop
- **WHEN** a client sends a `POST` request to `/api/vms/:id/stop` with a valid, running VM ID
- **THEN** the endpoint invokes `stopVM` on the adapter and returns HTTP 200 with `{ "success": true, "vmId": string }`

#### Scenario: Stop non-existent VM
- **WHEN** a client sends a `POST` request to stop a VM that does not exist
- **THEN** the endpoint returns HTTP 404 with error code `VM_NOT_FOUND`

#### Scenario: Stop VM in invalid state
- **WHEN** a client sends a `POST` request to stop a VM that is already stopped or in an incompatible state
- **THEN** the endpoint returns HTTP 409 with error code `INVALID_VM_STATE` or `OPERATION_CONFLICT`

### Requirement: MicroVM Deletion Endpoint
The system SHALL expose an HTTP DELETE endpoint at `/api/vms/:id` that validates the VM ID and removes the specified microVM.

#### Scenario: Successful VM removal
- **WHEN** a client sends a `DELETE` request to `/api/vms/:id` with a valid VM ID
- **THEN** the endpoint invokes `removeVM` on the adapter and returns HTTP 200 with `{ "success": true, "vmId": string }`

#### Scenario: Remove non-existent VM
- **WHEN** a client sends a `DELETE` request for a VM that does not exist
- **THEN** the endpoint returns HTTP 404 with error code `VM_NOT_FOUND`

#### Scenario: Remove running VM conflict
- **WHEN** a client sends a `DELETE` request for a VM that cannot be removed because it is running
- **THEN** the endpoint returns HTTP 409 with error code `OPERATION_CONFLICT`

### Requirement: Uniform Error Response and Status Code Mapping
The system SHALL return all API error responses in a uniform JSON schema `{ "error": { "code": string, "message": string } }` mapped to appropriate HTTP status codes without exposing internal system details, raw sudo output, or sensitive host environments.

#### Scenario: Validation error mapping
- **WHEN** a request fails route parameter or request body validation
- **THEN** the endpoint returns HTTP 400 with `{ "error": { "code": "INVALID_REQUEST", "message": "<descriptive message>" } }`

#### Scenario: Not found error mapping
- **WHEN** an operation targets a microVM that does not exist
- **THEN** the endpoint returns HTTP 404 with `{ "error": { "code": "VM_NOT_FOUND", "message": "<descriptive message>" } }`

#### Scenario: Conflict error mapping
- **WHEN** an operation fails due to invalid VM lifecycle state or conflict
- **THEN** the endpoint returns HTTP 409 with `{ "error": { "code": "INVALID_VM_STATE", "message": "<descriptive message>" } }`

#### Scenario: Service unavailable error mapping
- **WHEN** the `vmsan` executable is missing or inaccessible on the host
- **THEN** the endpoint returns HTTP 503 with `{ "error": { "code": "VMSAN_UNAVAILABLE", "message": "<descriptive message>" } }`

#### Scenario: Privilege escalation error mapping
- **WHEN** a privileged command fails because passwordless sudo is not configured or sudo requires a password in non-interactive mode
- **THEN** the endpoint returns HTTP 503 or HTTP 500 with `{ "error": { "code": "VMSAN_UNAVAILABLE", "message": "vmsan requires configured privilege escalation (passwordless sudo)" } }` without exposing raw sudo stderr or terminal prompt text

#### Scenario: Command execution failure error mapping
- **WHEN** a `vmsan` execution fails with an unexpected exit code or generic failure
- **THEN** the endpoint returns HTTP 500 with `{ "error": { "code": "VMSAN_COMMAND_FAILED", "message": "<sanitized error message>" } }`

### Requirement: Route Parameter Validation and Injection Defense
The system SHALL validate dynamic VM ID path parameters against strict character constraints (`^[a-zA-Z0-9_-]{1,64}$`) and reject command injection sequences before invoking adapter functions.

#### Scenario: Malicious VM ID rejection
- **WHEN** a request contains shell metacharacters, directory traversal tokens, or separators (e.g. `;`, `&&`, `|`, `$()`, `../`) in the `:id` parameter
- **THEN** the endpoint rejects the request with HTTP 400 and error code `INVALID_REQUEST` without calling the vmsan adapter
