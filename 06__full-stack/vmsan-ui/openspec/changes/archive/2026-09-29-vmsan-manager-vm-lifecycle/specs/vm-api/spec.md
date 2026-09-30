# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Lifecycle Operations Are Explicitly Unavailable
**Reason**: Replaced by active microVM lifecycle routing over the `vmsan-manager` control socket.
**Migration**: Call the active lifecycle endpoints (`POST /api/vms`, `POST /api/vms/:id/start`, `POST /api/vms/:id/stop`, `DELETE /api/vms/:id`) which now execute operations through the manager.
