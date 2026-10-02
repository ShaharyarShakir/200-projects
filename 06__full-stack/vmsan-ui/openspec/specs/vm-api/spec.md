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
The system SHALL expose an HTTP POST endpoint at `/api/vms` that validates resource parameters including `runtime`, `vcpus`, `memoryMiB`, `diskSizeGb` (strictly bounded to integers between 1 and 20 GB), `networkPolicy`, and `timeoutMs`, and forwards creation requests to the manager over its control socket. The endpoint MUST NOT invoke a privileged command path, MUST NOT escalate privileges, and MUST NOT import the native vmsan package.

#### Scenario: Successful VM creation
- **WHEN** a client sends a `POST` request to `/api/vms` with valid configuration including storage (e.g. `runtime: "node22"`, `vcpus: 2`, `memoryMiB: 512`, `diskSizeGb: 10`, `networkPolicy: "deny-all"`)
- **THEN** the endpoint delegates to the manager client and returns HTTP 201 with the created VM's presentation model including its allocated `diskSizeGb`

#### Scenario: Missing or malformed JSON payload
- **WHEN** a client sends a `POST` request to `/api/vms` with an empty body, malformed JSON, or non-JSON content-type
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

#### Scenario: Invalid resource parameters
- **WHEN** a client sends a `POST` request with an unsupported runtime (e.g. `runtime: "invalid"`), invalid vCPUs (`vcpus < 1` or non-integer), invalid memory (`memoryMiB < 64` or non-integer), or invalid storage (`diskSizeGb < 1`, `diskSizeGb > 20`, or non-integer)
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

### Requirement: MicroVM Terminal Execution Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/terminal` that accepts `{ "command": string, "timeoutMs"?: number, "workingDirectory"?: string, "sudo"?: boolean }`, validates the dynamic VM ID parameter (`^[a-zA-Z0-9_-]{1,64}$`) and request body, and forwards the command execution request to `vmsan-manager` over its Unix socket via `VmService.execVm()`. The endpoint MUST NOT execute any host processes or host-level sudo, MUST NOT import the native `vmsan` package, and MUST return structured responses conforming to the standard API schema with appropriate HTTP status codes (200 on success, 400 for validation errors, 404 for missing VMs, 409 for invalid state such as stopped VMs, 503 when the manager is unavailable, and 500 for internal errors).

#### Scenario: Successful command execution via HTTP
- **WHEN** an authenticated client sends a valid `POST /api/vms/:id/terminal` request with `{ "command": "uname -a" }` for a running microVM
- **THEN** the endpoint returns HTTP 200 with `{ "data": { "exitCode": 0, "stdout": "<output>", "stderr": "", "durationMs": <ms> } }`

#### Scenario: Successful administrative command execution via HTTP
- **WHEN** a client sends a valid `POST /api/vms/:id/terminal` request with `{ "command": "apt install -y file", "sudo": true }` for a running microVM
- **THEN** the endpoint forwards `sudo: true` to the manager service without requesting or collecting a VM sudo password
- **AND** returns HTTP 200 with the execution outcome

#### Scenario: Command execution on non-existent VM
- **WHEN** a client sends `POST /api/vms/:id/terminal` for a non-existent VM ID
- **THEN** the endpoint returns HTTP 404 with structured error `{ "error": { "code": "VM_NOT_FOUND", "message": "<msg>" } }`

#### Scenario: Command execution on non-running VM
- **WHEN** a client sends `POST /api/vms/:id/terminal` for a VM in `stopped` status
- **THEN** the endpoint returns HTTP 409 with structured error `{ "error": { "code": "VM_INVALID_STATE", "message": "<msg>" } }`

#### Scenario: Manager unavailable during command execution
- **WHEN** the manager socket is disconnected, unreachable, or unresponsive
- **THEN** the endpoint returns HTTP 503 with structured error `{ "error": { "code": "SERVICE_UNAVAILABLE", "message": "<msg>" } }`

#### Scenario: Invalid command parameters rejected
- **WHEN** a client sends a request with an empty command, non-boolean sudo value, or timeout exceeding 120,000 ms
- **THEN** the endpoint returns HTTP 400 with structured error `{ "error": { "code": "VALIDATION_ERROR", "message": "<msg>" } }`

### Requirement: MicroVM Directory Listing Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms/:id/files` that accepts a query parameter `path` (defaulting to `/`), validates the VM ID and path parameter against path traversal attempts, and queries the manager over its Unix socket via `vm.fs.list`. The endpoint MUST return HTTP 200 with `{ "path": string, "entries": VmFile[] }`, HTTP 400 for malformed/traversal paths, HTTP 404 for missing VMs or non-existent directories, HTTP 409 for non-running VMs, HTTP 503 when manager is unavailable, and HTTP 500 for internal errors.

#### Scenario: Successful directory listing
- **WHEN** a client performs a `GET /api/vms/:id/files?path=/home/ubuntu` on a running VM
- **THEN** the endpoint returns HTTP 200 with `{ "path": "/home/ubuntu", "entries": [{ "name": "projects", "path": "/home/ubuntu/projects", "type": "directory" }] }`

#### Scenario: Path traversal attempt rejected on listing
- **WHEN** a client performs a `GET /api/vms/:id/files?path=../../etc`
- **THEN** the endpoint rejects the request with HTTP 400 and error code `INVALID_REQUEST` without forwarding the path to the manager

#### Scenario: Listing non-existent directory on VM
- **WHEN** a client performs a `GET /api/vms/:id/files?path=/does/not/exist`
- **THEN** the endpoint returns HTTP 404 with error code `FILE_NOT_FOUND`

#### Scenario: Listing on stopped VM
- **WHEN** a client performs a `GET /api/vms/:id/files?path=/` for a stopped VM
- **THEN** the endpoint returns HTTP 409 with error code `VM_INVALID_STATE`

### Requirement: MicroVM Text File Preview Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms/:id/files/read` that accepts a query parameter `path`, validates path constraints, and fetches file content via `vm.fs.read`. The endpoint MUST enforce a maximum preview size limit of 1 MiB. If the requested file exceeds 1 MiB, the endpoint MUST return HTTP 413 with error code `FILE_TOO_LARGE`.

#### Scenario: Successful text file read
- **WHEN** a client performs a `GET /api/vms/:id/files/read?path=/README.md` on a running VM for a 1.4 KB text file
- **THEN** the endpoint returns HTTP 200 with `{ "path": "/README.md", "content": "<file content>", "size": 1400 }`

#### Scenario: Reading file exceeding preview size limit
- **WHEN** a client performs a `GET /api/vms/:id/files/read?path=/large.iso` for a file > 1 MiB
- **THEN** the endpoint returns HTTP 413 with error code `FILE_TOO_LARGE` and a descriptive message

#### Scenario: Reading non-existent file
- **WHEN** a client performs a `GET /api/vms/:id/files/read?path=/missing.txt`
- **THEN** the endpoint returns HTTP 404 with error code `FILE_NOT_FOUND`

### Requirement: MicroVM File Upload Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/files` that accepts file uploads targeted to a specified destination directory on the microVM. The endpoint MUST enforce a maximum upload payload limit of 50 MiB. The filename MUST represent a single entry name without path separators or directory traversal sequences (`..`, `/`). The file payload MUST be forwarded to `vmsan-manager` over the Unix socket via `vm.fs.write` without reading or writing through the host filesystem.

#### Scenario: Successful file upload to microVM
- **WHEN** a client sends a valid `POST /api/vms/:id/files` with destination `/home/ubuntu`, filename `app.py`, and content payload (≤ 50 MiB)
- **THEN** the file is forwarded to the manager, written to the microVM filesystem via `AgentClient.writeFiles`, and the endpoint returns HTTP 201 with `{ "path": "/home/ubuntu/app.py", "size": <bytes> }`

#### Scenario: Upload exceeding size limit
- **WHEN** a client attempts to upload a file exceeding 50 MiB
- **THEN** the endpoint returns HTTP 413 with error code `FILE_TOO_LARGE` or `UPLOAD_TOO_LARGE`

#### Scenario: Upload with malformed or traversal filename
- **WHEN** a client attempts to upload with filename `../file.txt` or `foo/bar.txt`
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

### Requirement: MicroVM Directory Creation Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/files/mkdir` that accepts `{ "path": string }` or `{ "parentPath": string, "name": string }`, validates the target path and directory name, and delegates to the manager via `vm.fs.mkdir`. The endpoint MUST reject directory names containing path separators or traversal characters.

#### Scenario: Successful directory creation
- **WHEN** a client sends a valid `POST /api/vms/:id/files/mkdir` with path `/home/ubuntu/projects`
- **THEN** the directory is created on the microVM filesystem and the endpoint returns HTTP 201 with `{ "path": "/home/ubuntu/projects" }`

#### Scenario: Invalid directory path rejection
- **WHEN** a client sends a directory creation request with path `/home/../etc` or invalid characters
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

### Requirement: MicroVM File Deletion Endpoint
The system SHALL expose an HTTP DELETE endpoint at `/api/vms/:id/files` that accepts a query parameter `path`, validates the target path, and calls `vm.fs.delete` on the manager. The deletion MUST be non-recursive. If the target is a non-empty directory, the operation MUST fail with an explicit error.

#### Scenario: Successful file deletion
- **WHEN** a client sends `DELETE /api/vms/:id/files?path=/tmp/test.txt` for an existing file
- **THEN** the file is deleted on the microVM filesystem and the endpoint returns HTTP 200 with `{ "deleted": true, "path": "/tmp/test.txt" }`

#### Scenario: Deleting non-empty directory fails without recursion
- **WHEN** a client sends `DELETE /api/vms/:id/files?path=/home/ubuntu/projects` for a directory containing files
- **THEN** the endpoint returns HTTP 400 or HTTP 409 with an error indicating the directory is not empty and cannot be recursively deleted

### Requirement: MicroVM File Download Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms/:id/files/download` that accepts a query parameter `path`, validates the path, retrieves the file payload from `vmsan-manager` via `vm.fs.download`, and streams the raw binary payload with appropriate `Content-Disposition`, `Content-Type`, and `Content-Length` headers. The endpoint MUST enforce a maximum download size of 100 MiB.

#### Scenario: Successful file download
- **WHEN** a client performs a `GET /api/vms/:id/files/download?path=/tmp/archive.tar` for a file ≤ 100 MiB
- **THEN** the endpoint streams the binary content with `Content-Disposition: attachment; filename="archive.tar"` and HTTP 200

#### Scenario: Downloading file exceeding size limit
- **WHEN** a client requests download for a file exceeding 100 MiB
- **THEN** the endpoint returns HTTP 413 with error code `FILE_TOO_LARGE`

### Requirement: Path Normalization and Traversal Defense for Filesystem Endpoints
All filesystem endpoints SHALL normalize target paths (e.g., resolving `/tmp/../etc` to `/etc`) and strictly reject paths attempting to escape the root `/` or containing invalid character sequences before communicating with `vmsan-manager`.

#### Scenario: Normalization of relative segments
- **WHEN** a client performs a filesystem request with path `/tmp/../etc/hosts`
- **THEN** the path is normalized to `/etc/hosts` before validating and executing the request

#### Scenario: Rejection of root breakout traversal
- **WHEN** a client performs a filesystem request with path `/../../../etc/shadow`
- **THEN** the request is rejected with HTTP 400 and error code `INVALID_REQUEST`



