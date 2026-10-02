# Spec Delta

## MODIFIED Requirements

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
