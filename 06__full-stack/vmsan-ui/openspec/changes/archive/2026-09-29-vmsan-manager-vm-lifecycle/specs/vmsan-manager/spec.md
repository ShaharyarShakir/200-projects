# Spec Delta

## ADDED Requirements

### Requirement: MicroVM Creation RPC Method
The system SHALL implement a `vm.create` RPC method on the manager that validates creation parameters, invokes the native `VMService.create()` operation on the single long-lived native vmsan service instance, and returns a sanitized VM summary. The method MUST NOT accept arbitrary filesystem paths or Firecracker arguments from the client.

#### Scenario: Successful VM creation
- **WHEN** a client sends a `vm.create` request with valid options (e.g. `runtime: "node22"`, `vcpus: 2`, `memoryMib: 512`, `diskSizeGb: 2`, `networkPolicy: "allow-all"`)
- **THEN** the manager calls the native vmsan service `create` method and returns a success response containing the sanitized VM summary

#### Scenario: Native creation failure
- **WHEN** the native vmsan service fails to create the VM (e.g. underlying resource exhaustion or jailer error)
- **THEN** the manager returns a failure response with error code `VM_OPERATION_FAILED` and a sanitized error message

### Requirement: MicroVM Start RPC Method
The system SHALL implement a `vm.start` RPC method on the manager that validates the target `vmId`, invokes the native `VMService.start()` operation on the native service, and returns the sanitized VM state.

#### Scenario: Successful VM start
- **WHEN** a client sends a `vm.start` request with a valid, existing `vmId` for a stopped VM
- **THEN** the manager starts the VM via the native service and returns a success response with the sanitized VM state

#### Scenario: Start non-existent VM
- **WHEN** a client sends a `vm.start` request for a `vmId` that does not exist
- **THEN** the manager returns a failure response with error code `VM_NOT_FOUND`

#### Scenario: Start already running VM
- **WHEN** a client sends a `vm.start` request for a VM that is already in `running` state
- **THEN** the manager returns a failure response with error code `VM_INVALID_STATE`

### Requirement: MicroVM Stop RPC Method
The system SHALL implement a `vm.stop` RPC method on the manager that validates the target `vmId`, invokes the native `VMService.stop()` operation on the native service, and returns the sanitized VM state.

#### Scenario: Successful VM stop
- **WHEN** a client sends a `vm.stop` request with a valid, existing `vmId` for a running VM
- **THEN** the manager stops the VM via the native service and returns a success response with the sanitized VM state

#### Scenario: Stop non-existent VM
- **WHEN** a client sends a `vm.stop` request for a `vmId` that does not exist
- **THEN** the manager returns a failure response with error code `VM_NOT_FOUND`

#### Scenario: Stop already stopped VM
- **WHEN** a client sends a `vm.stop` request for a VM that is already stopped
- **THEN** the manager returns a failure response with error code `VM_INVALID_STATE`

### Requirement: MicroVM Removal RPC Method
The system SHALL implement a `vm.remove` RPC method on the manager that validates the target `vmId`, invokes the native `VMService.remove()` operation on the native service, and returns a confirmation result `{ "removed": true, "vmId": <vmId> }`.

#### Scenario: Successful VM removal
- **WHEN** a client sends a `vm.remove` request with a valid, existing `vmId` for a stopped VM
- **THEN** the manager removes the VM via the native service and returns `{ "removed": true, "vmId": <vmId> }`

#### Scenario: Remove non-existent VM
- **WHEN** a client sends a `vm.remove` request for a `vmId` that does not exist
- **THEN** the manager returns a failure response with error code `VM_NOT_FOUND`

#### Scenario: Remove running VM without force
- **WHEN** a client sends a `vm.remove` request for a VM that is currently running
- **THEN** the manager returns a failure response with error code `VM_INVALID_STATE`

### Requirement: Lifecycle Parameter Validation and Resource Bounds
The system SHALL validate all lifecycle request parameters strictly on the server before dispatching to the native vmsan service. `vcpus` SHALL be bounded to [1, 4], `memoryMib` to [64, 4096], `diskSizeGb` to [1, 20], `runtime` to the declared allow-list (`base`, `node22`, `node24`, `python3.13`), `networkPolicy` to (`allow-all`, `deny-all`, `custom`), and `timeoutMs` to [60000, 86400000]. Non-integer, NaN, Infinity, negative, unknown enum, or oversized values SHALL be rejected with `VALIDATION_ERROR`.

#### Scenario: Parameter outside permitted bounds
- **WHEN** a client sends `vm.create` with `vcpus: 0`, `vcpus: 8`, `memoryMib: 32`, or `memoryMib: 8192`
- **THEN** the manager rejects the request with error code `VALIDATION_ERROR` without calling the native service

#### Scenario: Disallowed runtime or network policy
- **WHEN** a client sends `vm.create` with `runtime: "unsupported-os"` or `networkPolicy: "promiscuous"`
- **THEN** the manager rejects the request with error code `VALIDATION_ERROR`

#### Scenario: Invalid VM ID format
- **WHEN** a client sends a lifecycle request with an empty, non-string, or malformed `vmId`
- **THEN** the manager rejects the request with error code `VALIDATION_ERROR`

### Requirement: Structured Error Code Mapping for Lifecycle Operations
The system SHALL map native errors and validation failures into standard protocol error codes: `INVALID_REQUEST`, `VALIDATION_ERROR`, `VM_NOT_FOUND`, `VM_INVALID_STATE`, `VM_OPERATION_FAILED`, and `INTERNAL_ERROR`. Raw stack traces and host filesystem paths MUST NOT be returned in client error responses.

#### Scenario: Formatted error response
- **WHEN** a lifecycle operation fails
- **THEN** the response is `{ "id": <request id>, "ok": false, "error": { "code": <string>, "message": <string> } }` where code is one of the standardized error categories

### Requirement: Response Sanitization for Lifecycle Operations
The system SHALL sanitize all VM records returned from lifecycle RPC methods using an explicit allow-list projection. Internal and sensitive fields including `agentToken`, `agentPort`, `chrootDir`, `kernel`, `rootfs`, `apiSocket`, `pid`, and jailer parameters MUST NOT be included in response payloads.

#### Scenario: Created or modified VM response contains no secrets
- **WHEN** `vm.create`, `vm.start`, or `vm.stop` returns a VM state
- **THEN** the returned object contains only allow-listed properties (`id`, `status`, `runtime`, `vcpuCount`, `memSizeMib`, `createdAt`, `snapshot`, `timeoutAt`, `tunnelHostnames`) and omits `agentToken` and host paths

## MODIFIED Requirements

### Requirement: Unprivileged Web Application Client
The system SHALL provide a Next.js-side client that reaches the manager exclusively over the manager's Unix socket using Node's Unix socket support, providing `health`, `list`, `createVm`, `startVm`, `stopVm`, and `removeVm` operations, and that MUST NOT import the `vmsan` package. The dependency direction SHALL be from the web application to the socket client to the manager, never directly to the native vmsan API.

#### Scenario: Client issues health over the socket
- **WHEN** the web application calls the manager client's health operation
- **THEN** it connects to the configured socket, sends a `health` request, and returns the manager's result

#### Scenario: Client issues list over the socket
- **WHEN** the web application calls the manager client's list operation
- **THEN** it connects to the configured socket, sends a `list` request, and returns the redacted VM records

#### Scenario: Client issues createVm over the socket
- **WHEN** the web application calls `createVm` with create options
- **THEN** it connects to the configured socket, sends a `vm.create` request with parameters, and returns the sanitized VM state

#### Scenario: Client issues startVm over the socket
- **WHEN** the web application calls `startVm` with a VM identifier
- **THEN** it connects to the configured socket, sends a `vm.start` request, and returns the sanitized VM state

#### Scenario: Client issues stopVm over the socket
- **WHEN** the web application calls `stopVm` with a VM identifier
- **THEN** it connects to the configured socket, sends a `vm.stop` request, and returns the sanitized VM state

#### Scenario: Client issues removeVm over the socket
- **WHEN** the web application calls `removeVm` with a VM identifier
- **THEN** it connects to the configured socket, sends a `vm.remove` request, and returns `{ "removed": true, "vmId": string }`

#### Scenario: Client does not import the native vmsan package
- **WHEN** the web application's manager client module graph is inspected
- **THEN** it contains no import of the `vmsan` package

#### Scenario: Manager unavailable
- **WHEN** the socket does not exist, cannot be connected to, or does not respond
- **THEN** the client raises a typed manager-unavailable error rather than hanging or returning a partial result

#### Scenario: Malformed manager response
- **WHEN** the manager returns a frame that is not parseable or does not match the response contract
- **THEN** the client raises a typed protocol error

#### Scenario: Manager reports a failure
- **WHEN** the manager returns a failure response
- **THEN** the client raises a typed error carrying the manager's error code and message

#### Scenario: Existing application API is preserved
- **WHEN** this capability is introduced
- **THEN** the existing `/api/vms` routes and the existing CLI-based adapter remain present and unchanged in behavior until a later phase migrates them
