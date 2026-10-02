# Design: Interactive VM Terminal

## Context

The current VM control plane previously presented a command-runner interface using HTTP POST requests to `/api/vms/[id]/terminal`. To support true terminal emulation (persistent working directory, environment variables, full TTY semantics, interactive tools like `top` and `vim`), we are transitioning to a streaming PTY architecture.

The system adheres to a strict privilege boundary:
1. **Browser**: Runs `@xterm/xterm` and connects via standard WebSocket to Next.js.
2. **Next.js (Unprivileged)**: Receives the client WebSocket connection and bridges it to the `vmsan-manager` over the existing Unix domain socket.
3. **vmsan-manager (Privileged)**: Connects to the guest microVM agent's WebSocket endpoint (`/ws/shell`) using the native `vmsan` package's `ShellSession` / agent PTY binary protocol.
4. **Firecracker microVM**: Runs the guest agent which spawns the interactive shell PTY.

## Goals / Non-Goals

**Goals:**
- Provide a responsive infrastructure terminal console on `/vms/[id]/terminal` using `@xterm/xterm`, `@xterm/addon-fit`, and `@xterm/addon-webgl`.
- Maintain a persistent interactive shell session inside the guest microVM across multiple commands without losing state (`cd`, `export`, etc.).
- Bridge bidirectional terminal I/O (keystrokes, terminal escape sequences, stdout/stderr, resize signals) seamlessly via WebSocket and Unix domain socket.
- Support root-privileged execution inside the guest microVM via `user: "root"` without prompting the operator for passwords or invoking host sudo.
- Synchronize terminal viewport dimensions dynamically on window resize using `FitAddon` and PTY resize signals.
- Clean up all sessions, sockets, and agent connections immediately upon client disconnect or VM lifecycle termination.

**Non-Goals:**
- No host command execution or host shell creation.
- No SSH daemon or SSH key management.
- No persistent storage or database for terminal history/sessions.
- No multi-user terminal sharing, multiplexing, or session recording.
- No file upload/download within the terminal UI (handled by dedicated files section).

## Decisions

### 1. Terminal Frontend with xterm.js and Addons
- **Choice**: Use `@xterm/xterm` with `@xterm/addon-fit` and `@xterm/addon-webgl` rendered in a dedicated client-side component (`src/components/vms/vm-terminal.tsx`).
- **Rationale**: Standard infrastructure consoles (AWS EC2, DigitalOcean, Incus) use xterm.js for industry-standard ANSI rendering, keyboard handling, and cursor control.
- **Addon handling**: `FitAddon` recalculates dimensions on container resize via `ResizeObserver`. `WebglAddon` is initialized inside a try-catch block to fall back seamlessly to canvas/DOM rendering if hardware acceleration is unavailable.
- **Alternatives Considered**: Hand-rolled terminal emulator (rejected: non-trivial to handle ANSI sequences, cursor control, escape codes).

### 2. WebSocket Protocol for Terminal Streaming
- **Choice**: Define a compact JSON-framed protocol between Browser and Next.js:
  - **Client → Server**:
    - `{"type": "input", "data": string}`: Raw keystrokes and escape sequences.
    - `{"type": "resize", "cols": number, "rows": number}`: Viewport dimension updates.
    - `{"type": "close"}`: Explicit user closure.
  - **Server → Client**:
    - `{"type": "ready", "sessionId": string}`: Shell session successfully allocated.
    - `{"type": "output", "data": string}`: Terminal output stream.
    - `{"type": "exit", "exitCode": number}`: Shell process exit notification.
    - `{"type": "error", "message": string}`: Error or abnormal termination.
- **Rationale**: Minimal overhead, strong typing, and straightforward serialization across WebSocket and Unix socket boundaries.

### 3. Manager Streaming Architecture & ShellSession Lifecycle
- **Choice**: In `vmsan-manager`:
  - Provide terminal session methods: `terminal.open`, `terminal.input`, `terminal.resize`, `terminal.close`, and stream framing.
  - When `terminal.open` is requested, the manager validates that the VM is in `running` status, obtains the VM's internal IP (`guestIp`), agent port (`agentPort`), and `agentToken`, and establishes a WebSocket connection to the guest agent (`ws://${guestIp}:${agentPort}/ws/shell?token=${token}&user=${sudo ? 'root' : undefined}`).
  - Maintain active sessions in an in-memory `Map<string, ActiveTerminalSession>`.
  - The guest agent uses a 1-byte binary protocol (`0x00` Data, `0x01` Resize, `0x02` Ready). The manager translates between the internal agent binary protocol and the framed manager streaming protocol.
- **Alternatives Considered**: Raw TCP proxying to the microVM agent (rejected: would expose internal guest IP, agent port, and authentication token to Next.js or browser, violating the security boundary).

### 4. Next.js WebSocket Bridge to Manager Unix Socket
- **Choice**: Next.js runs a lightweight WebSocket handler for `/api/vms/[id]/terminal/ws`. On connection, it connects to the manager Unix domain socket, sends `terminal.open`, and pipes messages bidirectionally between the browser WebSocket and the manager socket.
- **Rationale**: Keeps Next.js strictly unprivileged and prevents the browser from ever directly accessing the Unix domain socket or host filesystem.

### 5. Sudo / Administrative Execution Flow
- **Choice**: When sudo mode is enabled, `terminal.open` sets `user: "root"`. The guest agent allocates the shell process under the root user in the guest kernel.
- **Rationale**: Firecracker microVM rootfs has no interactive password set for `ubuntu` / `root`. The vmsan guest agent daemon already supports `user: "root"` internally. No host sudo or password prompting is needed.

## Risks / Trade-offs

- **[Risk]** Container resize causing garbled PTY layout in full-screen programs (e.g. `top`, `vim`).
  - **Mitigation**: Attach `ResizeObserver` to the terminal container with debounced `fit()` calls, immediately dispatching `{ type: "resize", cols, rows }` to the backend.
- **[Risk]** WebGL context loss or unaccelerated environment errors.
  - **Mitigation**: Wrap WebGL addon mounting in a try-catch block and register an `onContextLoss` handler that gracefully falls back to default canvas rendering.
- **[Risk]** Leaked orphan shell sessions in guest microVMs if WebSocket connection drops abruptly.
  - **Mitigation**: Manager listens to socket close/error events and invokes `shellSession.close()` immediately, as well as sweeping active sessions when VM transitions out of `running` state.
- **[Risk]** Accidental host command execution.
  - **Mitigation**: Verified at code review — no `child_process`, `exec`, `spawn`, or `sudo` calls anywhere in Next.js terminal code. All VM interaction flows through `vmsan-manager`.

## Security & Architecture Summary

```text
Browser (xterm.js)
   ▲
   │ WebSocket (JSON frames: input, resize, output, ready, exit, error)
   ▼
Next.js (Unprivileged Node.js)
   ▲
   │ Unix Domain Socket (/tmp/vmsan-manager.sock, 0660 mode)
   ▼
vmsan-manager (Privileged service)
   ▲
   │ Agent WebSocket (Internal HTTP/WS with agentToken & user=root/ubuntu)
   ▼
vmsan Guest Agent (inside Firecracker VM)
   ▲
   │ PTY Fork/Exec
   ▼
Guest Shell (sh/bash inside microVM)
```
