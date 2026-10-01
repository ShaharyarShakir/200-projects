# Tasks: Interactive Terminal (Phase 2B)

## 1. Manager Protocol & Guest Execution (`vmsan-manager`)

- [x] 1.1 Add `vm.exec` method, `VmExecParams`, `VmExecResult`, and `validateVmExecParams` to `vmsan-manager/src/protocol.ts` and verify protocol validation tests pass
- [x] 1.2 Implement `execVm` helper in `vmsan-manager/src/vmsan.ts` using `AgentClient` from `vmsan` with status checking (`running`), parameter bounding, and sanitized result projection, verifying unit tests
- [x] 1.3 Wire `vm.exec` request dispatch into `vmsan-manager/src/server.ts` and verify end-to-end socket RPC dispatch tests

## 2. Web Application Client & Service Layer (`src/lib/`)

- [x] 2.1 Synchronize protocol definitions in `src/lib/vmsan-manager/protocol.ts` and add `execVm` method to `src/lib/vmsan-manager/client.ts`, verifying client tests
- [x] 2.2 Add `execVm` domain method with parameter validation and error mapping in `src/lib/vms/vm-service.ts`, verifying domain service tests
- [x] 2.3 Add API request/response contracts in `src/lib/api/types.ts` and `executeVmCommand` in `src/lib/api/vms.ts`, verifying API client tests

## 3. REST API Endpoint (`src/app/api/`)

- [x] 3.1 Implement route handler `POST /api/vms/:id/terminal` in `src/app/api/vms/[id]/terminal/route.ts` with validation and HTTP status code mappings (200, 400, 404, 409, 502, 503), verifying API route tests

## 4. Interactive Terminal UI Component (`src/components/vms/`)

- [x] 4.1 Implement `VmTerminal` component in `src/components/vms/vm-terminal.tsx` featuring visual prompt (`$`), stdout/stderr separation, execution state indicators, output clearing, and keyboard-navigable in-memory command history (Up/Down arrow keys), verifying unit tests
- [x] 4.2 Embed `VmTerminal` inside `src/components/vms/vm-detail-view.tsx` with dynamic state gating based on VM operational status (`running`), verifying detail view integration tests

## 5. Verification & Quality Assurance

- [x] 5.1 Run all TypeScript type checks, ESLint linting, and automated test suites across both `vmsan-manager` and Next.js applications to verify complete system integrity and host isolation compliance
