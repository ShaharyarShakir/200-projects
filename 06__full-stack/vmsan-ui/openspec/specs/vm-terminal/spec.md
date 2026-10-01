# Interactive Terminal Specification

## Purpose

Provides an interactive browser-based command execution terminal on the microVM detail page (`/vms/[id]`), enabling operators to execute shell commands inside running Firecracker microVMs and inspect execution outputs in real time without leaving the page.

## Requirements

### Requirement: Interactive Terminal Panel Presentation
The VM detail page SHALL provide an interactive terminal panel for inspecting and executing commands inside the selected microVM. The terminal panel MUST present a visual command prompt indicator (`$`), an active command line input field, an output log viewport displaying command invocations, stdout, stderr, and execution statuses, a clear action button, and a command execution state indicator.

#### Scenario: Terminal panel rendered on VM detail page
- **WHEN** an operator navigates to `/vms/[id]` for an existing microVM
- **THEN** the page renders the terminal panel alongside the VM resource and lifecycle views

#### Scenario: Visual separation of stdout and stderr
- **WHEN** a command emits both standard output and standard error streams
- **THEN** standard output and standard error are displayed with distinct visual formatting (e.g. muted/neutral text for stdout and distinct warning/danger color for stderr)

#### Scenario: Clear terminal action
- **WHEN** the operator triggers the "Clear" button in the terminal toolbar
- **THEN** all past command output entries in the local viewport are cleared while preserving current command input and navigation history

### Requirement: Command Submission and Execution Lifecycle
The system SHALL accept command submissions from the terminal input field and execute them inside the running microVM via the backend terminal API. While a command is executing, the terminal input field and submit action MUST be disabled, and a progress indicator MUST be shown until execution completes or times out.

#### Scenario: Command execution on running VM
- **WHEN** the operator enters a non-empty command and presses Enter (or clicks Run) while the VM is in `running` state
- **THEN** the command is dispatched to the backend terminal API, the input is disabled with a running indicator, and the resulting exit code, stdout, and stderr are appended to the terminal viewport upon completion

#### Scenario: Empty command submission prevented
- **WHEN** the operator submits a blank or whitespace-only command
- **THEN** no network request is sent and the terminal prompt remains ready for input

#### Scenario: Command execution timeout
- **WHEN** a command exceeds the execution timeout configured by the client or manager
- **THEN** the execution terminates, the terminal marks the command as timed out, and the input field re-enables for subsequent commands

### Requirement: VM State Gating on Terminal Execution
The terminal panel SHALL dynamically inspect the microVM's operational status. If the VM is not in the `running` state (e.g. `stopped`, `creating`, `stopping`), command submission MUST be disabled and a clear status notification MUST indicate that commands can only be executed in running VMs.

#### Scenario: Terminal disabled on stopped VM
- **WHEN** the microVM is in `stopped` or `error` status
- **THEN** the terminal input and run buttons are disabled and a descriptive message is displayed informing the operator to start the VM first

#### Scenario: Terminal enabled on running VM
- **WHEN** the microVM transitions to `running` status
- **THEN** the command input field is enabled and ready to accept command executions

### Requirement: In-Memory Browser Command History
The terminal component SHALL maintain an in-memory history of commands executed during the current browser session. Operators MUST be able to navigate backward and forward through prior commands using the Up and Down arrow keys when the input field is focused.

#### Scenario: Navigate back in history
- **WHEN** the operator focuses the command input and presses the Up arrow key
- **THEN** the input text is replaced with the immediately preceding command from the current session history

#### Scenario: Navigate forward in history
- **WHEN** the operator is viewing a historical command and presses the Down arrow key
- **THEN** the input text advances toward the most recently entered command or restores an uncommitted draft command at the bottom of the stack

#### Scenario: History isolation and non-persistence
- **WHEN** the browser page is refreshed or navigated away from
- **THEN** command history is not persisted to local storage or external databases, starting fresh on new visits
