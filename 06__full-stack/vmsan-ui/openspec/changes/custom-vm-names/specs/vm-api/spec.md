# Spec Delta

## MODIFIED Requirements

### Requirement: MicroVM List Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms` that returns the list of microVMs merged with custom name metadata retrieved from the metadata store and vmsan adapter, and returns standardized structured errors upon failure.

#### Scenario: Successful VM retrieval
- **WHEN** a client performs a `GET` request to `/api/vms` and the vmsan adapter succeeds
- **THEN** the endpoint returns HTTP 200 with a JSON body shaped as `{ "vms": VM[] }` where each VM object contains `id`, `name`, `vmsanId`, `status`, `memoryMiB`, `vcpus`, `runtime`, and `age`

#### Scenario: VM without custom name in metadata
- **WHEN** a microVM exists in `vmsan` but has no corresponding entry in the metadata store
- **THEN** the endpoint returns the microVM with `name` defaulting to its `vmsanId` and `vmsanId` explicitly populated

#### Scenario: Adapter failure response
- **WHEN** a client performs a `GET` request to `/api/vms` and the vmsan adapter encounters an execution error
- **THEN** the endpoint returns HTTP 500 with a structured JSON error response `{ "error": { "code": "VMSAN_COMMAND_FAILED", "message": string } }` without exposing internal server stack traces, host paths, or environment variables

### Requirement: MicroVM Creation Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms` that validates resource parameters and custom name, checks for case-insensitive name collisions, creates a new microVM via the vmsan adapter, and stores the name mapping in the metadata store.

#### Scenario: Successful VM creation
- **WHEN** a client sends a `POST` request to `/api/vms` with valid configuration and custom name (e.g. `name: "node-dev"`, `runtime: "node22"`, `vcpus: 2`, `memoryMiB: 512`)
- **THEN** the endpoint creates the microVM via `vmsan`, associates the generated `vmsanId` with the custom name in the metadata store, and returns HTTP 201 or HTTP 200 with `{ "id": string, "name": "node-dev", "vmsanId": string, "status": "running", ... }`

#### Scenario: Duplicate custom name conflict
- **WHEN** a client sends a `POST` request with a custom name that already exists (evaluated case-insensitively)
- **THEN** the endpoint returns HTTP 409 with error code `VM_NAME_ALREADY_EXISTS` and message `"A VM with this name already exists"` without invoking the vmsan adapter

#### Scenario: Invalid custom name format
- **WHEN** a client sends a `POST` request with an invalid name (containing spaces, shell metacharacters, or the reserved prefix `vm-`)
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` detailing the name validation error

#### Scenario: Missing or malformed JSON payload
- **WHEN** a client sends a `POST` request to `/api/vms` with an empty body, malformed JSON, or non-JSON content-type
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

#### Scenario: Invalid resource parameters
- **WHEN** a client sends a `POST` request with an unsupported runtime (e.g. `runtime: "invalid"`), invalid vCPUs (`vcpus < 1` or non-integer), or invalid memory (`memoryMiB < 128` or non-integer)
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` detailing the validation failure

#### Scenario: Unknown or disallowed extra properties
- **WHEN** a client sends a `POST` request containing arbitrary fields (such as `command`, `flags`, or arbitrary shell strings)
- **THEN** the endpoint strips or ignores arbitrary fields and only forwards validated whitelist properties to the adapter

### Requirement: MicroVM Deletion Endpoint
The system SHALL expose an HTTP DELETE endpoint at `/api/vms/:id` that validates the VM ID, invokes `removeVM` on the vmsan adapter, and removes the name metadata only after successful removal from vmsan.

#### Scenario: Successful VM removal
- **WHEN** a client sends a `DELETE` request to `/api/vms/:id` with a valid VM ID and `vmsan remove` succeeds
- **THEN** the endpoint deletes the associated name mapping from the metadata store and returns HTTP 200 with `{ "success": true, "vmId": string }`

#### Scenario: Preservation of metadata upon removal failure
- **WHEN** a client sends a `DELETE` request for a VM but `vmsan remove` fails (e.g. because the VM is running or locked)
- **THEN** the endpoint returns the appropriate error status and preserves the metadata mapping intact

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
- **WHEN** the `vmsan` executable is missing or inaccessible on the host
- **THEN** the endpoint returns HTTP 503 with `{ "error": { "code": "VMSAN_UNAVAILABLE", "message": "<descriptive message>" } }`

#### Scenario: Privilege escalation error mapping
- **WHEN** a privileged command fails because passwordless sudo is not configured or sudo requires a password in non-interactive mode
- **THEN** the endpoint returns HTTP 503 or HTTP 500 with `{ "error": { "code": "VMSAN_UNAVAILABLE", "message": "vmsan requires configured privilege escalation (passwordless sudo)" } }` without exposing raw sudo stderr or terminal prompt text

#### Scenario: Command execution failure error mapping
- **WHEN** a `vmsan` execution fails with an unexpected exit code or generic failure
- **THEN** the endpoint returns HTTP 500 with `{ "error": { "code": "VMSAN_COMMAND_FAILED", "message": "<sanitized error message>" } }`
