# Spec Delta

## MODIFIED Requirements

### Requirement: Interactive Terminal Panel Presentation
The VM console SHALL provide an interactive terminal interface for inspecting and executing commands inside the selected microVM, presented within the VM console on a dedicated terminal sub-route at `/vms/[id]/terminal`. The terminal panel MUST present a visual command prompt indicator (`$`), an active command line input field, an output log viewport displaying command invocations, stdout, stderr, execution statuses, and duration, a clear action button, a command execution state indicator, and an administrative execution toggle or mechanism.

#### Scenario: Terminal panel rendered on VM detail page
- **WHEN** an operator navigates to `/vms/[id]/terminal` for an existing microVM
- **THEN** the console renders the full-width terminal interface within the console layout with sidebar navigation preserved
- **AND** the terminal prompt is focused and ready for interactive input if the microVM is running

#### Scenario: Visual separation of stdout and stderr
- **WHEN** a command emits both standard output and standard error streams
- **THEN** standard output and standard error are displayed with distinct visual formatting (e.g. muted/neutral text for stdout and distinct warning/danger color for stderr)

#### Scenario: Clear terminal action
- **WHEN** the operator triggers the "Clear" button in the terminal toolbar
- **THEN** all past command output entries in the local viewport are cleared while preserving current command input and navigation history

### Requirement: Command Submission and Execution Lifecycle
The system SHALL accept command submissions from the terminal input field and execute them inside the running microVM via the backend terminal API. While a command is executing, the terminal input field and submit action MUST be disabled, and a progress indicator MUST be shown until execution completes or times out. The terminal MUST NOT prompt the operator for a VM sudo password.

#### Scenario: Command execution on running VM
- **WHEN** the operator enters a non-empty command and triggers execution without administrative privilege while the VM is running
- **THEN** the command is dispatched to `POST /api/vms/:id/terminal` with `{ "command": "<cmd>", "sudo": false }`
- **AND** the resulting exit code, stdout, and stderr are appended to the terminal viewport upon completion

#### Scenario: Empty command submission prevented
- **WHEN** the operator submits a blank or whitespace-only command
- **THEN** no network request is sent and the terminal prompt remains ready for input

#### Scenario: Command execution timeout
- **WHEN** a command exceeds the execution timeout configured by the client or manager
- **THEN** the execution terminates, the terminal marks the command as timed out, and the input field re-enables for subsequent commands

## ADDED Requirements

### Requirement: Administrative Sudo Command Execution
The terminal SHALL support executing administrative commands inside the microVM via the backend manager's privileged `AgentClient` execution boundary without collecting, storing, or transmitting a guest sudo password.

#### Scenario: Executing an administrative command
- **WHEN** an administrative command is submitted (e.g. `apt install -y file` with administrative execution enabled)
- **THEN** the request is dispatched to `POST /api/vms/:id/terminal` with `{ "command": "apt install -y file", "sudo": true }`
- **AND** the backend executes the command with root privileges inside the guest VM via `AgentClient`
- **AND** no sudo password prompt is displayed to the user
- **AND** the Next.js process never executes host-level sudo commands
