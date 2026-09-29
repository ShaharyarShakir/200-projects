# Tasks

## 1. Workspace and Manager Package Setup

- [x] 1.1 Add `packages: ["vmsan-manager"]` to `pnpm-workspace.yaml` and verify with `pnpm -r list --depth -1` that both `vmsan-ui` and `vmsan-manager` are recognized workspace packages
- [x] 1.2 Create `vmsan-manager/package.json` with `vmsan: "0.3.0"` pinned exactly, `tsx` and `typescript` as devDependencies, and `test` / `typecheck` / `start` scripts, then verify `pnpm install` resolves `vmsan` at exactly `0.3.0` in `vmsan-manager/node_modules/vmsan/package.json`
- [x] 1.3 Create `vmsan-manager/tsconfig.json` with `types: ["node"]`, no `jsx`, and a `lib` set that excludes DOM, then verify a scratch file importing `react` or referencing `document` fails `pnpm -r typecheck` in the manager package
  - Note: the `lib`/`types` settings reject browser globals like `document`, but a bare `import from "react"` still typechecks because Node resolution walks up to the workspace root `node_modules` where the Next.js app's React lives. Task 6.3's source scan closes this gap; the tsconfig alone does not.
- [x] 1.4 Update the root `test` and `typecheck` scripts to delegate to the manager package in addition to the existing root checks, and verify `pnpm test` and `pnpm typecheck` execute both projects

## 2. Manager Configuration and Logging

- [x] 2.1 Implement `vmsan-manager/src/config.ts` exposing a `ManagerConfig` of `socketPath`, `vmsanDir`, `logLevel`, and `maxRequestBytes`, resolving values from environment with a `$XDG_RUNTIME_DIR` socket default and a `~`-relative vmsan directory default, and verify with unit tests that the resolved config never contains a hard-coded user home path
- [x] 2.2 Implement `vmsan-manager/src/logger.ts` with level-filtered `error`/`warn`/`info`/`debug` writing `LEVEL message key=value` to stderr, and verify with unit tests that a record below the configured level is not written and that no record contains environment variable values

## 3. Protocol Types and Validation

- [x] 3.1 Implement `vmsan-manager/src/protocol.ts` with the discriminated `ManagerRequest` union (`health` and `list` only), `ManagerSuccess<T>`, `ManagerFailure`, the protocol VM entry type, and error codes, then verify with unit tests that each method variant narrows correctly
- [x] 3.2 Implement frame validation covering malformed JSON, missing or non-string `id`, unknown methods, and the 64 KiB size cap, and verify with unit tests in `vmsan-manager/src/__tests__/protocol.test.ts` that each rejection case produces its specific error code

## 4. Native vmsan Service and Redaction

- [x] 4.1 Implement `vmsan-manager/src/vmsan.ts` with `createVmsanService(config)` calling `createVmsan({ paths: config.vmsanDir })` once and returning the `VMService`, and verify with a unit test using an injected factory that it is called exactly once and that the configured `vmsanDir` is passed through as `paths`
- [x] 4.2 Implement `toProtocolVm(state)` as a field-by-field allow-list projection of `VmState`, and verify with a unit test using a `VmState` fixture with canary values in `agentToken`, `chrootDir`, `kernel`, `rootfs`, `apiSocket`, and `pid` that none of those keys or values appear in the projected output or its serialization
- [x] 4.3 Implement `listVms(service)` mapping `service.list()` through the projection, and verify with a unit test against a fake `VMService` that an empty array yields an empty collection rather than an error and a populated array yields one entry per VM

## 5. Socket Server and Request Handling

- [x] 5.1 Implement `vmsan-manager/src/server.ts` with a `node:net` Unix socket server, newline-delimited JSON framing, the frame size cap enforced on both the buffer and each line, and owner-restricted socket permissions, and verify with integration tests against a real server on a `tmpdir()` path that a valid frame is served and the socket mode is not world-writable
- [x] 5.2 Implement the `health` and `list` method dispatch with the service passed in rather than imported, and verify with tests that a `health` request returns `{ status: "ok" }` and a `list` request returns the projected VM records
- [x] 5.3 Implement structured failure responses for unknown methods and handler errors, and verify with tests that a failed request emits `{ ok: false, error: { code, message } }` containing no stack trace, environment value, token, or command line
- [x] 5.4 Implement stale-socket detection (lstat, confirm socket type, probe for a live listener, unlink only a dead socket, refuse otherwise) and verify with tests that a non-socket file at the path causes a clear refusal and that a live listener causes a refusal
- [x] 5.5 Verify that a connection survives an invalid frame by sending a malformed frame followed by a valid one in a single test and asserting the first is rejected and the second is served

## 6. Manager Entry Point and Shutdown

- [x] 6.1 Implement `vmsan-manager/src/index.ts` as the composition root: load config, initialize the logger, create the single vmsan service, bind the socket, and log the startup sequence (manager starting, vmsan service initialized, listening on unix socket) in that order
- [x] 6.2 Implement `SIGINT`/`SIGTERM` handling that stops accepting new requests, drains in-flight requests within a bounded grace period, closes connections, unlinks the socket, and exits, and verify with a test that an in-flight request receives its response before the process exits and that no `stop` or `remove` call is made on the service
- [x] 6.3 Verify the manager source contains no `child_process` import and no `exec`/`execSync`/`spawn` call by a source scan test that greps the manager's own `src` directory and fails the build if any match is found

## 7. Next.js-Side Manager Client

- [x] 7.1 Create `src/lib/vmsan-manager/protocol.ts` re-declaring the manager request and response contract plus the protocol VM type, and `src/lib/vmsan-manager/errors.ts` defining `ManagerUnavailableError` and `ManagerProtocolError`
- [x] 7.2 Implement `src/lib/vmsan-manager/client.ts` with `health()` and `list()` over a `node:net` Unix socket connection, and verify with tests that a successful health and a successful list return the manager's results
- [x] 7.3 Implement client error mapping for an unreachable or missing socket, a malformed manager response, and a manager failure response, and verify with tests that each raises the corresponding typed error without hanging
- [x] 7.4 Add a sync test that runs the same request and response fixtures through both the manager's and the client's protocol types to confirm the two declarations agree, and verify it passes
- [x] 7.5 Verify the client module graph contains no import of `vmsan` by a test that scans `src/lib/vmsan-manager/` for the import specifier and fails if present

## 8. Quality Gates and Phase Report

- [x] 8.1 Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` at the repository root and verify all pass
- [x] 8.2 Confirm the existing `src/lib/vmsan/` adapter and the `/api/vms` routes are unmodified in behavior, and that the repository has no new commits, no worktrees, and no Worktrunk state
  - Verified: `src/lib/vmsan/**` and `src/app/api/vms/**` carry no edits from this phase (their dirty status predates it). `HEAD` is still `ba72cd33`, no commit was made, and the only files this phase added outside `vmsan-manager/` are `src/lib/vmsan-manager/**`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and the openspec artifacts.
  - The three extra `git worktree` entries are pre-existing prunable records pointing at a stale `/home/shaharyarshakir/...` path; this phase created none. No `.worktrunk` directory exists.
  - One out-of-scope file changed with approval: `src/lib/api/types.ts`, where the unused `name`/`vmsanId` fields were made optional to clear ~19 pre-existing type errors blocking the build gate. See task 8.1.
- [x] 8.3 Record the phase report: status, files changed, native API verified, manager socket, manager privilege, Next.js privilege, tests, and remaining issues
  - Written to `phase-report.md`. All 27 tasks are complete.

## Deferred to the next phase

The privileged (uid 0) integration run and the privilege-split proof were dropped
from this change's task list at the user's request and are next phase's work. The
foundation itself is verified: the protocol, the native call, the redaction, and the
web client were all exercised end to end against the live vmsan installation, with
the manager running as the unprivileged user. What that does *not* prove is that the
manager works as uid 0; that check is deferred, so it is recorded as an open item in
`phase-report.md` rather than a completed task here.
