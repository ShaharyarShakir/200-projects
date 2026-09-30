# Design

## Context

See `proposal.md` for motivation.

The `vmsan-manager` is a standalone daemon running with elevated privileges required to interact with Firecracker/Jailer via `vmsan` 0.3.0 native API (`createVmsan()`). It accepts JSON-RPC requests over a local Unix domain socket (`vmsan-manager.sock`) with restricted permissions (`0660`).

Currently, the manager only exposes `health` and `list` methods. Next.js API route handlers for VM mutation (`POST /api/vms`, `POST /api/vms/[id]/start`, `POST /api/vms/[id]/stop`, `DELETE /api/vms/[id]`) return `VM_LIFECYCLE_UNAVAILABLE` (501) stubs.

This design outlines the architecture for introducing `vm.create`, `vm.start`, `vm.stop`, and `vm.remove` RPC methods across the manager, client library, and web API layers.

## Goals / Non-Goals

**Goals:**
- Extend `vmsan-manager` RPC protocol with typed `vm.create`, `vm.start`, `vm.stop`, and `vm.remove` methods.
- Maintain single long-lived native `VMService` instance in the manager process across all requests.
- Implement strict server-side validation for all lifecycle parameters (`vcpus`, `memoryMib`, `diskSizeGb`, `runtime`, `networkPolicy`, `timeoutMs`, `vmId`).
- Enforce strict server-side response sanitization via explicit allow-list projection so no internal tokens, host paths, or jailer details cross the socket boundary.
- Implement structured error code mapping (`INVALID_REQUEST`, `VALIDATION_ERROR`, `VM_NOT_FOUND`, `VM_INVALID_STATE`, `VM_OPERATION_FAILED`, `INTERNAL_ERROR`).
- Provide unprivileged Next.js manager client methods (`createVm`, `startVm`, `stopVm`, `removeVm`).
- Update Next.js API routes to delegate to the manager client and return standard HTTP responses.

**Non-Goals:**
- No CLI subprocess spawning, shell execution, or sudoers modifications.
- No terminal/WebSocket connection, exec, file upload/download, or snapshots.
- No client-controlled arbitrary Firecracker configuration, kernel/rootfs paths, or jailer options.
- No multi-user authentication or RBAC (reserved for later phases).
- No automatic VM health reconciliation in this phase.

## Decisions

### 1. Protocol Type Definitions & Method Dispatch
Extend `vmsan-manager/src/protocol.ts` with discriminated request/response definitions:
- Methods: `health`, `list`, `vm.create`, `vm.start`, `vm.stop`, `vm.remove`.
- `CreateVmParams`: `{ runtime?: RuntimeOption, vcpus?: number, memoryMib?: number, diskSizeGb?: number, networkPolicy?: NetworkPolicyOption, timeoutMs?: number }`.
- `VmIdParams`: `{ vmId: string }`.
- Success results:
  - `vm.create`: `ProtocolVm` (sanitized summary)
  - `vm.start`: `ProtocolVm` (sanitized state)
  - `vm.stop`: `ProtocolVm` (sanitized state)
  - `vm.remove`: `{ removed: true, vmId: string }`

*Rationale*: A closed discriminated union keeps RPC messages strictly typed and verifiable before method execution.

*Alternatives considered*:
- Generic execution method: Rejected as it weakens security boundaries and type guarantees.
- Separate control sockets per method: Rejected as unnecessary complexity; single socket with newline-delimited framing handles multiplexed RPC cleanly.

### 2. Parameter Validation with Strict Bounds
Implement validator functions in `vmsan-manager/src/protocol.ts`:
- `vcpus`: integer in `[1, 4]` (default: 1)
- `memoryMib`: integer in `[64, 4096]` (default: 512)
- `diskSizeGb`: integer in `[1, 20]` (default: 2)
- `runtime`: allow-list `['base', 'node22', 'node24', 'python3.13']` (default: `'base'`)
- `networkPolicy`: allow-list `['allow-all', 'deny-all', 'custom']` (default: `'allow-all'`)
- `timeoutMs`: optional integer in `[60000, 86400000]`
- `vmId`: non-empty string, matching safe identifier format `^[a-zA-Z0-9_-]+$`

*Rationale*: Defense-in-depth requires that the privileged daemon never trusts caller inputs. Explicit bounds prevent resource exhaustion or arbitrary path injection.

*Alternatives considered*:
- Validating solely in Next.js: Rejected because Next.js is unprivileged and untrusted from the manager's perspective.
- Passing raw parameters to `vmsan`: Rejected because native error messages may leak internal details.

### 3. Native Service Integration & Parameter Mapping
Extend `vmsan-manager/src/vmsan.ts` to wrap `VMService` methods:
- Map protocol `memoryMib` to native `CreateVmOptions.memMib`.
- Invoke `service.create()`, `service.start()`, `service.stop()`, `service.remove()`, and `service.get()`.
- Keep single initialized `vmsan` instance in `VmsanService`.

*Rationale*: Matches the exact installed vmsan 0.3.0 ESM API signatures without reinitializing state per request.

### 4. Server-Side Allow-List Response Sanitization
Implement `projectVmSummary(vm: VmState): ProtocolVm` in `vmsan-manager/src/vmsan.ts`:
- Output fields: `id`, `status`, `runtime`, `vcpuCount`, `memSizeMib`, `createdAt`, `snapshot`, `timeoutAt`, `tunnelHostnames`.
- Omit: `agentToken`, `agentPort`, `chrootDir`, `kernel`, `rootfs`, `apiSocket`, `pid`, jailer parameters, and host paths.

*Rationale*: Prevents credential and host architecture leakage to the unprivileged layer. Using explicit property picking (allow-list) ensures new fields added to native `VmState` in future vmsan versions are not inadvertently exposed.

### 5. Structured Error Classification & Sanitization
Map native exceptions to standardized error categories:
- `INVALID_REQUEST`: Malformed frame, missing ID, invalid method.
- `VALIDATION_ERROR`: Parameter bounds violation, invalid enum, malformed `vmId`.
- `VM_NOT_FOUND`: Target VM ID does not exist in vmsan store.
- `VM_INVALID_STATE`: Attempting to start an already running VM, stop a stopped VM, or remove a running VM.
- `VM_OPERATION_FAILED`: Native Firecracker/Jailer execution or resource allocation failure.
- `INTERNAL_ERROR`: Unexpected internal exception.

*Rationale*: Clean contract across the socket boundary. The manager logs full error diagnostics internally while returning sanitized, actionable error codes and messages to the client.

### 6. Next.js Client and API Route Layer
- `src/lib/vmsan-manager/client.ts`: Add `createVm(options)`, `startVm(id)`, `stopVm(id)`, `removeVm(id)`.
- `src/app/api/vms/route.ts`: Handle `POST` by parsing payload, validating, invoking `client.createVm()`, and returning 201.
- `src/app/api/vms/[id]/start/route.ts`: Handle `POST` by invoking `client.startVm()`, returning 200.
- `src/app/api/vms/[id]/stop/route.ts`: Handle `POST` by invoking `client.stopVm()`, returning 200.
- `src/app/api/vms/[id]/route.ts`: Handle `DELETE` by invoking `client.removeVm()`, returning 200 `{ "removed": true, "id": id }`.
- Map manager error codes to appropriate HTTP status codes (400 for `VALIDATION_ERROR`/`INVALID_REQUEST`, 404 for `VM_NOT_FOUND`, 409 for `VM_INVALID_STATE`, 502/503 for manager connection errors, 500 for `VM_OPERATION_FAILED`/`INTERNAL_ERROR`).

## Risks / Trade-offs

- **[Risk]** Native VM state conflicts from rapid consecutive requests (e.g. `start` then immediately `remove`).
  → **Mitigation**: Rely on native vmsan's internal state checks; serialize in-flight requests per client connection using promise queue; map conflicts cleanly to `VM_INVALID_STATE`.
- **[Risk]** Socket connection timeout during longer VM creation operations.
  → **Mitigation**: Set a reasonable timeout (e.g. 30s) on socket requests in Next.js client, with clear `ManagerUnavailableError` handling on timeout.
- **[Risk]** Exposure of internal tokens/paths during error conditions.
  → **Mitigation**: Sanitize error messages before sending over socket; log raw details only to manager's structured logger.
- **[Risk]** Manager restart leaves orphaned VMs or corrupts state.
  → **Mitigation**: Native vmsan service persists VM configuration on disk; manager reconnects to existing state directory without resetting VM records on restart.

## Migration Plan

1. Implement protocol updates, validation, and lifecycle handlers in `vmsan-manager`.
2. Implement unit tests for all lifecycle RPC methods in `vmsan-manager/test/`.
3. Update Next.js client library `src/lib/vmsan-manager/client.ts` with typed lifecycle methods.
4. Replace 501 unavailable stubs in Next.js API routes with active manager client calls.
5. Verify build and type checking across both `vmsan-manager` and Next.js projects.
6. Perform end-to-end integration test with a temporary disposable VM.
