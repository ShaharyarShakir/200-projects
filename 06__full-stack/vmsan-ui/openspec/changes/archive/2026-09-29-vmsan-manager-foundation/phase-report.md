# Phase 1B.1 Report — vmsan Manager Foundation

**Status:** complete. All 27 tasks done.

**Known limitation:** the manager has only been run as an unprivileged user. The
uid 0 run and the privilege-split proof are deferred to the next phase, so "this
works" below means the protocol, the native call, the redaction, and the client are
verified — not that the manager has been shown to work as root.

## What this phase did

Added a privileged manager that exposes vmsan's **native** library API over a Unix
socket, and an unprivileged client in the Next.js app that talks to it. The manager
replaces the need for the web app to shell out to the `vmsan` CLI with `sudo`, but
only for `health` and `list`; the existing `src/lib/vmsan/` adapter and the
`/api/vms` routes are untouched and still in use.

## Native API, as verified against the installed package

`vmsan@0.3.0`, installed at `vmsan-manager/node_modules/vmsan/package.json`.

- `createVmsan(options?): Promise<VMService>`
- `VMService.list(): VmState[]` — **synchronous**, not a promise
- `VmsanOptions.paths` is honoured and is the seam that keeps the manager pointed at
  the operator's directory instead of vmsan's `$SUDO_USER` fallback
- `VmState` carries `agentToken`, so the projection had to be an allow-list

The manager imports `vmsan` dynamically, and only in `vmsan-manager/src/vmsan.ts`.

## Files added

Manager (privileged, uid 0):

| File | Purpose |
|---|---|
| `vmsan-manager/package.json` | `vmsan` pinned to exactly `0.3.0` |
| `vmsan-manager/tsconfig.json` | `types: ["node"]`, no DOM, no JSX |
| `vmsan-manager/src/config.ts` | `socketPath`, `vmsanDir`, `logLevel`, `maxRequestBytes` |
| `vmsan-manager/src/logger.ts` | level-filtered `LEVEL message key=value` on stderr |
| `vmsan-manager/src/protocol.ts` | request/response contract, frame validation |
| `vmsan-manager/src/vmsan.ts` | native service creation and the allow-list projection |
| `vmsan-manager/src/server.ts` | `node:net` Unix socket server, dispatch, shutdown |
| `vmsan-manager/src/index.ts` | composition root and signal handling |
| `vmsan-manager/src/__tests__/*.test.ts` | 95 tests |

Web app (unprivileged):

| File | Purpose |
|---|---|
| `src/lib/vmsan-manager/protocol.ts` | independent re-declaration of the contract |
| `src/lib/vmsan-manager/errors.ts` | `ManagerUnavailableError`, `ManagerProtocolError`, `ManagerRequestError` |
| `src/lib/vmsan-manager/client.ts` | `health()` and `list()` over `node:net` |
| `src/lib/vmsan-manager/__tests__/client.test.ts` | client behaviour against a fake manager |
| `src/lib/vmsan-manager/__tests__/protocol-sync.test.ts` | keeps the two protocol declarations in step |

Modified: `package.json` (root `test`/`typecheck` now delegate to the manager),
`pnpm-workspace.yaml`, `pnpm-lock.yaml`.

Out of scope but changed with approval: `src/lib/api/types.ts` (see below).

## Design decisions worth knowing

- **The protocol is duplicated, not imported.** Importing the manager's types from
  the web app would drag the manager's `tsconfig` and its `vmsan` dependency into the
  Next.js build. `protocol-sync.test.ts` is the only thing keeping the two
  declarations honest; it fails if a field, method, or error code drifts.
- **Redaction is structural.** `toProtocolVm` builds each field by hand, so
  `agentToken`, `chrootDir`, `kernel`, `rootfs`, `apiSocket`, and `pid` have no code
  path to reach the socket. A source-scan test asserts the production manager source
  never mentions `agentToken` at all.
- **The manager runs no processes.** No `child_process`, no `exec`/`execSync`/`spawn`,
  no `node:vm`. Enforced by scanning the manager's own `src`, because the security
  claim "a protocol bug cannot become root command execution" has to be mechanical.
- **Socket permissions are `0660`** (owner and group). Not world-writable, never
  `0777`.
- **One request per connection** on the client. The manager serializes frames per
  connection, so there is nothing to multiplex, and each call gets a fresh socket.
- **Error codes are validated at runtime on the client.** The manager and the app
  ship together, so an unrecognized code means a version mismatch; failing loudly is
  better than passing it to a route that would map it blindly.

## Tests and gates

| Gate | Result |
|---|---|
| `pnpm test` (web app) | 274 passed, 0 failed |
| `pnpm test` (manager) | 95 passed, 0 failed |
| `pnpm lint` | clean |
| `pnpm typecheck` | clean, both projects |
| `pnpm build` | success |

### Clearing the build gate

`pnpm typecheck` and `pnpm build` were already failing before this phase, on ~19
errors in `src/components/vms/**`: test fixtures missing `name` and `vmsanId` on
`ClientVM`, and `create-vm-dialog.tsx` not passing `name`. Nothing in this phase
touched those files. With approval they were fixed at the type level rather than by
editing 19 fixtures: no component reads `name` or `vmsanId`, and `/api/vms` never
supplies them, so both are now optional on `ClientVM` and `CreateVMRequest` with a
comment explaining why. If those fields are meant to be populated, that is a
separate piece of work on the `/api/vms` route.

## Integration verification

### Unprivileged end-to-end (done, uid 10002)

The full path was exercised for real against the live vmsan installation, with the
manager running as the unprivileged user:

- manager started, logged `manager starting` → `vmsan service initialized` →
  `listening on unix socket mode=660`
- socket appeared as `srw-rw---- 1 shaharyar shaharyar ... vmsan-manager.sock`
- `{"id":"1","method":"health"}` → `{"id":"1","ok":true,"result":{"status":"ok"}}`
- `{"id":"2","method":"list"}` → both live VMs, `vm-1691d65a` (running) and
  `vm-c5c6c204` (creating)
- the real Next.js client (`createManagerClient`) read them back:
  `list count: 2`, `leaks agentToken: false`, `leaks host path: false`
- SIGTERM drained and unlinked the socket; no process left behind

This proves the protocol, the native call, the redaction, and the client. It does
**not** prove the manager works as uid 0, which is next phase's work.

### Privileged run — deferred

The uid 0 run and the privilege-split proof were removed from this change's task list
at the user's request. Nothing about the manager's root behaviour has been tested yet;
see remaining issue 1.

## Remaining issues

1. **The manager has never been run as uid 0.** Every run so far was uid 10002. The
   privilege split is the entire point of the design and remains unproven; the whole
   uid 0 integration run is deferred to the next phase. Treat the manager as
   unvalidated under root until that happens.
2. **`name` and `vmsanId` on `ClientVM` are still unpopulated.** Fixed only enough to
   compile; the fields are unused and the route does not fill them.
3. **No duplicate request-id tracking.** Frame validation rejects a missing,
   non-string, or over-long `id`, but two frames on one connection may reuse an id.
   Each request gets a fresh response, so a confused client could mis-correlate. The
   client sends one request per connection, which is why it is not exploitable today.
4. **Unterminated frames are buffered indefinitely.** A client that connects and never
   sends a newline holds a socket and memory until it disconnects. There is no idle
   timeout on a connection.
5. **The frame cap is applied to the buffer before lines are split.** A single chunk
   carrying more than 64 KiB of individually valid frames is rejected wholesale
   rather than served frame by frame.
6. **Multi-byte UTF-8 split across chunks** is decoded per chunk, so a character
   straddling a chunk boundary in an echoed `method` value could be mangled in the
   error message. The message is sanitized and length-capped regardless.
7. **Shutdown grace is a fixed constant** rather than configurable, and `close()`
   snapshots in-flight requests once, so frames arriving during the drain are refused
   with `SHUTTING_DOWN` instead of served.
8. **The manager's `0660` socket needs a group strategy in production.** A
   root-owned socket is only reachable by root and whatever group owns it; a dedicated
   group, or a systemd socket unit with an explicit mode, is the follow-up work.
9. **`src/lib/api/vms.ts` and the routes are still the old CLI path.** Migrating them
   to the manager client is the next phase.

## Repository state

`HEAD` is unchanged at `ba72cd33`. No commit, no new worktree, no Worktrunk state.
The three extra `git worktree` entries are pre-existing prunable records pointing at
a stale `/home/shaharyarshakir/...` path.
