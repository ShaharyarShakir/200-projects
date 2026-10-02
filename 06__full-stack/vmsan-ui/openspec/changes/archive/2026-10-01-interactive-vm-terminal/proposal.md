# Proposal

## Why

The current VM terminal implementation on `/vms/[id]/terminal` operates via discrete HTTP command executions (`POST /api/vms/:id/terminal`), which cannot maintain persistent working directories, shell environment variables, or interactive program execution (e.g. `top`, `vim`, pagers, and full TTY semantics). Operators managing microVMs require a genuine, low-latency, full-fidelity interactive terminal session inside running Firecracker microVMs that functions like modern cloud infrastructure consoles (such as AWS EC2, Incus, or DigitalOcean) while preserving strict host isolation and security boundaries.

## What Changes

- **Interactive Terminal Emulator**: Replace the mock command-line card UI with a full-page xterm.js terminal interface utilizing `@xterm/xterm`, `@xterm/addon-fit`, and `@xterm/addon-webgl` for native ANSI rendering, cursor control, keyboard shortcuts, and dynamic resizing.
- **WebSocket Terminal Transport**: Implement a bidirectional WebSocket streaming transport between the browser and Next.js, bridging real-time terminal I/O (stdin, stdout, stderr, resize signals) without HTTP polling.
- **Persistent Shell Session via vmsan-manager**: Extend `vmsan-manager` with interactive shell session lifecycle methods (`terminal.open`, `terminal.input`, `terminal.resize`, `terminal.close`, and stream bridging) that communicate directly with the guest microVM agent via native vmsan `ShellSession` / WebSocket PTY.
- **Automatic State & Session Gating**: Validate microVM lifecycle state before creating or attaching terminal sessions (requiring `running` status) and gracefully tear down active shell sessions when a VM stops or a client disconnects.
- **Root / Sudo Execution**: Enable root-privileged shell access inside the guest VM using the vmsan agent's native privilege mechanism without prompting the operator for guest passwords or executing host sudo.
- **Terminal UI & Controls**: Provide a dark infrastructure console layout with a compact header displaying VM ID, connection state (`Connecting`, `Connected`, `Disconnected`, `Error`), and actions for Reconnect, Clear, and Copy.

## Capabilities

### New Capabilities
<!-- None: Modifying existing capabilities -->

### Modified Capabilities
- `vm-terminal`: Replace discrete command-execution request/response flow with full interactive PTY terminal emulation using xterm.js and WebSocket streaming, supporting interactive programs, arrow keys, terminal signals, persistent shell state, and responsive viewport fitting.
- `vmsan-manager`: Add terminal session lifecycle operations and Unix socket streaming handlers to bridge interactive terminal I/O between the unprivileged web application and the microVM guest agent via native vmsan `ShellSession`.

## Impact

- **Frontend**: `src/components/vms/vm-terminal.tsx` rewritten to mount xterm.js with fit and WebGL addons; `src/app/vms/[id]/terminal/page.tsx` updated with console layout; terminal WebSocket client hooks in `src/lib/api/terminal.ts`.
- **Backend (Next.js)**: WebSocket route/server bridging browser WebSocket to the manager Unix socket.
- **Backend (vmsan-manager)**: `vmsan-manager/src/protocol.ts`, `server.ts`, and `vmsan.ts` updated to manage `ShellSession` instances and stream PTY traffic.
- **Dependencies**: `@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-webgl`, and `ws` / `@types/ws`.
- **Security**: Strict isolation preserved — Next.js never executes host commands or imports `vmsan`; the browser never touches Unix sockets or receives agent credentials.
