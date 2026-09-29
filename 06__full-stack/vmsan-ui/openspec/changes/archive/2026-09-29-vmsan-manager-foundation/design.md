# Design

## Context

Motivation lives in `proposal.md`. This section records only the facts verified by inspection that constrain the implementation.

**Verified native API** (`vmsan@0.3.0`, resolved from `~/.local/share/fnm/node-versions/v24.21.0/installation/lib/node_modules/vmsan/dist/index.d.mts`):

- `createVmsan(options?: VmsanOptions): Promise<VMService>` — exported from the package root (`.` export maps to `dist/index.mjs` / `dist/index.d.mts`).
- `VmsanOptions = { paths?: string | VmsanPaths; store?: VmStateStore; logger?: VmsanLogger; plugins?: VmsanPlugin[] }`.
- `VMService.list(): VmState[]` — **synchronous**, returns an array. `VMService.get(vmId): VmState | null`. `create/start/stop/remove` exist and are async, but out of scope here.
- `vmsanPaths(baseDir?): VmsanPaths` resolves `$VMSAN_DIR` → `$SUDO_USER` home → current `$HOME`, defaulting to `~/.vmsan`.
- `VmState` carries `agentToken: string | null` alongside `id`, `project`, `runtime`, `status`, `pid`, `createdAt`, `memSizeMib`, `vcpuCount`, `snapshot`, `error`, `network`, and host paths (`chrootDir`, `kernel`, `rootfs`, `apiSocket`).
- `createVmsan` also runs `cloudflarePlugin(baseDir).setup(ctx)` during construction. This is a read of the cloudflare config dir, not a network mutation, but it is a startup side effect worth knowing.
- `vmsan` is **not** a dependency of this repo. It is installed globally under fnm and is separately published on the npm registry at `0.3.0`.

**Live host state at planning time:** `vmsan --json list` reports `vm-1691d65a` (running) and `vm-c5c6c204` (creating). The `vm-6ce50edc` named in the phase brief is not present. Existing VMs are test infrastructure and are read-only.

**Repo state:** `pnpm@12.6.0`, Next.js 16.3.6, `tsx --test` for unit tests, `pnpm-workspace.yaml` currently holds only `allowBuilds` (no `packages` key). Root `test` globs `src/**/*.test.ts` only. `.env.local` sets `VMSAN_SUDO=true` and `README.md` documents a NOPASSWD sudoers rule — both describe the boundary this change replaces.

## Goals / Non-Goals

**Goals:**
- Prove the native vmsan API is drivable in-process from a long-lived privileged process, and that VM state can be read through it without the CLI.
- Make the privilege boundary a process boundary with a filesystem-typed permission gate, not a sudo policy.
- Keep the manager's request surface so small it can be audited line by line: two methods, one allow-listed response projection, one frame size cap.
- Make every test runnable without root, without Firecracker, and without touching live VMs.

**Non-Goals:**
- Migrating `/api/vms` to the manager. Routes keep calling the CLI adapter until a later phase.
- Deleting `src/lib/vmsan/`, `VMSAN_SUDO`, or the sudoers documentation. This change makes them unexercised, not removed.
- Choosing the production privilege mechanism (systemd unit, socket activation, polkit). The socket is created with owner-restricted permissions now; who owns it is a later decision.
- Any authenticated control plane. Peer identity is filesystem permissions only in this phase.

## Decisions

### D1. `vmsan@0.3.0` as a real dependency of the manager package

`vmsan-manager/package.json` declares `vmsan: "0.3.0"` exactly (no range) and imports it normally (`import { createVmsan } from "vmsan"`).

*Alternative considered:* resolving the global fnm install at runtime via a `VMSAN_PACKAGE_PATH` env var. Rejected — it embeds a machine-specific path in config, gives no type safety, and silently drifts from the version under test. The package is published on the registry, so a pinned install is reproducible and keeps `vm-6ce50edc`-era drift impossible.

*Consequence:* the manager's `node_modules` is separate from the Next.js app's. The web process therefore *cannot* import `vmsan` even accidentally, which makes the dependency-direction requirement structurally true rather than a convention.

### D2. Manager is a pnpm workspace package with its own toolchain scripts

`pnpm-workspace.yaml` gains `packages: ["vmsan-manager"]`. The manager has its own `test` (`tsx --test 'src/**/*.test.ts'` scoped to its own dir), `typecheck` (`tsc --noEmit --project vmsan-manager/tsconfig.json`), and `start` scripts. Root `test` and `typecheck` become sequences that include the manager.

*Alternative considered:* keeping the manager fully outside the workspace. Rejected — a separate lockfile for one sibling package guarantees install drift, and the root quality gates (`pnpm test`, `pnpm typecheck`) in the acceptance criteria would silently skip the manager entirely.

*Consequence:* the manager gets its own `tsconfig.json` that excludes React/JSX/Next.js types and sets `types: ["node"]`, so an accidental import of UI code fails typecheck rather than silently working.

### D3. Newline-delimited JSON over `node:net`, with a 64 KiB frame cap

One JSON object per `\n`. The read loop accumulates into a buffer, extracts complete lines, and enforces a hard cap on both the buffered remainder and any single line. Over-cap data triggers a `REQUEST_TOO_LARGE` failure response and the connection is closed — the manager does not keep buffering a frame it has already refused.

*Alternative considered:* a length-prefixed binary framing. Rejected as unnecessary complexity for two methods; NDJSON is greppable with `socat` and `nc -U` during the manual smoke test, which is worth more here than framing elegance.

*Alternative considered:* HTTP over the Unix socket. Rejected — the acceptance criteria explicitly ask for no TCP-style HTTP listener, and NDJSON keeps the handler a pure function from bytes to bytes.

### D4. `VmsanService` wrapper with lazy singleton, injected for tests

`vmsan-manager/src/vmsan.ts` exposes a `createVmsanService(config)` that calls `createVmsan({ paths: config.vmsanDir })` once and returns the `VMService`, plus a `listVms(service)` that maps `VmState[]` through a field allow-list. Handlers receive the service as an argument rather than importing a module-level singleton, so unit tests inject a fake `VMService` and assert the real code path without root or Firecracker.

`VMSAN_DIR` is passed explicitly as `paths` rather than left to `vmsanPaths()`' environment sniffing. This matters specifically because the manager runs as root: `resolveBaseDir()` would otherwise prefer `$SUDO_USER` and silently read a different directory than the unprivileged user does. Passing `paths` explicitly makes the manager and the operator agree on one location by construction.

*Alternative considered:* a module-level `let service` initialized at import. Rejected — it makes the "initialized exactly once" requirement untestable without import-order side effects.

### D5. Response redaction is an allow-list projection, not a denylist

`toProtocolVm(state: VmState)` constructs each entry field by field: `id`, `status`, `runtime`, `vcpuCount`, `memSizeMib`, `createdAt`, `snapshot`, `timeoutAt`, and a `tunnelHostnames` array. `agentToken` is absent by construction — there is no code path that copies it, so adding a new sensitive field to `VmState` in a future vmsan release cannot leak it. Host paths (`chrootDir`, `kernel`, `rootfs`, `apiSocket`) and `pid` are also excluded as host internals the dashboard does not need.

A test asserts the serialized `list` response contains none of `agentToken`, `chrootDir`, `kernel`, `rootfs`, `apiSocket`, or `pid` — using a `VmState` fixture populated with canary values for each, so a future change that starts spreading the raw object fails the test rather than shipping.

### D6. Protocol types live in `vmsan-manager/src/protocol.ts` and are re-declared (not imported) by the web client

The Next.js client at `src/lib/vmsan-manager/protocol.ts` declares its own copy of the request/response contract plus the response types, and a test asserts the two declarations stay in sync by exercising the same fixtures through both. A cross-package type import would drag the manager's `tsconfig` (no DOM lib, no React) into the Next.js build, and a `paths` alias pointing into a package that depends on `vmsan` would risk pulling `vmsan` into the web bundle. The duplication is small (roughly 30 lines) and the sync test makes drift loud.

*Alternative considered:* publish the protocol as a third workspace package with no dependencies. Cleaner long-term, but it adds a package and a build step to a phase whose job is proving the architecture; the sync test gets us the safety without the structure.

### D7. Log level gating is explicit and payload-free

`logger.ts` exposes `error/warn/info/debug` writing `LEVEL message key=value` lines to stderr, filtered by `logLevel`. Request logs record method and id only. VM data is never logged — the `list` handler logs `count=<n>`, not the records. No `process.env` dump exists in the codebase.

*Alternative considered:* structured JSON logs. Rejected for this phase — key=value lines match the operator-facing format in the phase brief and stay readable under `sudo` with no log shipper present.

### D8. Graceful shutdown drains in-flight work without a hard timeout race

On `SIGINT`/`SIGTERM` the manager sets a `shuttingDown` flag that makes the connection handler reject new requests, calls `server.close()` (stops accepting), awaits the in-flight request set with a bounded grace period, then unlinks the socket path it created and exits. It never calls `VMService.stop` or `remove` — the service holds no VM ownership, and destroying state on exit would be the exact failure the phase brief calls out.

### D9. Stale-socket handling is checked, not assumed

On startup, if the configured socket path exists, the manager `lstat`s it, confirms it is a socket, and attempts a probe connection. A live listener means "another manager is already running" → refuse to start with a clear error. A dead socket means a leftover file → unlink and proceed. Anything that is not a socket → refuse to start. The manager never blindly `unlink`s a path it has not classified, and never chmods a socket to work around a permission error.

### D10. Test strategy: mocked `VMService` for everything, one documented manual integration step

Unit tests construct a fake `VMService` object with just `list()` and assert the manager's handler, redaction, and framing against it. The socket tests use a real `node:net` server bound to a `tmpdir()` path, so framing and validation are exercised for real without privileges. No test imports `vmsan` — only the composition root in `vmsan.ts` does, and that module is the one seam tests replace.

The single manual integration check (real `vmsan`, real VMs, real root) is written as a documented procedure in the change, not an automated test, because it needs a privileged context and must not mutate live VM state. It asserts `health` succeeds, `list` returns the currently-running VMs including `vm-1691d65a`, and that the returned `agentToken` is absent.

## Risks / Trade-offs

- **Duplicated protocol types between manager and web client** → Mitigated by a cross-checking sync test over shared fixtures; revisit with a dedicated protocol package if the method set grows past a handful.
- **`createVmsan` runs `cloudflarePlugin(...).setup()` during construction** → The manager inherits a cloudflare-config read at startup. Verified read-only by inspecting the plugin source; if a future vmsan version makes plugin setup mutating, the manager inherits that risk. Pinned exact version limits the exposure, and the integration procedure checks the manager starts cleanly against the live install.
- **Manager runs as root and reads/writes `$VMSAN_DIR`** → Mitigated by passing `paths` explicitly (never `$SUDO_USER` sniffing), owner-restricted socket permissions, and never logging config values. Root ownership of `$VMSAN_DIR` itself is expected — the manager is the only writer.
- **Allow-list projection may lag the dashboard's needs** → The projection is the place to extend when the UI needs more; the canary test makes each addition deliberate rather than accidental.
- **Workspace wiring changes root install and test topology** → Every added root script must delegate to the manager rather than duplicate its logic, so `pnpm test` at the root is the single source of truth for "tests pass".
- **No authentication beyond filesystem permissions** → Explicitly scoped out. Any user who can open the socket has full manager authority, so the production socket owner/group decision is a prerequisite for multi-user hosts and belongs to the later privilege-boundary design.
- **Two `VMService`-adjacent code paths now exist** (the old CLI adapter and the new manager) and diverge over time → Accepted for one phase. The adapter is untouched and unexercised on the request path; removing it is a separate, later change with its own route migration.
