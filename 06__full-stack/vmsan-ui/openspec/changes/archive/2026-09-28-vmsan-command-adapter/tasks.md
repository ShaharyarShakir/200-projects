# Tasks

## 1. Type Definitions and Error Models

- [x] 1.1 Create `src/lib/vmsan/types.ts` defining normalized data models (`VMStatus`, `VM`), creation parameters (`CreateVMOptions`), execution configurations (`RunVmsanOptions`), and command results (`CommandResult`).
- [x] 1.2 Create `src/lib/vmsan/errors.ts` implementing `VmsanError` (with `command`, `args`, `exitCode`, `stdout`, `stderr`) and `VmsanValidationError`.

## 2. CLI Parser and Process Execution

- [x] 2.1 Create `src/lib/vmsan/parser.ts` with `parseVmList` to parse `vmsan --json list` JSON output and normalize VM records with safe fallbacks.
- [x] 2.2 Create `src/lib/vmsan/client.ts` implementing input validators (`validateVmId`, `validateCreateOptions`) and process runner `runVmsan` via `child_process.spawn` using argument arrays, timeouts, and sanitized environment.
- [x] 2.3 Implement lifecycle functions (`listVMs`, `createVM`, `startVM`, `stopVM`, `removeVM`) in `src/lib/vmsan/client.ts`.

## 3. Next.js API Route Integration

- [x] 3.1 Create `src/app/api/vms/route.ts` implementing `GET /api/vms` handler that calls `listVMs()`, returns `{ vms: VM[] }`, and handles errors cleanly with HTTP status codes.

## 4. Test Suite and Verification

- [x] 4.1 Add unit tests for input validation (valid/invalid VM IDs, runtime whitelisting, vCPU and memory limits).
- [x] 4.2 Add unit tests for output parsing (valid JSON VM list, empty list, malformed output).
- [x] 4.3 Add unit tests for command construction and error handling with mocked process runner.
- [x] 4.4 Add unit tests for `GET /api/vms` route handler.
- [x] 4.5 Add `typecheck` and `test` scripts to `package.json` and verify `pnpm run typecheck` and `pnpm test` pass cleanly.
