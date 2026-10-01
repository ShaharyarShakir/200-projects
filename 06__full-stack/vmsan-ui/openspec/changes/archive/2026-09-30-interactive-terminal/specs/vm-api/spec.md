# Spec Delta: vm-api

## ADDED Requirements

### Requirement: MicroVM Terminal Execution Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/terminal` that accepts `{ "command": string, "timeoutMs"?: number, "workingDirectory"?: string }`, validates the dynamic VM ID parameter (`^[a-zA-Z0-9_-]{1,64}$`) and request body, and forwards the command execution request to `vmsan-manager` over its Unix socket via `VmService.execVm()`. The endpoint MUST NOT execute any host processes, MUST NOT import the native `vmsan` package, and MUST return structured responses conforming to the standard API schema with appropriate HTTP status codes (200 on success, 400 for validation errors, 404 for missing VMs, 409 for invalid state such as stopped VMs, 503 when the manager is unavailable, and 500 for internal errors).

#### Scenario: Successful command execution via HTTP
- **WHEN** an authenticated client sends a valid `POST /api/vms/:id/terminal` request with `{ "command": "uname -a" }` for a running microVM
- **THEN** the endpoint returns HTTP 200 with `{ "data": { "exitCode": 0, "stdout": "<output>", "stderr": "", "durationMs": <ms> } }`

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
- **WHEN** a client sends a request with an empty command or timeout exceeding 120,000 ms
- **THEN** the endpoint returns HTTP 400 with structured error `{ "error": { "code": "VALIDATION_ERROR", "message": "<msg>" } }`
