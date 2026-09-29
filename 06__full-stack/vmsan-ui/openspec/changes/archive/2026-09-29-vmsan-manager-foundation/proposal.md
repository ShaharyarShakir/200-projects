# Proposal

## Why

The application currently reaches Firecracker by shelling out to the `vmsan` CLI as an unprivileged user and escalating with `sudo -n` against a NOPASSWD rule that points at a user-writable executable under `~/.local/share/fnm/...`. That boundary is unsound: anyone who can write to that path controls what runs as root, and every request pays the cost of parsing CLI text output. vmsan 0.3.0 ships a native TypeScript API (`createVmsan()` returning a `VMService`) that can be driven in-process, so the escalation can be moved into a single small privileged daemon and the Next.js process can stay unprivileged with no sudo rule at all.

## What Changes

- **New `vmsan-manager` process** — a separate package (`vmsan-manager/`) that runs as root, imports `vmsan@0.3.0` as a real dependency, and calls `createVmsan()` exactly once at startup to hold a single long-lived `VMService` instance.
- **Unix domain socket control plane** — the manager listens on a Unix socket (development: `$XDG_RUNTIME_DIR/vmsan-manager.sock`, production: `/run/vmsan-manager.sock`) speaking newline-delimited JSON. No TCP listener is introduced.
- **Typed internal RPC** — a discriminated `ManagerRequest`/`ManagerSuccess`/`ManagerFailure` protocol, request validation with a 64 KiB frame cap, and structured error codes that never carry stack traces, environment variables, tokens, or command lines.
- **`health` and `list` methods only** — `list` calls `vmsan.list()` natively and returns a redacted projection of the resulting `VmState[]` records. `agentToken` and other internal fields are stripped. No create/start/stop/remove in this phase.
- **Request validation and socket hardening** — every frame is validated before dispatch; the socket is created with owner-only permissions and never `chmod 777`.
- **Graceful shutdown** — `SIGINT`/`SIGTERM` stop accepting connections, drain in-flight requests, close the socket, and release the service without touching running VMs.
- **Structured server-side logging** at `error|warn|info|debug`, with no tokens, environment dumps, or request payloads logged.
- **New Next.js-side manager client** at `src/lib/vmsan-manager/` (`client.ts`, `protocol.ts`, `errors.ts`) that talks to the socket over `node:net` and exposes `manager.health()` and `manager.list()`. It does not import `vmsan`.
- **Workspace wiring** — `vmsan-manager` is added to `pnpm-workspace.yaml` with its own `test`/`typecheck`/`lint` scripts using the existing `tsx --test` runner.
- **Tests** — unit tests for protocol validation, manager dispatch, single-initialization, redaction, and the Next.js client, all with the native vmsan API mocked so no privileged Firecracker VM is required. One documented manual integration check against the real installation.
- The existing CLI-based adapter in `src/lib/vmsan/` and the existing `/api/vms` routes are left in place in this phase. Nothing switches over and no CLI path is deleted until a later phase migrates the routes.

## Capabilities

### New Capabilities
- `vmsan-manager`: The privileged out-of-process manager — native vmsan service lifecycle, Unix socket listener, typed request/response protocol, request validation, field redaction, socket permission policy, graceful shutdown, and non-leaking operational logging.

### Modified Capabilities
- `vmsan-adapter`: The `Privileged Command Execution` requirement (NOPASSWD sudo, `VMSAN_SUDO`, `sudo -n` spawning) is removed. A new `No In-Process Privilege Escalation` requirement replaces it, making the privileged manager process the only sanctioned path to Firecracker. The adapter's CLI behavior otherwise stays as-is until routes migrate in a later phase.

## Impact

- **New package**: `vmsan-manager/` (own `package.json`, `tsconfig.json`, `src/`, tests). Depends on `vmsan@0.3.0`; imports no React, Next.js, or browser code.
- **New dependencies** (manager package only): `vmsan@0.3.0`. No new runtime dependency in the Next.js app.
- **New module**: `src/lib/vmsan-manager/` in the Next.js app — socket client, protocol types, error types. Uses `node:net` only.
- **Build/test wiring**: `pnpm-workspace.yaml` gains `packages: [vmsan-manager]`; root `test`/`typecheck` gain manager-aware entry points.
- **Architecture**: Next.js stays unprivileged (`uid != 0`); the manager is the only privileged process. No sudoers file, no systemd unit, no `/etc/sudoers.d/vmsan` drop-in. Operators drop the existing sudoers rule and `VMSAN_SUDO=true` in `.env.local` once the manager is in use.
- **Docs (follow-up, not in this change)**: `README.md` still documents the NOPASSWD sudoers setup. Correcting it is deferred to the phase that migrates the routes, so the README and the code stay in step.
- **Host state**: strictly read-only against the existing vmsan installation. No VM create/start/stop/remove, no network policy edits, no snapshot or rootfs changes.
- **Out of scope**: create/start/stop/remove RPC methods, custom names, dashboard UI changes, terminal, file transfer, snapshots, OCI image handling, network policy UI, auth tokens, remote TCP access, and the eventual systemd/privilege-boundary design.
- **Not done by this change**: no git commit, no worktree, no Worktrunk. Version control stays under human control.
