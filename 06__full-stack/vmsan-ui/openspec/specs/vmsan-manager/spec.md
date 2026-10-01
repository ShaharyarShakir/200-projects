# Vmsan Manager Specification

## Purpose

Provides a privileged out-of-process manager that holds a single long-lived native vmsan service and exposes a minimal typed RPC protocol over a Unix domain socket, letting an unprivileged web application reach Firecracker without any sudo grant, shell command construction, or CLI output parsing.

## Requirements

### Requirement: Native vmsan Service Initialization
The system SHALL initialize the native vmsan service exactly once during manager startup, hold that single instance for the lifetime of the process, reuse it for every request, and release it on shutdown. It MUST obtain VM state by calling the native vmsan service directly and MUST NOT execute the `vmsan` executable, spawn a child process, or parse CLI output to service a request.

#### Scenario: Service initialized once at startup
- **WHEN** the manager completes startup
- **THEN** exactly one native vmsan service instance exists and is retained for subsequent requests

#### Scenario: Repeated list requests reuse the same instance
- **WHEN** multiple `list` requests are handled over the manager's lifetime
- **THEN** each is served from the already-initialized service without creating an additional service instance

#### Scenario: VM state is read from the native service
- **WHEN** a `list` request is served
- **THEN** the returned VM records are produced by the native service's listing operation rather than by executing the `vmsan` executable or parsing its textual output

#### Scenario: No child process is spawned to serve a request
- **WHEN** any supported request method is handled
- **THEN** the manager performs no process execution and no shell invocation

### Requirement: Unix Domain Socket Transport
The system SHALL accept control requests on a Unix domain socket using newline-delimited JSON framing. It MUST NOT bind or listen on any TCP address, and it MUST NOT create the socket with world-writable permissions.

#### Scenario: Manager accepts a connection on its Unix socket
- **WHEN** a client connects to the configured socket path
- **THEN** the manager accepts the connection and reads newline-delimited JSON request frames from it

#### Scenario: No TCP listener is opened
- **WHEN** the manager is running
- **THEN** it holds no listening TCP socket and rejects any attempt to reach it over a network address

#### Scenario: Socket permissions are restricted to the owner
- **WHEN** the manager creates its socket file
- **THEN** the socket's mode grants access to the owning user and group only and is never world-writable

#### Scenario: Stale socket file is replaced safely
- **WHEN** the socket path already exists as a leftover file from a previous run and the manager is starting
- **THEN** the manager removes the stale file only after confirming it is a socket and no live manager is listening on it, then creates a fresh socket

### Requirement: Control Protocol Types
The system SHALL define a closed, strongly typed request and response contract. Requests SHALL be discriminated by a `method` field, and every response SHALL carry the originating request identifier with an explicit success flag, a typed `result` on success, or a typed `code` and `message` on failure.

#### Scenario: Typed health request
- **WHEN** a client sends a request with method `health` and a string identifier
- **THEN** the message conforms to the manager request type with `method` narrowed to `health`

#### Scenario: Typed list request
- **WHEN** a client sends a request with method `list` and a string identifier
- **THEN** the message conforms to the manager request type with `method` narrowed to `list`

#### Scenario: Success response shape
- **WHEN** a request is handled successfully
- **THEN** the response is `{ "id": <request id>, "ok": true, "result": <typed result> }`

#### Scenario: Failure response shape
- **WHEN** a request cannot be served
- **THEN** the response is `{ "id": <request id>, "ok": false, "error": { "code": <string>, "message": <string> } }`

### Requirement: Request Validation Before Dispatch
The system SHALL validate every request frame before dispatching it to a method handler, and SHALL reject frames that are malformed, oversized, missing a usable identifier, or name an unrecognized method. Validation failures SHALL be answered with a structured error rather than a connection reset, and the manager SHALL continue serving subsequent requests on the same connection.

#### Scenario: Malformed JSON frame
- **WHEN** a client sends a frame that is not parseable JSON
- **THEN** the manager responds with a structured parse error response and performs no method dispatch

#### Scenario: Missing request identifier
- **WHEN** a client sends a structurally valid frame whose `id` is absent or not a string
- **THEN** the manager responds with a structured validation error and performs no method dispatch

#### Scenario: Unknown method
- **WHEN** a client sends a well-formed request naming a method that is not implemented
- **THEN** the manager responds with a structured unknown-method error and performs no method dispatch

#### Scenario: Oversized request
- **WHEN** a client sends a request frame whose encoded size exceeds the configured maximum request size
- **THEN** the manager rejects it with a structured request-too-large error without buffering the whole frame as an accepted request

#### Scenario: Malformed frame boundaries
- **WHEN** a client's byte stream contains an unterminated or otherwise unframeable sequence
- **THEN** the manager treats the affected frame as invalid and does not dispatch any request from it

#### Scenario: Connection survives a rejected frame
- **WHEN** a client sends an invalid frame followed by a valid frame on the same connection
- **THEN** the manager rejects the first frame and successfully serves the second

### Requirement: Health Method
The system SHALL implement a `health` method that reports manager liveness and the readiness of the native vmsan service, without performing any VM mutation.

#### Scenario: Health request on a healthy manager
- **WHEN** a client sends a `health` request to a running manager whose native service is initialized
- **THEN** the manager returns a success response whose result reports an `ok` status

#### Scenario: Health request creates no VM state changes
- **WHEN** a `health` request is served
- **THEN** no VM is created, started, stopped, removed, or otherwise modified

### Requirement: List Method with Field Redaction
The system SHALL implement a `list` method that returns VM records obtained from the native vmsan service, projected onto an explicit allow-list of protocol fields. Sensitive internal fields including the agent token MUST NOT appear in any response.

#### Scenario: List returns live VM state
- **WHEN** a client sends a `list` request while VMs exist in the vmsan environment
- **THEN** the manager returns a success response whose result contains one entry per VM, sourced from the native service

#### Scenario: List returns an empty collection
- **WHEN** a client sends a `list` request and no VMs exist
- **THEN** the manager returns a success response whose result contains an empty collection rather than an error

#### Scenario: Agent token is excluded
- **WHEN** a `list` response is produced for a VM that has an agent token recorded in its state
- **THEN** the response entry for that VM does not contain the agent token field or its value

#### Scenario: Only allow-listed fields are emitted
- **WHEN** a `list` response is produced
- **THEN** each entry contains only the protocol's declared fields and omits internal state, filesystem paths, and credential material

#### Scenario: List performs no mutation
- **WHEN** a `list` request is served
- **THEN** no VM, network policy, snapshot, rootfs, or Firecracker configuration is created, modified, or removed

### Requirement: Security Boundary Against Untrusted Input
The system SHALL treat every request field as untrusted. It MUST NOT accept executable paths, shell commands, or environment variable assignments from clients; MUST NOT pass request-derived strings into shell interpolation; and MUST NOT allow a request to select which vmsan implementation is used.

#### Scenario: Executable path in a request is ignored
- **WHEN** a request payload contains a field naming a binary or script path
- **THEN** the manager ignores that field and does not execute or reference it

#### Scenario: Shell command in a request is ignored
- **WHEN** a request payload contains a shell command string or shell metacharacters
- **THEN** the manager does not evaluate it and the request produces no process execution

#### Scenario: Environment variable assignment in a request is ignored
- **WHEN** a request payload contains fields that look like environment variable assignments
- **THEN** the manager does not apply them to its own or any child process environment

#### Scenario: Request cannot select a vmsan implementation
- **WHEN** a client attempts to influence which vmsan service the manager uses
- **THEN** the manager uses the service it initialized at startup and ignores the attempt

#### Scenario: Peer identity is established by filesystem permissions
- **WHEN** a client connects to the manager socket
- **THEN** the ability to connect is governed solely by the socket file's ownership and mode, and the manager performs no additional shared-secret handshake in this phase

### Requirement: Manager Configuration
The system SHALL read its configuration from a dedicated configuration module with an explicit vmsan data directory, socket path, and log level, applying a safe development default derived from the running environment rather than a hard-coded home directory. Configuration MUST be resolved once at startup and MUST NOT be settable or overridable per request.

#### Scenario: Explicit vmsan data directory is honored
- **WHEN** a vmsan data directory is configured
- **THEN** the manager initializes the native service against that directory rather than a default location

#### Scenario: Development default socket path
- **WHEN** no socket path is configured and a per-user runtime directory is available
- **THEN** the manager listens on a socket inside that per-user runtime directory

#### Scenario: Production socket path is supported
- **WHEN** a socket path under a system directory is configured
- **THEN** the manager uses that path with owner-and-group-restricted permissions

#### Scenario: No hard-coded user home path in source
- **WHEN** the manager's configuration module is inspected
- **THEN** no specific user home directory is embedded in the source

#### Scenario: Configuration cannot be changed by a client
- **WHEN** a request attempts to change the socket path, vmsan directory, or log level
- **THEN** the manager ignores the attempt and continues using its startup configuration

### Requirement: Graceful Shutdown
The system SHALL handle `SIGINT` and `SIGTERM` by refusing new requests, allowing in-flight requests to complete, closing the listening socket and open connections, releasing the native service, and exiting. Shutdown MUST NOT stop, remove, or otherwise alter any running VM.

#### Scenario: Signal initiates orderly shutdown
- **WHEN** the manager receives `SIGINT` or `SIGTERM`
- **THEN** it stops accepting new connections, drains in-flight requests, closes the socket, and exits

#### Scenario: In-flight request completes during shutdown
- **WHEN** a shutdown signal arrives while a request is being served
- **THEN** that request is allowed to finish and its response is delivered before the process exits

#### Scenario: Manager restart does not delete VMs
- **WHEN** the manager is stopped and later started again
- **THEN** every VM that existed before the restart still exists with its prior state, and startup performs no VM deletion or cleanup

#### Scenario: Socket file removed on clean exit
- **WHEN** the manager exits through the graceful shutdown path
- **THEN** the socket file it created is removed so a subsequent start is not blocked by a stale entry

### Requirement: Operational Logging Without Secret Leakage
The system SHALL emit structured server-side log records for startup, native service initialization, listening state, per-request dispatch, request failure, and shutdown, at a configurable severity level. Log records MUST NOT contain agent tokens, environment variable values, secret material, or full request payloads.

#### Scenario: Startup sequence is logged
- **WHEN** the manager starts
- **THEN** it logs manager startup, native service initialization, and listening readiness as separate structured records

#### Scenario: Request dispatch is logged
- **WHEN** a request is dispatched
- **THEN** a record identifies the method and the request identifier

#### Scenario: Request failure is logged
- **WHEN** a request fails
- **THEN** a record at error level identifies the error code and request identifier

#### Scenario: Shutdown is logged
- **WHEN** the manager begins shutting down
- **THEN** it logs that shutdown has started

#### Scenario: Sensitive values are never logged
- **WHEN** a request or VM state containing credential material is processed
- **THEN** no log record contains the credential value, an environment variable value, or the full request body

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

### Requirement: Socket Group Ownership
The system SHALL accept a configured access group and, after creating its control socket, set that socket's group to the configured group while keeping owner-and-group-only permissions. If no group is configured, the socket MUST retain the owner-and-group-restricted mode with the service user's primary group. A failure to set the group MUST NOT cause the manager to fall back to a more permissive mode, and the manager MUST NOT continue listening with a world-accessible socket.

#### Scenario: Configured group is applied to the socket
- **WHEN** the manager starts with an access group configured
- **THEN** the created socket is owned by the service user and the configured group, and its mode is `0660`

#### Scenario: No configured group leaves the socket owner-restricted
- **WHEN** the manager starts with no access group configured
- **THEN** the socket keeps the owner-and-group-restricted mode and no group change is attempted

#### Scenario: Group assignment failure is reported, not widened
- **WHEN** the manager cannot set the configured group on the socket
- **THEN** it reports the failure and does not broaden the socket's permissions to compensate

#### Scenario: Socket permissions are applied before readiness
- **WHEN** the manager finishes binding and applying socket ownership and mode
- **THEN** it announces readiness only after both the mode and the group have been applied

### Requirement: Configurable Socket Path From the Environment
The manager and the web application client SHALL both resolve their control socket path from configuration, and an explicitly configured value SHALL take precedence over any derived default. Neither side SHALL embed a specific user's home directory or socket path in source, and a socket path MUST NOT be settable per request.

#### Scenario: Explicit socket path wins
- **WHEN** a socket path is supplied through configuration
- **THEN** both the manager and the client use that exact path

#### Scenario: No configured path falls back to a per-user runtime directory
- **WHEN** no socket path is configured
- **THEN** the client falls back to a per-user runtime directory, and the manager falls back to the same derivation for its own use

#### Scenario: No home path is embedded in application code
- **WHEN** the manager's and the client's socket resolution code is inspected
- **THEN** neither contains a specific user's home directory or an absolute socket path

#### Scenario: A request cannot redirect the socket
- **WHEN** a request attempts to supply or change a socket path
- **THEN** the value is ignored and the process keeps using the socket it bound at startup

### Requirement: Deployable Compiled Build
The manager package SHALL produce compiled JavaScript output suitable for installation as a standalone program, and the installed program SHALL run that compiled output without a TypeScript loader present at runtime. Development execution MAY still use a TypeScript runner, but the production dependency set SHALL contain no development-only tooling.

#### Scenario: Build emits runnable JavaScript
- **WHEN** the manager is built
- **THEN** the build output directory contains the compiled entry point and its modules as plain JavaScript
-
#### Scenario: Production install has no transpiler dependency
- **WHEN** the manager's production-only dependencies are installed for deployment
- **THEN** no TypeScript runner or compiler is among them, and the installed entry point runs directly

#### Scenario: Development runner still works
- **WHEN** the manager is started through its development command
- **THEN** it runs from source as before

#### Scenario: Build output is not part of the type-check configuration
- **WHEN** type checking and the build are run
- **THEN** they use separate configurations, and emitting build output does not change the type-check result

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

### Requirement: MicroVM Command Execution RPC Method
The system SHALL implement a `vm.exec` RPC method on the manager over its Unix domain socket. The method accepts `{ "vmId": string, "command": string, "timeoutMs"?: number, "workingDirectory"?: string }`, validates the target VM is currently in `running` state, dispatches the command to the guest agent inside the microVM via `AgentClient`, and returns a sanitized execution result containing `{ "exitCode": number, "stdout": string, "stderr": string, "durationMs"?: number }`. The method MUST NOT execute any command on the host operating system, MUST NOT spawn host child processes or CLI tools, and MUST NOT expose internal credentials (`agentToken`), ports, or host filesystem paths.

#### Scenario: Successful command execution inside running VM
- **WHEN** a client sends a `vm.exec` request for a running microVM with a valid non-empty command string
- **THEN** the manager connects to the guest agent inside the microVM, executes the command inside the guest, and returns a success response with `{ "exitCode": number, "stdout": string, "stderr": string, "durationMs": number }`

#### Scenario: Command execution on non-existent VM
- **WHEN** a client sends a `vm.exec` request for a `vmId` that does not exist in the native service inventory
- **THEN** the manager rejects the request with error code `VM_NOT_FOUND`

#### Scenario: Command execution on stopped VM
- **WHEN** a client sends a `vm.exec` request for a microVM whose status is not `running`
- **THEN** the manager rejects the request with error code `VM_INVALID_STATE` and an explanation that commands can only run on active VMs

#### Scenario: Host isolation guaranteed
- **WHEN** any `vm.exec` request is dispatched
- **THEN** no shell command, `child_process.exec`, `child_process.spawn`, `sudo`, or host process execution occurs on the manager host system

### Requirement: Command Execution Parameter Validation and Safety Limits
The system SHALL validate all `vm.exec` parameters before initiating guest execution. `command` MUST be a non-empty string not exceeding 8,192 UTF-8 characters. `timeoutMs`, if provided, MUST be an integer between 1,000 ms and 120,000 ms (defaulting to 30,000 ms when omitted). `workingDirectory`, if provided, MUST be a string interpreted strictly inside the guest microVM filesystem. Requests violating these bounds MUST be rejected immediately with `VALIDATION_ERROR`.

#### Scenario: Empty or whitespace command rejected
- **WHEN** a client sends a `vm.exec` request with an empty string or whitespace-only `command`
- **THEN** the manager rejects the request with `VALIDATION_ERROR`

#### Scenario: Oversized command rejected
- **WHEN** a client sends a `vm.exec` request with a `command` exceeding 8,192 characters
- **THEN** the manager rejects the request with `VALIDATION_ERROR`

#### Scenario: Timeout parameter within permitted bounds
- **WHEN** a client sends `timeoutMs` within [1000, 120000]
- **THEN** the manager applies the requested execution timeout limit when executing via the guest agent

#### Scenario: Timeout parameter out of bounds rejected
- **WHEN** a client sends `timeoutMs` less than 1,000 ms or greater than 120,000 ms
- **THEN** the manager rejects the request with `VALIDATION_ERROR`

