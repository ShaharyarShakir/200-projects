# Proposal

## Why

The `vmsan-manager` daemon currently exposes only read-only `health` and `list` methods, forcing the web application's VM lifecycle routes (`POST /api/vms`, `POST /api/vms/[id]/start`, `POST /api/vms/[id]/stop`, `DELETE /api/vms/[id]`) to return `VM_LIFECYCLE_UNAVAILABLE` 501 stubs. To enable full microVM lifecycle management from the unprivileged web dashboard without compromising security or resorting to `sudo`/CLI execution, the privileged manager must be extended with explicitly validated and sanitized lifecycle RPC methods (`vm.create`, `vm.start`, `vm.stop`, `vm.remove`).

## What Changes

- Extend `vmsan-manager` RPC protocol to support `vm.create`, `vm.start`, `vm.stop`, and `vm.remove` methods alongside existing `health` and `list` methods.
- Expand `vmsan-manager`'s `VmsanService` wrapper and native interface to include `get`, `create`, `start`, `stop`, and `remove` operations from the single long-lived native `VMService` instance.
- Implement strict server-side validation in `vmsan-manager` for VM creation options (`vcpus` 1–4, `memoryMib` 64–4096, `diskSizeGb` 1–20, `runtime` allow-list, `networkPolicy` allow-list, `timeoutMs` 60,000–86,400,000) and VM identifiers.
- Implement structured manager error mapping (`VALIDATION_ERROR`, `VM_NOT_FOUND`, `VM_INVALID_STATE`, `VM_OPERATION_FAILED`, `INTERNAL_ERROR`).
- Enforce strict server-side response sanitization ensuring sensitive internal fields (such as `agentToken`, host paths, Firecracker/Jailer internals) are never returned across the socket boundary.
- Extend Next.js manager client (`src/lib/vmsan-manager/client.ts`) with typed methods: `createVm()`, `startVm()`, `stopVm()`, and `removeVm()`.
- Update Next.js API route handlers (`POST /api/vms`, `POST /api/vms/[id]/start`, `POST /api/vms/[id]/stop`, `DELETE /api/vms/[id]`) to delegate directly to the manager client and map responses/errors cleanly.

## Capabilities

### New Capabilities
<!-- None: all capabilities extend existing specs -->

### Modified Capabilities
- `vmsan-manager`: Add requirements for VM creation (`vm.create`), start (`vm.start`), stop (`vm.stop`), and removal (`vm.remove`) RPC methods, parameter validation bounds, lifecycle error mapping, and sanitized lifecycle responses.
- `vm-api`: Update requirements for microVM creation (`POST /api/vms`), start (`POST /api/vms/:id/start`), stop (`POST /api/vms/:id/stop`), and deletion (`DELETE /api/vms/:id`) to route through the manager client rather than returning unavailable stubs.

## Impact

- `vmsan-manager/src/protocol.ts`: Added request/response types and error codes for VM lifecycle methods.
- `vmsan-manager/src/vmsan.ts`: Added `get`, `create`, `start`, `stop`, and `remove` to `VmsanService` and lifecycle projection functions.
- `vmsan-manager/src/server.ts`: Added request dispatching and execution for lifecycle methods.
- `src/lib/vmsan-manager/client.ts`: Added `createVm`, `startVm`, `stopVm`, `removeVm` client functions.
- `src/app/api/vms/route.ts` & `src/app/api/vms/[id]/...`: Active lifecycle operations replacing unavailable responses.
- No changes to sudoers, no child process invocation, and no `vmsan` package imports in Next.js.
