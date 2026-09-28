# Tasks

## 1. Shared API Helpers & Error Handling

- [x] 1.1 Implement `src/app/api/vms/helpers.ts` containing `handleApiError` for standardized `{ error: { code, message } }` formatting, status code mapping (400, 404, 409, 500, 503), and safe JSON request body parsing, and verify unit tests for error mapping pass.
- [x] 1.2 Refactor `GET /api/vms` in `src/app/api/vms/route.ts` to use `handleApiError` and update existing tests in `src/app/api/vms/__tests__/route.test.ts` to verify standardized error schema compliance.

## 2. MicroVM Creation Endpoint (`POST /api/vms`)

- [x] 2.1 Implement `POST` route handler in `src/app/api/vms/route.ts` that safely parses request JSON, whitelists `{ runtime, vcpus, memoryMiB }`, validates parameters via `validateCreateOptions`, calls `createVM`, and returns a structured response.
- [x] 2.2 Add unit and route tests for `POST /api/vms` in `src/app/api/vms/__tests__/create.test.ts` verifying valid creation, invalid runtimes, invalid vCPUs (< 1 or non-integer), invalid memory (< 128 or non-integer), malformed JSON, and adapter failure handling.

## 3. MicroVM Lifecycle Start & Stop Endpoints

- [x] 3.1 Implement `POST /api/vms/[id]/start` route handler in `src/app/api/vms/[id]/start/route.ts` with VM ID validation and `startVM` adapter invocation returning `{ success: true, vmId }`, and verify route tests in `src/app/api/vms/__tests__/start.test.ts` pass.
- [x] 3.2 Implement `POST /api/vms/[id]/stop` route handler in `src/app/api/vms/[id]/stop/route.ts` with VM ID validation and `stopVM` adapter invocation returning `{ success: true, vmId }`, and verify route tests in `src/app/api/vms/__tests__/stop.test.ts` pass.

## 4. MicroVM Deletion Endpoint (`DELETE /api/vms/[id]`)

- [x] 4.1 Implement `DELETE /api/vms/[id]` route handler in `src/app/api/vms/[id]/route.ts` with VM ID validation and `removeVM` adapter invocation returning `{ success: true, vmId }`, and verify route tests in `src/app/api/vms/__tests__/remove.test.ts` pass.

## 5. Security Testing & Verification

- [x] 5.1 Add comprehensive security tests verifying that command injection payloads in `:id` (e.g. `vm-123;whoami`, `vm-123 && whoami`, `vm-123 | whoami`, `$(whoami)`, `../../etc/passwd`) and arbitrary fields in POST payloads (e.g. `command: "rm -rf /"`) are rejected or sanitized without reaching the process adapter.
- [x] 5.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` to verify that all lint rules pass, TypeScript compiles cleanly with zero errors, and all route test suites succeed.
