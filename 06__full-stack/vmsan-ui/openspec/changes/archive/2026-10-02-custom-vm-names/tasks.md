# Tasks

## 1. Metadata Layer & Validation (`src/lib/vm-metadata/`)

- [x] 1.1 Implement metadata types and store schema in `src/lib/vm-metadata/types.ts` and verify with `pnpm typecheck`
- [x] 1.2 Implement custom name validation, reserved `vm-` prefix check, and case-insensitive normalization in `src/lib/vm-metadata/validation.ts` and verify with unit tests in `src/lib/vm-metadata/__tests__/validation.test.ts`
- [x] 1.3 Implement atomic file persistence (`.vmsan-ui/vms.json`), in-process mutex/queue, and CRUD query methods in `src/lib/vm-metadata/store.ts` and verify with persistence tests in `src/lib/vm-metadata/__tests__/store.test.ts`

## 2. API Contracts & Route Updates

- [ ] 2.1 Update shared client and API VM types in `src/lib/api/types.ts` and `src/app/api/vms/helpers.ts` to include explicit `name` and `vmsanId` fields and verify with `pnpm typecheck`
- [ ] 2.2 Update `GET /api/vms` in `src/app/api/vms/route.ts` to merge live vmsan inventory with custom name metadata (defaulting missing metadata to `vmsanId`) and verify with tests in `src/app/api/vms/__tests__/route.test.ts`
- [ ] 2.3 Update `POST /api/vms` in `src/app/api/vms/route.ts` to validate custom name, reject case-insensitive conflicts with HTTP 409 `VM_NAME_ALREADY_EXISTS`, invoke vmsan create, and persist metadata on success, verifying with tests in `src/app/api/vms/__tests__/create.test.ts`
- [ ] 2.4 Update `DELETE /api/vms/[id]` in `src/app/api/vms/[id]/route.ts` to enforce the deletion orchestration sequence (`vmsan remove` first; delete metadata on success; preserve metadata on failure) and verify with tests in `src/app/api/vms/__tests__/remove.test.ts`
- [ ] 2.5 Ensure lifecycle routes (`start`, `stop`) in `src/app/api/vms/[id]/` strictly route via validated `vmsanId` and verify with tests in `src/app/api/vms/__tests__/start.test.ts` and `src/app/api/vms/__tests__/stop.test.ts`

## 3. UI Components & Dashboard Integration

- [ ] 3.1 Update `VMCard` in `src/components/vms/vm-card.tsx` to render the custom name as the primary title with `vmsanId` as secondary detail (`VM ID: <vmsanId>`) and verify with tests in `src/components/vms/__tests__/vm-card.test.ts`
- [ ] 3.2 Update `CreateVMDialog` in `src/components/vms/create-vm-dialog.tsx` with a `Name` input field, client-side validation for naming rules and reserved prefixes, and error handling for 409 name conflicts, verifying with tests in `src/components/vms/__tests__/create-vm-dialog.test.ts`
- [ ] 3.3 Update `VMDashboard` and `VMList` in `src/components/vms/` to pass and display the updated VM resource model and verify with tests in `src/components/vms/__tests__/vm-dashboard.test.ts`

## 4. Verification & Quality Gates

- [ ] 4.1 Run full TypeScript type checking and linting to ensure zero type errors and clean lint status (`pnpm typecheck && pnpm lint`)
- [ ] 4.2 Run the complete test suite (`pnpm test`) across all metadata, API, security, and UI test suites to verify end-to-end correctness
