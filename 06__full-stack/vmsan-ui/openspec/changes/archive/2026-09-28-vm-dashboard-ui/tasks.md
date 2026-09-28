# Tasks: Phase 1D — vmsan Dashboard UI

## 1. Client API Layer & Utility Formatters

- [x] 1.1 Create `src/lib/api/types.ts` defining client-safe VM interfaces, status types, and API response contracts without importing server modules. Verify with `pnpm typecheck`.
- [x] 1.2 Implement `src/lib/utils/formatters.ts` providing null-safe formatting functions (`formatValue`, `formatMemory`, `formatVmCount`) that replace null/undefined/missing/NaN with `—`. Verify with unit tests in `src/lib/utils/__tests__/formatters.test.ts`.
- [x] 1.3 Implement `src/lib/api/vms.ts` exposing `getVMs()` to fetch microVMs from `GET /api/vms` with standardized error parsing. Verify with unit tests in `src/lib/api/__tests__/vms.test.ts`.

## 2. UI Components

- [x] 2.1 Implement `src/components/vms/vm-status-badge.tsx` rendering accessible status badges ("running" -> Running, "stopped" -> Stopped, "unknown" -> Unknown) using badge styling and dot indicators. Verify with unit tests.
- [x] 2.2 Implement `src/components/vms/vm-card.tsx` rendering VM details (ID, status badge, runtime, vCPUs, memory, age) using shadcn Card and null-safe formatters. Verify with unit tests.
- [x] 2.3 Implement `src/components/vms/vm-empty-state.tsx` displaying a friendly message when no microVMs exist in the system. Verify component output with tests.
- [x] 2.4 Implement `src/components/vms/vm-error-state.tsx` displaying user-safe error messages with an interactive Retry button. Verify retry handler with unit tests.
- [x] 2.5 Implement `src/components/vms/vm-list.tsx` and loading skeletons supporting responsive desktop/tablet/mobile grid layout. Verify rendering with unit tests.

## 3. Dashboard Integration & Page Assembly

- [x] 3.1 Implement `src/components/vms/vm-dashboard.tsx` coordinating state (loading, refreshing, error, data), header with total VM count, and manual refresh controls. Verify interaction flows with tests.
- [x] 3.2 Update `src/app/page.tsx` to mount the `VMDashboard` component. Verify with `pnpm typecheck`.

## 4. Comprehensive Testing & Validation

- [x] 4.1 Implement test suite verifying: VM list rendering, running/stopped/unknown status labels, correct VM count formatting, empty state, error state, retry trigger, refresh trigger, and null/missing value formatting. Verify all tests pass with `pnpm test`.
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` to ensure full project compliance.
