# Tasks

## 1. Manager Protocol and Parameter Validation

- [x] 1.1 Extend RPC protocol types in `vmsan-manager/src/protocol.ts` with `vm.create`, `vm.start`, `vm.stop`, and `vm.remove` request/response types and error codes (`INVALID_REQUEST`, `VALIDATION_ERROR`, `VM_NOT_FOUND`, `VM_INVALID_STATE`, `VM_OPERATION_FAILED`, `INTERNAL_ERROR`), and verify by running TypeScript check in `vmsan-manager`.
- [x] 1.2 Implement strict parameter validators in `vmsan-manager/src/protocol.ts` for VM creation options (`vcpus` in [1, 4], `memoryMib` in [64, 4096], `diskSizeGb` in [1, 20], `runtime` allow-list, `networkPolicy` allow-list, `timeoutMs` in [60000, 86400000]) and VM ID string format, and verify with protocol unit tests.

## 2. Manager Native Service Wrapper and Response Sanitization

- [x] 2.1 Extend `VmsanService` in `vmsan-manager/src/vmsan.ts` to implement `get`, `create`, `start`, `stop`, and `remove` methods on the long-lived native `VMService` instance, mapping protocol parameters (`memoryMib` → `memMib`) to native `CreateVmOptions`.
- [x] 2.2 Implement allow-list projection and error categorization in `vmsan-manager/src/vmsan.ts` to strip sensitive fields (`agentToken`, `agentPort`, `chrootDir`, host paths, jailer internals) and map native errors to structured protocol error codes.

## 3. Manager Server Dispatch and Lifecycle Handlers

- [x] 3.1 Implement request dispatch handlers for `vm.create`, `vm.start`, `vm.stop`, and `vm.remove` in `vmsan-manager/src/server.ts` with structured logging for lifecycle events without logging credential data.
- [x] 3.2 Add comprehensive manager unit and integration tests in `vmsan-manager/test/` covering validation bounds, lifecycle operations, native error translation, and response sanitization.

## 4. Next.js Manager Client

- [x] 4.1 Extend `src/lib/vmsan-manager/client.ts` with typed methods `createVm`, `startVm`, `stopVm`, and `removeVm`, ensuring the Next.js module graph contains no import of `vmsan`.
- [x] 4.2 Add unit tests for Next.js manager client lifecycle methods in `test/` verifying Unix socket serialization, response handling, and typed error propagation.

## 5. Next.js API Routes Migration

- [x] 5.1 Update `POST /api/vms` in `src/app/api/vms/route.ts` to parse request payload, delegate to `managerClient.createVm()`, and return HTTP 201 with created VM presentation model.
- [x] 5.2 Update `POST /api/vms/[id]/start/route.ts` and `POST /api/vms/[id]/stop/route.ts` to validate VM ID and delegate to `managerClient.startVm()` and `managerClient.stopVm()`, returning HTTP 200 with updated VM state.
- [x] 5.3 Update `DELETE /api/vms/[id]/route.ts` to validate VM ID and delegate to `managerClient.removeVm()`, returning HTTP 200 with `{ "removed": true, "id": id }`.
- [x] 5.4 Verify API routes with unit tests, ensuring 501 unavailable stubs are replaced and standard error status codes (400, 404, 409, 500, 502/503) are returned.

## 6. Verification and Reporting

- [x] 6.1 Run full unit test suite and production builds (`npm test`, `npm run build`) for both `vmsan-manager` and the Next.js application.
- [x] 6.2 Execute disposable VM lifecycle integration verification test (`health` → `list` → `create` → `start` → `stop` → `remove`) ensuring existing VMs (`kali`, `ubuntu-desktop`) remain untouched.
- [x] 6.3 Verify manager restart persistence and Next.js client socket reconnection behavior.
- [x] 6.4 Validate OpenSpec compliance with `openspec validate --strict` and generate the final Phase 1B.3 report in `phase-report.md`.
