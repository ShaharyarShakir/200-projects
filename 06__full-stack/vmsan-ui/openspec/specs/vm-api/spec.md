# VM API Specification

## Purpose

Exposes a secure server-side REST API endpoint for fetching microVM status and details from the vmsan command adapter to frontend consumers.

## Requirements

### Requirement: MicroVM List Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms` that returns the list of microVMs obtained from the manager over its control socket, and returns standardized structured errors upon failure. The endpoint MUST NOT reach vmsan through the CLI adapter, MUST NOT bypass the manager, and MUST NOT reveal the control socket's path, filesystem error codes, or process internals in an error response.

#### Scenario: Successful VM retrieval
- **WHEN** a client performs a `GET` request to `/api/vms` and the manager serves the list
- **THEN** the endpoint returns HTTP 200 with a JSON body shaped as `{ "vms": VM[] }` whose entries correspond to the manager's redacted projection of native vmsan state

#### Scenario: Request is served through the manager
- **WHEN** a `GET` request to `/api/vms` is handled
- **THEN** the VM records are obtained over the manager's control socket rather than by invoking the vmsan CLI

#### Scenario: Adapter failure response
- **WHEN** a client performs a `GET` request to `/api/vms` and the manager reports a failure or cannot be reached
- **THEN** the endpoint returns a structured JSON error response with a stable error code, without exposing internal server stack traces, host paths, control socket paths, or environment variables

### Requirement: MicroVM Creation Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms` that validates resource parameters and forwards creation requests to the manager over its control socket. The endpoint MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM creation
- **WHEN** a client sends a `POST` request to `/api/vms` with valid configuration (e.g. `runtime: "node22"`, `vcpus: 2`, `memoryMiB: 512`)
- **THEN** the endpoint delegates to the manager client and returns HTTP 201 with the created VM's presentation model

#### Scenario: Missing or malformed JSON payload
- **WHEN** a client sends a `POST` request to `/api/vms` with an empty body, malformed JSON, or non-JSON content-type
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

#### Scenario: Invalid resource parameters
- **WHEN** a client sends a `POST` request with an unsupported runtime (e.g. `runtime: "invalid"`), invalid vCPUs (`vcpus < 1` or non-integer), or invalid memory (`memoryMiB < 64` or non-integer)
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` detailing the validation failure

#### Scenario: Unknown or disallowed extra properties
- **WHEN** a client sends a `POST` request containing arbitrary fields (such as `command`, `flags`, or arbitrary shell strings)
- **THEN** the endpoint strips or ignores arbitrary fields and passes only the validated allowed options

#### Scenario: No privileged command is invoked
- **WHEN** a creation request is handled
- **THEN** no shell process is spawned, no privilege escalation is attempted, and the request is handled exclusively via the manager Unix socket

### Requirement: MicroVM Start Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/start` that validates the VM ID and forwards the start request to the manager over its control socket. The endpoint MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM start
- **WHEN** a client sends a `POST` request to `/api/vms/:id/start` with a valid, existing VM ID for a stopped VM
- **THEN** the endpoint delegates to the manager client and returns HTTP 200 with the updated VM's presentation model

#### Scenario: Start non-existent VM
- **WHEN** a client sends a `POST` request to start a VM that does not exist
- **THEN** the endpoint returns HTTP 404 with error code `VM_NOT_FOUND`

#### Scenario: Invalid VM state for start
- **WHEN** a client sends a `POST` request to start a VM that is already running or in an incompatible state
- **THEN** the endpoint returns HTTP 409 with error code `INVALID_VM_STATE`

#### Scenario: Invalid VM ID is rejected before the availability response
- **WHEN** a client sends a start request with a VM ID containing disallowed characters
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` without reaching the manager socket

### Requirement: MicroVM Stop Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/stop` that validates the VM ID and forwards the stop request to the manager over its control socket. The endpoint MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM stop
- **WHEN** a client sends a `POST` request to `/api/vms/:id/stop` with a valid, existing VM ID for a running VM
- **THEN** the endpoint delegates to the manager client and returns HTTP 200 with the updated VM's presentation model

#### Scenario: Stop non-existent VM
- **WHEN** a client sends a `POST` request to stop a VM that does not exist
- **THEN** the endpoint returns HTTP 404 with error code `VM_NOT_FOUND`

#### Scenario: Stop VM in invalid state
- **WHEN** a client sends a `POST` request to stop a VM that is already stopped or in an incompatible state
- **THEN** the endpoint returns HTTP 409 with error code `INVALID_VM_STATE`

#### Scenario: Invalid VM ID is rejected before the availability response
- **WHEN** a client sends a stop request with a VM ID containing disallowed characters
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` without reaching the manager socket

### Requirement: MicroVM Deletion Endpoint
The system SHALL expose an HTTP DELETE endpoint at `/api/vms/:id` that validates the VM ID and forwards the removal request to the manager over its control socket. The endpoint MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM removal
- **WHEN** a client sends a `DELETE` request to `/api/vms/:id` with a valid VM ID for a stopped VM
- **THEN** the endpoint delegates to the manager client and returns HTTP 200 with `{ "removed": true, "id": <id> }`

#### Scenario: Remove non-existent VM
- **WHEN** a client sends a `DELETE` request for a VM that does not exist
- **THEN** the endpoint returns HTTP 404 with error code `VM_NOT_FOUND`

#### Scenario: Remove running VM conflict
- **WHEN** a client sends a `DELETE` request for a VM that cannot be removed because it is running
- **THEN** the endpoint returns HTTP 409 with error code `INVALID_VM_STATE`

#### Scenario: Metadata is preserved when removal is unavailable
- **WHEN** a delete request fails or is rejected before execution
- **THEN** no metadata record for that VM is corrupted or removed as a side effect

#### Scenario: Invalid VM ID is rejected before the availability response
- **WHEN** a client sends a delete request with a VM ID containing disallowed characters
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` without reaching the manager socket

### Requirement: Uniform Error Response and Status Code Mapping
The system SHALL return all API error responses in a uniform JSON schema `{ "error": { "code": string, "message": string } }` mapped to appropriate HTTP status codes without exposing internal system details, raw command output, control socket paths, filesystem error codes, or sensitive host environments. A condition in which the manager cannot be reached MUST map to the service-unavailable status, and the mapping MUST NOT contain a branch that diagnoses passwordless-sudo misconfiguration.

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
- **WHEN** a request requires the manager and the manager's control socket is missing, inaccessible, or not responding
- **THEN** the endpoint returns HTTP 503 with `{ "error": { "code": "MANAGER_UNAVAILABLE", "message": "<descriptive message>" } }` that discloses no control socket path, filesystem error code, or stack trace

#### Scenario: Privilege escalation error mapping
- **WHEN** the error mapping is inspected and an operation fails
- **THEN** no branch diagnoses missing passwordless sudo and no response message instructs the operator to configure privilege escalation, because no sudo path exists

#### Scenario: Manager-reported failures are distinguishable from unavailability
- **WHEN** the manager is reachable but answers a request with a failure frame
- **THEN** the endpoint reports that failure's own code rather than reporting the manager as unavailable

#### Scenario: Identical response for absent, refused, and unresponsive managers
- **WHEN** the manager is absent, refuses the connection, and accepts but does not answer, in turn
- **THEN** the client-facing status, error code, and message are the same in all three cases

#### Scenario: Command execution failure error mapping
- **WHEN** an operation fails for a reason other than validation, availability, or conflict
- **THEN** the endpoint returns HTTP 500 with `{ "error": { "code": "VMSAN_COMMAND_FAILED", "message": "<sanitized error message>" } }` that names no host path or environment value

### Requirement: Route Parameter Validation and Injection Defense
The system SHALL validate dynamic VM ID path parameters against strict character constraints (`^[a-zA-Z0-9_-]{1,64}$`) and reject command injection sequences before invoking adapter functions.

#### Scenario: Malicious VM ID rejection
- **WHEN** a request contains shell metacharacters, directory traversal tokens, or separators (e.g. `;`, `&&`, `|`, `$()`, `../`) in the `:id` parameter
- **THEN** the endpoint rejects the request with HTTP 400 and error code `INVALID_REQUEST` without calling the vmsan adapter
