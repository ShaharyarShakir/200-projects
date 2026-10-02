# Spec Delta: vmsan-manager

## ADDED Requirements

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
