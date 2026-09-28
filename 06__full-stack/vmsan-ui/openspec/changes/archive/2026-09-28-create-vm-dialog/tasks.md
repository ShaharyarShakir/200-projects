# Tasks

## 1. Client API Layer & Types

- [x] 1.1 Add `CreateVMRequest` and `CreateVMResponse` type definitions to `src/lib/api/types.ts` and verify types compile with `pnpm typecheck`
- [x] 1.2 Implement `createVM(options, fetchFn)` in `src/lib/api/vms.ts` with JSON headers, request payload serialization, and `ApiError` mapping
- [x] 1.3 Add unit tests for `createVM` in `src/lib/api/__tests__/vms.test.ts` covering successful creation, 400 invalid request, 503 unavailable, non-JSON errors, and network errors, and verify with `pnpm test`

## 2. Create VM Dialog Component & Form Validation

- [x] 2.1 Create `CreateVMDialog` in `src/components/vms/create-vm-dialog.tsx` with shadcn Dialog, Select for runtime (`base`, `node22`, `node24`, `python3.13`), numeric inputs for vCPUs (integer >= 1) and Memory (integer >= 128 MiB), and Cancel/Create buttons
- [x] 2.2 Implement client-side validation, inline error messaging, loading state (`Creating...` with disabled buttons), safe error alert presentation on failure, form reset, and `onSuccess` callback execution
- [x] 2.3 Add component unit tests in `src/components/vms/__tests__/create-vm-dialog.test.ts` verifying markup rendering, default values, form validation behavior, submission lifecycle, and accessibility attributes with `pnpm test`

## 3. Dashboard Integration

- [x] 3.1 Update `src/components/vms/vm-dashboard.tsx` header to render `CreateVMDialog` alongside the Refresh button and connect `handleRefresh` as the post-creation callback
- [x] 3.2 Update dashboard component tests in `src/components/vms/__tests__/vm-dashboard.test.ts` and integration tests in `src/components/vms/__tests__/dashboard-integration.test.ts` to assert the Create VM button presence and workflow

## 4. Verification & Real Environment Testing

- [x] 4.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` to verify linting, type safety, and all unit/integration tests pass
- [x] 4.2 Verify manual creation against `http://localhost:3000` with a test VM (`runtime: base`, `vcpus: 1`, `memoryMiB: 128`), confirm presence in `vmsan list` and dashboard UI, and clean up the test VM
