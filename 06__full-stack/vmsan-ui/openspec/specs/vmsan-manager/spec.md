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
The system SHALL implement a `vm.exec` RPC method on the manager over its Unix domain socket. The method accepts `{ "vmId": string, "command": string, "timeoutMs"?: number, "workingDirectory"?: string, "sudo"?: boolean }`, validates the target VM is currently in `running` state, dispatches the command to the guest agent inside the microVM via `AgentClient` (passing administrative privileges to the guest agent when `sudo: true`), and returns a sanitized execution result containing `{ "exitCode": number, "stdout": string, "stderr": string, "durationMs"?: number }`. The method MUST NOT execute any command on the host operating system, MUST NOT spawn host child processes or CLI tools, and MUST NOT expose internal credentials (`agentToken`), ports, or host filesystem paths.

#### Scenario: Successful command execution inside running VM
- **WHEN** a client sends a `vm.exec` request for a running microVM with a valid non-empty command string
- **THEN** the manager connects to the guest agent inside the microVM, executes the command inside the guest, and returns a success response with `{ "exitCode": number, "stdout": string, "stderr": string, "durationMs": number }`

#### Scenario: Administrative command execution inside running VM
- **WHEN** a client sends a `vm.exec` request with `sudo: true`
- **THEN** the manager passes `sudo: true` to `AgentClient.runCommand()` so the guest agent executes the command as root inside the VM
- **AND** no host-level sudo or privilege escalation is executed on the host

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
The system SHALL validate all `vm.exec` parameters before initiating guest execution. `command` MUST be a non-empty string not exceeding 8,192 UTF-8 characters. `timeoutMs`, if provided, MUST be an integer between 1,000 ms and 120,000 ms (defaulting to 30,000 ms when omitted). `workingDirectory`, if provided, MUST be a string interpreted strictly inside the guest microVM filesystem. `sudo`, if provided, MUST be a boolean. Requests violating these bounds MUST be rejected immediately with `VALIDATION_ERROR`.

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

#### Scenario: Invalid sudo parameter type rejected
- **WHEN** a client sends a `vm.exec` request with a non-boolean `sudo` field (e.g. `sudo: "yes"` or `sudo: 1`)
- **THEN** the manager rejects the request with `VALIDATION_ERROR`

### Requirement: Filesystem Operations Protocol Framing and Validation
The manager protocol SHALL support filesystem methods `vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, and `vm.fs.download`. The manager MUST validate frame parameters, ensure `vmId` matches `^[a-zA-Z0-9_-]{1,128}$`, normalize all filesystem paths, reject traversal attempts (`..` resolving outside `/`), and enforce request size limits before dispatching to guest agents.

#### Scenario: Valid filesystem list request framing
- **WHEN** a client sends `{ "id": "req-1", "method": "vm.fs.list", "params": { "vmId": "vm-1234", "path": "/home/ubuntu" } }`
- **THEN** `validateFrame` accepts the frame and dispatches to the filesystem handler

#### Scenario: Malformed path in filesystem request
- **WHEN** a client sends `{ "id": "req-2", "method": "vm.fs.read", "params": { "vmId": "vm-1234", "path": "../../etc/shadow" } }`
- **THEN** `validateFrame` or parameter validation rejects the frame with `VALIDATION_ERROR`

### Requirement: Guest Filesystem Directory Listing Execution
The manager SHALL implement `vm.fs.list` by querying the running microVM through its guest `AgentClient`. The manager MUST return a sanitized list of directory entries conforming to `{ "path": string, "entries": Array<{ name: string, path: string, type: "file" | "directory" | "symlink" | "unknown", size?: number, mode?: string, modifiedAt?: string }> }` without exposing host paths, Firecracker jailer directories, or agent tokens.

#### Scenario: Successful directory listing via agent
- **WHEN** `vm.fs.list` is invoked for a running VM at path `/`
- **THEN** the manager uses the VM's `AgentClient` to read the directory contents from the guest and returns the sanitized entry listing

#### Scenario: Listing a missing directory on guest
- **WHEN** `vm.fs.list` is invoked for a path that does not exist in the microVM
- **THEN** the manager returns a failure frame with error code `FILE_NOT_FOUND`

### Requirement: Guest Filesystem File Read and Preview Execution
The manager SHALL implement `vm.fs.read` by reading file contents via `AgentClient.readFile()`. The manager MUST enforce a maximum file preview size of 1 MiB (1,048,576 bytes). If the file exceeds this limit, the manager MUST return a failure frame with error code `FILE_TOO_LARGE`.

#### Scenario: Successful file read within preview limit
- **WHEN** `vm.fs.read` is invoked for `/etc/hosts` (size 250 bytes) in a running VM
- **THEN** the manager reads the content via `AgentClient.readFile()`, converts the buffer to UTF-8 text, and returns `{ "path": "/etc/hosts", "content": "<text>", "size": 250 }`

#### Scenario: File read exceeds preview limit
- **WHEN** `vm.fs.read` is invoked for a file larger than 1 MiB
- **THEN** the manager aborts reading and returns error code `FILE_TOO_LARGE`

### Requirement: Guest Filesystem File Write and Upload Execution
The manager SHALL implement `vm.fs.write` by packaging the uploaded file buffer and transmitting it to the microVM via `AgentClient.writeFiles()` with the target extraction directory. The manager MUST enforce a maximum upload payload limit of 50 MiB (52,428,800 bytes). The operation MUST NOT write through any host filesystem paths or temporary host storage.

#### Scenario: Successful file write to guest
- **WHEN** `vm.fs.write` is invoked with `vmId`, `destDir: "/home/ubuntu"`, `fileName: "script.sh"`, and base64/binary content payload (≤ 50 MiB)
- **THEN** the manager calls `AgentClient.writeFiles([{ path: "script.sh", content: buffer }], "/home/ubuntu")` and returns `{ "path": "/home/ubuntu/script.sh", "size": <bytes> }`

#### Scenario: Upload exceeding size limit
- **WHEN** `vm.fs.write` is invoked with a payload exceeding 50 MiB
- **THEN** the manager rejects the request with error code `FILE_TOO_LARGE`

### Requirement: Guest Filesystem Directory Creation Execution
The manager SHALL implement `vm.fs.mkdir` by executing directory creation inside the microVM via the guest agent. The target path MUST be normalized and validated.

#### Scenario: Successful directory creation on guest
- **WHEN** `vm.fs.mkdir` is invoked with `{ "vmId": "vm-1234", "path": "/home/ubuntu/newdir" }`
- **THEN** the directory is created in the microVM via the guest agent and the manager returns `{ "path": "/home/ubuntu/newdir" }`

### Requirement: Guest Filesystem Non-Recursive Deletion Execution
The manager SHALL implement `vm.fs.delete` by executing single file or empty directory removal on the microVM filesystem via the guest agent. The manager MUST NOT perform recursive directory deletion. If the target is a directory containing files, the guest deletion failure MUST be returned without attempting recursive deletion.

#### Scenario: Successful deletion of file
- **WHEN** `vm.fs.delete` is invoked for an existing file `/tmp/sample.txt`
- **THEN** the file is unlinked on the microVM filesystem and the manager returns `{ "deleted": true, "path": "/tmp/sample.txt" }`

#### Scenario: Deletion of non-empty directory is rejected
- **WHEN** `vm.fs.delete` is invoked for a non-empty directory `/tmp/somedir`
- **THEN** the manager returns a failure frame with error code `VM_OPERATION_FAILED` indicating the directory is not empty

### Requirement: Guest Filesystem File Download Execution
The manager SHALL implement `vm.fs.download` by fetching the raw binary file from the microVM via `AgentClient.readFile()`. The manager MUST enforce a maximum download size of 100 MiB (104,857,600 bytes). The manager MUST NOT store or copy downloaded content onto the host filesystem.

#### Scenario: Successful file download retrieval
- **WHEN** `vm.fs.download` is invoked for `/var/log/app.log` (size ≤ 100 MiB)
- **THEN** the manager retrieves the binary payload via `AgentClient.readFile()` and returns base64 content or binary stream conforming to protocol limits

#### Scenario: Download exceeding size limit
- **WHEN** `vm.fs.download` is invoked for a file exceeding 100 MiB
- **THEN** the manager returns error code `FILE_TOO_LARGE`

### Requirement: VM Operational State and Security Boundary Isolation for Filesystem
All filesystem methods (`vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, `vm.fs.download`) SHALL verify that the target VM is in the `running` state. If the VM is stopped, starting, or in an error state, the manager MUST return error code `VM_INVALID_STATE`. All manager responses MUST redact internal host paths, Firecracker configurations, jailer paths, and `agentToken`/`agentPort` values.

#### Scenario: Filesystem request rejected on stopped VM
- **WHEN** any filesystem RPC method is sent targeting a microVM that is not running
- **THEN** the manager returns a failure frame with error code `VM_INVALID_STATE` without communicating with the guest agent

#### Scenario: Response payload sanitization
- **WHEN** any filesystem RPC response is generated
- **THEN** the response object contains only sanitized filesystem properties and never includes `agentToken`, `agentPort`, or host filesystem paths

### Requirement: Interactive Terminal Shell Session Lifecycle RPC Methods
The system SHALL implement terminal RPC operations on `vmsan-manager` over its Unix domain socket:
1. `terminal.open`: accepts `{ "vmId": string, "cols"?: number, "rows"?: number, "sudo"?: boolean }`, verifies the microVM is in `running` state, establishes a shell session to the guest microVM agent via native `ShellSession` (connecting as root when `sudo: true`), and returns `{ "sessionId": string, "vmId": string, "createdAt": string }`.
2. `terminal.input`: accepts `{ "sessionId": string, "data": string }` and forwards the input bytes to the active guest agent shell session.
3. `terminal.resize`: accepts `{ "sessionId": string, "cols": number, "rows": number }` and forwards the resize dimensions to the guest agent shell session.
4. `terminal.close`: accepts `{ "sessionId": string }` and terminates the active guest shell session.

#### Scenario: Open terminal session on running VM
- **WHEN** a client sends `terminal.open` for a running VM
- **THEN** the manager connects to the guest agent's shell endpoint (`/ws/shell`), allocates a shell session, records the session in memory, and returns `{ "sessionId": <id>, "vmId": <vmId>, "createdAt": <timestamp> }`

#### Scenario: Open terminal session on stopped VM
- **WHEN** a client sends `terminal.open` for a VM that is not in `running` state
- **THEN** the manager rejects the request with error code `VM_INVALID_STATE`

#### Scenario: Open terminal session with administrative privileges
- **WHEN** a client sends `terminal.open` with `sudo: true`
- **THEN** the manager connects to the guest agent passing `user: "root"` so the shell runs with root privileges inside the microVM without host sudo escalation

#### Scenario: Forward terminal input
- **WHEN** a client sends `terminal.input` with `{ "sessionId": "sess-1", "data": "ls -la\n" }`
- **THEN** the manager transmits the data payload to the corresponding active guest shell session

#### Scenario: Forward terminal resize
- **WHEN** a client sends `terminal.resize` with `{ "sessionId": "sess-1", "cols": 120, "rows": 40 }`
- **THEN** the manager forwards the terminal window dimensions to the guest shell PTY

#### Scenario: Close terminal session
- **WHEN** a client sends `terminal.close` with `{ "sessionId": "sess-1" }`
- **THEN** the manager closes the guest agent connection, destroys the session, and frees in-memory session state

### Requirement: Interactive Terminal Streaming over Manager Socket
The manager SHALL support continuous streaming of interactive terminal output from the guest agent shell session back to the connected client over the Unix domain socket. When output bytes or ANSI escape sequences arrive from the guest agent, the manager MUST immediately frame and emit the output to the client without buffering full lines or mangling escape sequences.

#### Scenario: Real-time output stream framing
- **WHEN** the guest shell emits stdout, stderr, or ANSI sequences
- **THEN** the manager transmits a framed output message `{ "type": "output", "sessionId": <id>, "data": <string> }` over the Unix socket to the web application

#### Scenario: Shell process exit notification
- **WHEN** the shell process inside the guest microVM exits (e.g. user enters `exit`)
- **THEN** the manager emits `{ "type": "exit", "sessionId": <id>, "exitCode": <number> }` and cleans up the session

### Requirement: Terminal Session Cleanup on VM Termination and Disconnection
The manager SHALL monitor VM state changes and client socket connection closures. If a microVM is stopped or removed, or if the client connection drops, all associated active terminal shell sessions MUST be terminated and removed from memory immediately.

#### Scenario: Active sessions destroyed when VM stops
- **WHEN** a microVM with active terminal sessions transitions to `stopped` or is removed
- **THEN** all associated terminal shell sessions are closed and removed from in-memory tracking

#### Scenario: Socket disconnection cleans up attached session
- **WHEN** the Unix socket connection from the client is closed or broken
- **THEN** the associated guest agent shell session is closed and released
