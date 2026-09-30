# Spec Delta

## ADDED Requirements

### Requirement: Application VM Domain Model and Service Layer
The Next.js application SHALL encapsulate all microVM operations inside a dedicated `VmService` domain layer that consumes the manager client and returns sanitized, decoupled application VM models (`Vm`, `VmStatus`, `VmNetwork`). Route handlers MUST delegate VM lifecycle operations (`listVms`, `createVm`, `startVm`, `stopVm`, `removeVm`) to `VmService` rather than calling `ManagerClient` or opening Unix domain sockets directly. Server-side manager protocol types, Node.js net sockets, and native vmsan dependencies MUST NOT be exposed or imported into client/browser bundles.

#### Scenario: Clean service abstraction
- **WHEN** any VM lifecycle API route receives a request
- **THEN** the route handler invokes `VmService` methods to execute the business operation rather than managing socket connections or raw RPC calls directly

#### Scenario: Presentation model sanitization
- **WHEN** VM records are retrieved, created, or modified through `VmService`
- **THEN** the resulting `Vm` objects omit internal host details including `agentToken`, host TAP interfaces, host filesystem paths, Jailer paths, and process IDs

#### Scenario: Client type separation
- **WHEN** browser components or API client consumers import VM types
- **THEN** only application domain interfaces (`Vm`, `VmStatus`, `CreateVmInput`, `VmNetwork`) are referenced, with no dependency on server-only manager or socket types

## MODIFIED Requirements

### Requirement: MicroVM Creation Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms` that validates resource parameters and forwards creation requests through the application VM service to the manager over its control socket. The endpoint MUST accept validated creation options (`runtime`, `vcpus`, `memoryMib` or `memoryMiB`, `diskSizeGb`, `networkPolicy`, `timeoutMs`), MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM creation
- **WHEN** a client sends a `POST` request to `/api/vms` with valid configuration (e.g. `runtime: "node22"`, `vcpus: 2`, `memoryMib: 512`, `diskSizeGb: 10`, `networkPolicy: "deny-all"`, `timeoutMs: 3600000`)
- **THEN** the endpoint delegates to the VM service and returns HTTP 201 with the created VM's presentation model formatted as `{ "vm": VM }`

#### Scenario: Missing or malformed JSON payload
- **WHEN** a client sends a `POST` request to `/api/vms` with an empty body, malformed JSON, or non-JSON content-type
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

#### Scenario: Invalid resource parameters
- **WHEN** a client sends a `POST` request with an unsupported runtime (e.g. `runtime: "invalid"`), invalid vCPUs (`vcpus < 1` or non-integer), invalid memory (`memoryMib < 64` or non-integer), invalid disk (`diskSizeGb < 1` or non-integer), invalid network policy, or invalid timeout
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST` detailing the validation failure

#### Scenario: Unknown or disallowed extra properties
- **WHEN** a client sends a `POST` request containing arbitrary fields (such as `command`, `flags`, or arbitrary shell strings)
- **THEN** the endpoint strips or ignores arbitrary fields and passes only the validated allowed options

#### Scenario: No privileged command is invoked
- **WHEN** a creation request is handled
- **THEN** no shell process is spawned, no privilege escalation is attempted, and the request is handled exclusively via the manager Unix socket

### Requirement: MicroVM Deletion Endpoint
The system SHALL expose an HTTP DELETE endpoint at `/api/vms/:id` that validates the VM ID and forwards the removal request through the VM service to the manager over its control socket. The endpoint MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM removal
- **WHEN** a client sends a `DELETE` request to `/api/vms/:id` with a valid VM ID for a stopped VM
- **THEN** the endpoint delegates to the VM service and returns HTTP 200 with `{ "removed": true, "vmId": <id> }`

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
