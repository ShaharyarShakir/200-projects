# Spec Delta

## MODIFIED Requirements

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
