# Spec Delta

## MODIFIED Requirements

### Requirement: MicroVM List Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms` that returns the list of microVMs merged with custom name metadata obtained from the metadata store and manager over its control socket, and returns standardized structured errors upon failure. The endpoint MUST NOT reach vmsan through the CLI adapter, MUST NOT bypass the manager, and MUST NOT reveal the control socket's path, filesystem error codes, or process internals in an error response.

#### Scenario: Successful VM retrieval
- **WHEN** a client performs a `GET` request to `/api/vms` and the manager serves the list
- **THEN** the endpoint returns HTTP 200 with a JSON body shaped as `{ "vms": VM[] }` whose entries correspond to the manager's redacted projection of native vmsan state with `name` and `vmsanId` populated

#### Scenario: VM without custom name in metadata
- **WHEN** a microVM exists in `vmsan` but has no corresponding entry in the metadata store
- **THEN** the endpoint returns the microVM with `name` defaulting to its `vmsanId` and `vmsanId` explicitly populated

#### Scenario: Request is served through the manager
- **WHEN** a `GET` request to `/api/vms` is handled
- **THEN** the VM records are obtained over the manager's control socket rather than by invoking the vmsan CLI

#### Scenario: Adapter failure response
- **WHEN** a client performs a `GET` request to `/api/vms` and the manager reports a failure or cannot be reached
- **THEN** the endpoint returns a structured JSON error response with a stable error code, without exposing internal server stack traces, host paths, control socket paths, or environment variables

### Requirement: MicroVM Creation Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms` that validates resource parameters and custom name, checks for case-insensitive name collisions, and forwards creation requests through the application VM service to the manager over its control socket, associating the custom name in the metadata store. The endpoint MUST accept validated creation options (`name`, `runtime`, `vcpus`, `memoryMib` or `memoryMiB`, `diskSizeGb`, `networkPolicy`, `timeoutMs`), MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM creation
- **WHEN** a client sends a `POST` request to `/api/vms` with valid configuration and custom name (e.g. `name: "node-dev"`, `runtime: "node22"`, `vcpus: 2`, `memoryMib: 512`, `diskSizeGb: 10`, `networkPolicy: "deny-all"`, `timeoutMs: 3600000`)
- **THEN** the endpoint delegates to the VM service and returns HTTP 201 with the created VM's presentation model formatted as `{ "vm": VM }`

#### Scenario: Duplicate custom name conflict
- **WHEN** a client sends a `POST` request with a custom name that already exists (evaluated case-insensitively)
- **THEN** the endpoint returns HTTP 409 with error code `VM_NAME_ALREADY_EXISTS` and message `"A VM with this name already exists"` without invoking the manager creation

#### Scenario: Invalid custom name format
- **WHEN** a client sends a `POST` request with an invalid name (containing spaces, shell metacharacters, or the reserved prefix `vm-`)
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` detailing the name validation error

#### Scenario: Missing or malformed JSON payload
- **WHEN** a client sends a `POST` request to `/api/vms` with an empty body, malformed JSON, or non-JSON content-type
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

#### Scenario: Invalid resource parameters
- **WHEN** a client sends a `POST` request with an unsupported runtime (e.g. `runtime: "invalid"`), invalid vCPUs (`vcpus < 1` or non-integer), invalid memory (`memoryMib < 64` or non-integer), invalid disk (`diskSizeGb < 1` or non-integer), invalid network policy, or invalid timeout
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` detailing the validation failure

#### Scenario: Storage limits validation (0 GB, -1 GB, 21 GB)
- **WHEN** a client sends a creation request with `diskSizeGb: 0`, `diskSizeGb: -1`, or `diskSizeGb: 21`
- **THEN** the endpoint rejects the request with HTTP 400 and error code `INVALID_REQUEST`

#### Scenario: Unknown or disallowed extra properties
- **WHEN** a client sends a `POST` request containing arbitrary fields (such as `command`, `flags`, or arbitrary shell strings)
- **THEN** the endpoint strips or ignores arbitrary fields and passes only the validated allowed options

#### Scenario: No privileged command is invoked
- **WHEN** a creation request is handled
- **THEN** no shell process is spawned, no privilege escalation is attempted, and the request is handled exclusively via the manager Unix socket

### Requirement: MicroVM Deletion Endpoint
The system SHALL expose an HTTP DELETE endpoint at `/api/vms/:id` that validates the VM ID, forwards the removal request through the VM service to the manager over its control socket, and removes the associated name metadata only after successful removal from the manager. The endpoint MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM removal
- **WHEN** a client sends a `DELETE` request to `/api/vms/:id` with a valid VM ID for a stopped VM
- **THEN** the endpoint delegates to the VM service, deletes the associated name mapping from the metadata store, and returns HTTP 200 with `{ "removed": true, "vmId": <id> }`

#### Scenario: Preservation of metadata upon removal failure
- **WHEN** a delete request fails or is rejected (e.g. because the VM is running or manager fails)
- **THEN** the endpoint returns the appropriate error status and preserves the metadata mapping intact

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

#### Scenario: Name conflict error mapping
- **WHEN** a creation or rename request conflicts with an existing VM name
- **THEN** the endpoint returns HTTP 409 with `{ "error": { "code": "VM_NAME_ALREADY_EXISTS", "message": "A VM with this name already exists" } }`

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
