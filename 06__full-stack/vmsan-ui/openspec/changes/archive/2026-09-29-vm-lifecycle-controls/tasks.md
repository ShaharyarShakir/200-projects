# Tasks

## 1. Browser API Client Extensions

- [x] 1.1 Add `LifecycleActionResponse` and `VMAction` types to `src/lib/api/types.ts` and verify types compile
- [x] 1.2 Implement `startVM`, `stopVM`, and `deleteVM` in `src/lib/api/vms.ts` with `ApiError` handling and verify with unit tests in `src/lib/api/__tests__/vms.test.ts`

## 2. Destructive Action Confirmation Dialog

- [x] 2.1 Create `DeleteVMDialog` in `src/components/vms/delete-vm-dialog.tsx` with accessible confirmation controls and loading state
- [x] 2.2 Add unit tests for `DeleteVMDialog` in `src/components/vms/__tests__/delete-vm-dialog.test.ts` verifying open, cancel, confirm, and loading behaviors

## 3. VM Card Lifecycle Controls and State Management

- [x] 3.1 Update `src/components/vms/vm-card.tsx` with status-aware action buttons (Stop for running, Start for stopped, Refresh for unknown, Delete for all) and inject mockable action props
- [x] 3.2 Implement per-VM in-flight action state (`starting`, `stopping`, `deleting`) and concurrency guards in `src/components/vms/vm-card.tsx` to prevent concurrent operations
- [x] 3.3 Implement localized error alert and retry handling on `src/components/vms/vm-card.tsx` without fabricating VM status
- [x] 3.4 Add comprehensive unit tests in `src/components/vms/__tests__/vm-card.test.tsx` verifying action button visibility, loading states, error presentation, and callback triggers

## 4. Dashboard Integration & Synchronization

- [x] 4.1 Update `src/components/vms/vm-list.tsx` and `src/components/vms/vm-dashboard.tsx` to pass refresh callbacks and lifecycle handlers to `VMCard` components
- [x] 4.2 Update dashboard integration tests in `src/components/vms/__tests__/vm-dashboard.test.tsx` verifying inventory re-fetch on lifecycle success

## 5. Quality Assurance & Verification

- [x] 5.1 Run `pnpm typecheck` to verify strict TypeScript compilation across all modified and new files
- [x] 5.2 Run `pnpm lint` to ensure ESLint rules and formatting conform to codebase standards
- [x] 5.3 Run `pnpm test` to verify that all unit and integration test suites pass
