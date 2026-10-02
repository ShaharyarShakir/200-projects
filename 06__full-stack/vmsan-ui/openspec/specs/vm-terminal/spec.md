# Interactive Terminal Specification

## Purpose

Provides an interactive browser-based terminal console on the microVM terminal sub-route (`/vms/[id]/terminal`), enabling operators to interact with the interactive shell inside running Firecracker microVMs in real time via bidirectional WebSocket streaming and xterm.js terminal emulation.

## Requirements

### Requirement: Interactive Terminal Panel Presentation
The VM console SHALL provide an interactive terminal interface for interacting with the shell inside the selected microVM, presented within the VM console on a dedicated terminal sub-route at `/vms/[id]/terminal`. The terminal MUST utilize an established terminal emulator package (`@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-webgl`) mounted in the primary workspace area rather than a small card. The terminal panel MUST present a compact header displaying the VM identifier, connection state indicator (`Connecting...`, `Connected`, `Disconnected`, `Reconnecting...`, `Error`), and minimal actions (`Reconnect`, `Clear`, `Copy`).

#### Scenario: Terminal panel rendered on VM detail page
- **WHEN** an operator navigates to `/vms/[id]/terminal` for an existing microVM
- **THEN** the console renders the full-width terminal interface within the console layout with sidebar navigation preserved
- **AND** the xterm.js terminal instance is initialized and auto-focused if the microVM is running

#### Scenario: Dark infrastructure console styling
- **WHEN** the terminal view is mounted
- **THEN** it renders with a dark terminal background, subtle borders, monospace typography, and no extraneous decorative UI elements

#### Scenario: Clear terminal action
- **WHEN** the operator triggers the "Clear" button in the terminal header
- **THEN** the xterm.js buffer is cleared without disconnecting the active shell session

#### Scenario: Copy selection action
- **WHEN** the operator triggers the "Copy" action or selects text within the terminal
- **THEN** the selected text from the xterm.js viewport is copied to the system clipboard

### Requirement: VM State Gating on Terminal Execution
The terminal interface SHALL dynamically inspect the microVM's operational status. If the VM is not in the `running` state (e.g. `stopped`, `creating`, `stopping`, `error`), terminal session connection MUST be prevented and a clear status notification MUST indicate that the microVM must be running to establish an interactive shell.

#### Scenario: Terminal connection disabled on stopped VM
- **WHEN** the microVM is in `stopped` or `error` status
- **THEN** no WebSocket terminal session is established and an indicator displays that the microVM is stopped

#### Scenario: Terminal auto-connects on running VM
- **WHEN** the microVM is in `running` status
- **THEN** the terminal interface automatically connects to the WebSocket stream and opens an interactive shell session

### Requirement: Administrative Sudo Command Execution
The terminal SHALL support administrative execution inside the microVM via the backend manager's native agent execution boundary without collecting, storing, or prompting the operator for a VM sudo password, and without executing host-level sudo.

#### Scenario: Interactive root shell session
- **WHEN** a terminal session is initialized with administrative privilege requested
- **THEN** the session connects as root inside the guest microVM through the manager AgentClient boundary
- **AND** no sudo password prompt is displayed to the user
- **AND** the Next.js process never executes host-level sudo commands

### Requirement: WebSocket Bidirectional Terminal Streaming
The terminal interface SHALL communicate with the backend using a persistent bidirectional WebSocket connection. Keystrokes (including printable characters, control characters Ctrl+C, Ctrl+D, Ctrl+L, Ctrl+Z, Tab, Backspace, arrow keys, and Escape sequences) MUST be forwarded directly from xterm.js to the backend without client-side interpretation. Terminal output streams (stdout, stderr, ANSI escape sequences, cursor position updates) received from the backend MUST be written directly to the xterm.js terminal.

#### Scenario: Keyboard input forwarded to WebSocket
- **WHEN** the user types characters or presses control keys (such as Tab, Enter, Backspace, or Ctrl+C) into the focused terminal
- **THEN** the raw input is packaged into a JSON input frame `{ "type": "input", "data": "<string>" }` and sent over the WebSocket

#### Scenario: Terminal output rendered by xterm.js
- **WHEN** the client receives a server output frame `{ "type": "output", "data": "<string>" }`
- **THEN** the raw string data is written directly to xterm.js without stripping ANSI sequences or converting to HTML

### Requirement: Dynamic Terminal Resizing and Addon Integration
The terminal interface SHALL integrate `@xterm/addon-fit` to compute optimal columns and rows based on container dimensions. When container dimensions change or the browser window resizes, the terminal MUST refit and transmit a resize frame `{ "type": "resize", "cols": <number>, "rows": <number> }` over the WebSocket to update the backend PTY dimensions. The interface SHALL load `@xterm/addon-webgl` when supported, falling back gracefully to canvas/DOM rendering if WebGL is unavailable.

#### Scenario: Terminal viewport resize synchronization
- **WHEN** the browser window or terminal container changes dimensions
- **THEN** `FitAddon.fit()` recalculates columns and rows
- **AND** a resize frame is sent to the backend to resize the guest shell PTY

#### Scenario: WebGL fallback
- **WHEN** WebGL addon initialization fails on an unsupported client browser
- **THEN** the terminal falls back to default xterm.js rendering without throwing an unhandled exception or breaking the terminal stream

### Requirement: Terminal Connection State and Reconnection Handling
The terminal interface SHALL manage connection lifecycle states (`Connecting`, `Connected`, `Disconnected`, `Reconnecting`, `Error`). If the WebSocket connection drops unexpectedly or the backend reports a closed session, the UI MUST visually indicate disconnection and provide a manual "Reconnect" action that establishes a fresh shell session.

#### Scenario: Connection state visual indicator
- **WHEN** the terminal transitions across connection phases
- **THEN** the header displays a concise indicator (e.g. `● Connected`, `○ Disconnected`, `● Connecting...`)

#### Scenario: Reconnect action creates new shell session
- **WHEN** the operator clicks "Reconnect" after a disconnect
- **THEN** a new WebSocket connection is opened, a new shell session is established on the backend, and the terminal displays the new shell prompt

### Requirement: Terminal Lifecycle and Resource Cleanup
When the operator navigates away from `/vms/[id]/terminal` or unmounts the terminal component, the system SHALL close the WebSocket connection, dispose of the xterm.js instance and loaded addons, and notify the backend to terminate the guest shell session.

#### Scenario: Component unmount cleans up resources
- **WHEN** the user navigates away from `/vms/[id]/terminal`
- **THEN** the WebSocket is closed, event listeners are detached, and the xterm instance is disposed without memory leaks or orphan background sessions
