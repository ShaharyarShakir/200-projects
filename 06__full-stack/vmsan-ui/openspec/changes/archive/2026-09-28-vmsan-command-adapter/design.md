# Design

## Context

`vmsan-ui` is a local web management interface for the `vmsan` Firecracker microVM toolkit. The host machine runs Firecracker microVMs through the `vmsan` CLI (located in the user's PATH via Node/fnm). The web backend built on Next.js 16 (App Router) needs to interact with this CLI.

See `proposal.md` for motivation and high-level scope.

## Goals / Non-Goals

**Goals:**
- Provide a robust TypeScript abstraction layer (`src/lib/vmsan/`) that safely invokes the `vmsan` CLI via `child_process.spawn`.
- Ensure zero shell injection vulnerability by enforcing argument-array spawning and rejecting shell metacharacters in VM identifiers and resource parameters.
- Reliably parse structured JSON output from `vmsan --json list` into strongly-typed `VM` objects.
- Deliver typed error models (`VmsanError`, `VmsanValidationError`) that capture actionable command diagnostics without leaking private host environment data.
- Provide `GET /api/vms` Next.js route handler to verify end-to-end integration between the API layer and the adapter.
- Provide comprehensive unit tests with zero destructive host side effects.

**Non-Goals:**
- No frontend dashboard UI, forms, cards, buttons, or dialogs in this phase.
- No interactive terminals, WebSocket proxies, or SSH console connections (`vmsan connect`, `vmsan exec`).
- No password entry, prompting, or storage mechanisms for `sudo` (no `sudo -S` or password forwarding).
- No background queue, database persistence, or external orchestration daemons.

## Decisions

### 1. Process Execution: `child_process.spawn` with Argument Arrays
- **Decision**: Use Node.js `child_process.spawn` with explicit argument arrays (e.g. `["--json", "list"]`) and `shell: false`.
- **Rationale**: Completely prevents command injection and shell syntax interpretation regardless of input values.
- **Alternatives Considered**:
  - `child_process.exec`: Rejected due to mandatory shell interpolation and severe command injection risks.
  - `child_process.execFile`: Suitable, but `spawn` provides more direct stream handling, configurable timeouts, and process cancellation control.

### 2. Privilege Boundary Handling
- **Decision**: Isolate privilege execution configuration in the runner. The runner supports executing unprivileged operations (like `list`) directly via `vmsan`, while accommodating privileged commands (like `create`, `start`, `stop`, `remove`) by checking environment/options or invoking `sudo env "PATH=..." vmsan` when configured. No password collection or prompt handling will be built.
- **Rationale**: In development and production environments, Firecracker requires elevated permissions (root / KVM access). If sudo is required, it must be pre-configured in sudoers without passwords (`NOPASSWD`) or the server process must run with appropriate privileges. The adapter cleanly surfaces a `VmsanError` when root is missing.
- **Alternatives Considered**:
  - Prompting user for sudo password via web UI: Rejected as fundamentally insecure and violates local application security guidelines.
  - Blindly prepending `sudo` to every command: Rejected because `vmsan list` and help commands can and should run without elevated privileges.

### 3. Parsing Strategy: Native JSON First with Graceful Fallback
- **Decision**: Invoke list operations with `--json` (e.g., `vmsan --json list`), parse the resulting JSON event structure (`{ path: "list", vms: [...] }`), and normalize fields into `VM` objects. Provide helper parsing functions that safely handle empty outputs, missing fields, or legacy formats.
- **Rationale**: `vmsan v0.3.0` emits structured JSON with `--json`, which is deterministic, resistant to formatting changes, and faster than regular expression table scraping.
- **Alternatives Considered**:
  - Scraping ANSI-colored text tables: Fragile, breaks on terminal width changes, color codes, or minor CLI text tweaks.

### 4. Input Validation Boundary
- **Decision**: Create a dedicated validation utility that enforces:
  - VM ID: Must match `/^[a-zA-Z0-9_-]{1,64}$/`.
  - Runtimes: Whitelist of `"base" | "node22" | "node24" | "python3.13"`.
  - Numeric parameters: `vcpus >= 1`, `memoryMiB >= 128`.
- **Rationale**: Defense-in-depth: validation stops invalid or malicious input before any child process is spawned.

### 5. Error Modeling: `VmsanError` & `VmsanValidationError`
- **Decision**: Define custom `Error` classes in `src/lib/vmsan/errors.ts`:
  - `VmsanValidationError`: Thrown on bad input parameters.
  - `VmsanError`: Thrown on CLI failure, storing `command`, `args`, `exitCode`, `stdout`, `stderr`.
- **Rationale**: Allows API routes and future UI callers to distinguish client validation errors (HTTP 400) from CLI runtime/permission errors (HTTP 500/502).

## Risks / Trade-offs

- **[Risk] Host `vmsan` executable not in PATH of Next.js server**:
  → *Mitigation*: Allow configuring an optional custom binary path via `process.env.VMSAN_BIN_PATH` (defaulting to `"vmsan"` in PATH).
- **[Risk] Privileged command execution requires root on host**:
  → *Mitigation*: Gracefully handle root requirement errors returned by `vmsan`, formatting them into clear `VmsanError` messages explaining that root privileges or sudoers configuration are needed.
- **[Risk] Command hang / child process freeze**:
  → *Mitigation*: Enforce a default timeout (e.g., 10,000ms) on all spawned processes with automated SIGTERM/SIGKILL termination.
