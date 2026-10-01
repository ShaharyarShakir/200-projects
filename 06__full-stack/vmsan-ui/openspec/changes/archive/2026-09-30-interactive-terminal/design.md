# Design: Interactive Terminal (Phase 2B)

## Context

The vmsan architecture divides operations between an unprivileged Next.js web application and a privileged background daemon (`vmsan-manager`) communicating over a local Unix domain socket (`/run/vmsan/manager.sock` or `~/.vmsan/manager.sock`).

To support executing commands inside running Firecracker microVMs from the web UI (`/vms/[id]`):
- Next.js has no access to the guest network, TAP interfaces, or VM credentials (`agentToken`).
- `vmsan-manager` possesses root privileges, manages VM lifecycles via the native `vmsan` library, and can communicate with the guest agent daemon running inside each microVM over internal guest IP (`http://${guestIp}:${agentPort}/exec`).
- Execution must happen strictly inside the microVM sandbox and never spawn processes or shells on the host machine.

See `proposal.md` for background motivation and high-level scope.

## Goals / Non-Goals

**Goals:**
- Extend `vmsan-manager` RPC protocol with a typed `vm.exec` method that validates inputs, checks VM `running` state, dispatches execution via `AgentClient`, and returns sanitized execution results.
- Implement `POST /api/vms/:id/terminal` REST endpoint in Next.js backed by `VmService.execVm()` with rigorous parameter validation and HTTP error code mapping (200, 400, 404, 409, 502, 503, 500).
- Provide client-side API helper `executeVmCommand(vmId, params)` in `src/lib/api/vms.ts`.
- Build an interactive terminal panel (`VmTerminal`) for the VM detail page (`/vms/[id]`) with command prompt (`$`), stdout/stderr separation, execution indicator, clear output capability, and keyboard-driven in-memory command history (Up/Down arrow navigation).
- Enforce strict state gating so terminal interactions are enabled only when the microVM is in `running` status.

**Non-Goals:**
- Full PTY forwarding, raw terminal multiplexing, xterm.js emulation, or streaming WebSocket connections.
- Persistent session storage or database storage of command history.
- Host process execution, `child_process`, `exec`, `spawn`, `execFile`, or host CLI tools.
- Multi-user terminal collaboration or terminal recording/replay.

## Decisions

### 1. Manager Protocol RPC Method (`vm.exec`)

The manager JSON-RPC protocol over the Unix domain socket is extended with:

```typescript
export interface VmExecParams {
  vmId: string;
  command: string;
  timeoutMs?: number;
  workingDirectory?: string;
}

export interface VmExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs?: number;
}
```

**Validation Rules in Manager:**
- `vmId`: String matching `^[a-zA-Z0-9_-]+$`, max 128 characters.
- `command`: Non-empty string, trimmed length > 0, max 8,192 UTF-8 characters.
- `timeoutMs`: Optional integer, bounded between `1,000` ms and `120,000` ms (default: `30,000` ms).
- `workingDirectory`: Optional string representing an absolute path inside the guest VM filesystem.

*Alternatives Considered:*
- Passing commands as an array of arguments (`argv: string[]`). *Rationale:* Shell commands entered into an interactive terminal often contain pipes, flags, or script expressions meant for evaluation by the guest shell agent (`sh -c`). The guest agent's `/exec` endpoint expects a command string.

### 2. Guest Execution via `AgentClient`

When `vmsan-manager` handles `vm.exec`:
1. It queries the native service via `service.get(vmId)` to verify VM existence.
2. It checks `state.status === "running"`. If not running, throws `ERR_VM_NOT_RUNNING` (mapped to `VM_INVALID_STATE`).
3. It retrieves `guestIp = state.network?.guestIp`, `agentPort = state.agentPort ?? 8080`, and `agentToken = state.agentToken`.
4. It instantiates `AgentClient(http://${guestIp}:${agentPort}, agentToken)` from `vmsan`.
5. It invokes the agent's command execution method with the validated command, timeout, and working directory.
6. It sanitizes and returns `{ exitCode, stdout, stderr, durationMs }` without leaking `agentToken`, `agentPort`, or host internal paths.

*Alternatives Considered:*
- Invoking `ssh` or a host CLI tool via `child_process.exec`. *Rationale:* Violates host isolation, requires SSH keys/daemons inside the guest, and introduces host command execution risks. `AgentClient` uses the lightweight internal HTTP agent over the guest network.

### 3. REST API Endpoint (`POST /api/vms/:id/terminal`)

The route handler `src/app/api/vms/[id]/terminal/route.ts` implements:
- Validation of dynamic route parameter `id` (`validateVmId`).
- JSON payload parsing and validation: `command` (non-empty string <= 8192 chars), `timeoutMs` (1000..120000), `workingDirectory` (optional string).
- Invocation of `VmService.execVm(id, { command, timeoutMs, workingDirectory })`.
- Structured response: `{ "data": { "exitCode": 0, "stdout": "...", "stderr": "...", "durationMs": 12 } }`.
- Error mapping:
  - `400 Bad Request`: `VALIDATION_ERROR`, invalid JSON, or empty command.
  - `404 Not Found`: `VM_NOT_FOUND`.
  - `409 Conflict`: `VM_INVALID_STATE` (e.g. VM is stopped).
  - `502 Bad Gateway`: Protocol deserialization errors.
  - `503 Service Unavailable`: `ManagerUnavailableError` / socket connection failures.
  - `500 Internal Server Error`: Unhandled errors.

### 4. Interactive Terminal Component Architecture

The frontend component `src/components/vms/vm-terminal.tsx` is structured as follows:

- **State Management:**
  - `entries`: Array of output log items: `{ id, command, stdout, stderr, exitCode, durationMs, error?, isRunning?, timestamp }`.
  - `commandInput`: Current text in the command line.
  - `history`: Array of past executed command strings for the session (`string[]`).
  - `historyIndex`: Index pointer into `history` (-1 when typing a fresh command, 0..N-1 when traversing).
  - `draftInput`: In-memory storage for uncommitted text before the user pressed Up arrow.
  - `isExecuting`: Boolean indicating whether a command request is currently in-flight.

- **Keyboard Navigation:**
  - `ArrowUp`: Navigates backward in history. When transitioning from fresh input (`historyIndex === -1`), saves current text in `draftInput` and sets input to the most recent history item.
  - `ArrowDown`: Navigates forward in history. If returning past the newest history item, restores `draftInput` and resets `historyIndex` to -1.
  - `Enter`: Submits the current command if non-empty and not currently executing.

- **Visual Appearance:**
  - Dark terminal theme (`bg-zinc-950 text-zinc-100 font-mono text-xs sm:text-sm`).
  - Header toolbar with status indicator, VM ID badge, running/idle badge, and "Clear" button.
  - Scrollable output viewport with visual prompt prefix `$`, muted/light stdout text, and distinct amber/red stderr text.
  - Exit code badge (green for `0`, red for non-zero) and duration tag.
  - Visual disabled state with informative warning banner when `vm.status !== "running"`.

- **Detail View Integration:**
  - Added to `src/components/vms/vm-detail-view.tsx` below the overview and resource specifications.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Long-running or infinite commands block the client | Enforce bounded execution timeout (default 30s, max 120s) in both frontend client and manager daemon. |
| Host command injection vulnerabilities | Enforce zero host process spawning (`child_process`, `exec`, `spawn`, `sudo`); dispatch commands solely through `AgentClient` HTTP payload to the guest agent. |
| Browser memory growth from massive terminal output | Support output log clearing via the "Clear" button and render output entries efficiently. |
| Manager socket disconnect or restart | Gracefully catch socket errors in Next.js `VmService`, return HTTP 503, and render a clear error alert in the terminal without breaking page state. |

## Migration Plan

- **Backward Compatibility:** All changes are additive. The manager protocol gains a new method `vm.exec` alongside existing lifecycle methods. The REST API gains `POST /api/vms/:id/terminal` without modifying existing endpoints.
- **Rollback:** If issues arise, the terminal component can be hidden or the route disabled without affecting existing VM creation, start, stop, or listing capabilities.
