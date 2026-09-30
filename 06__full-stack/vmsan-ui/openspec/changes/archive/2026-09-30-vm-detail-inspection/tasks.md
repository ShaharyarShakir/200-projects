# Tasks

## 1. Domain Service & API Route

- [x] 1.1 Implement `getVm(id: unknown): Promise<Vm>` in `src/lib/vms/vm-service.ts` with parameter validation, manager list querying, presentation mapping, and `VmNotFoundError` handling, and verify with unit tests in `src/lib/vms/__tests__/vm-service.test.ts`.
- [x] 1.2 Implement `GET` handler in `src/app/api/vms/[id]/route.ts` returning `{ vm: Vm }` with status 200, error mapping (400, 404, 503), and verify with route unit tests in `src/app/api/vms/[id]/__tests__/route.test.ts`.
- [x] 1.3 Add `getVM(id: string, fetchFn?: typeof fetch): Promise<ClientVM>` client API helper in `src/lib/api/vms.ts` with error handling and verify with unit tests in `src/lib/api/__tests__/vms.test.ts`.

## 2. Formatting, Status Badges & Support Components

- [x] 2.1 Update `VmStatusBadge` in `src/components/vms/vm-status-badge.tsx` to support all domain statuses (`running`, `stopped`, `starting`, `stopping`, `creating`, `error`, `unknown`) with appropriate badges and aria labels, and verify with unit tests.
- [x] 2.2 Add or verify formatting utilities in `src/lib/utils/formatters.ts` for disk size, dates, and null-safe value display, and verify with unit tests.

## 3. VM Detail View Components

- [x] 3.1 Create `VmOverviewCard` in `src/components/vms/vm-overview-card.tsx` rendering VM ID, copy-to-clipboard button with visual feedback, status badge, runtime, and primary actions.
- [x] 3.2 Create `VmResourcesCard` in `src/components/vms/vm-resources-card.tsx` and `VmNetworkCard` in `src/components/vms/vm-network-card.tsx` with null-safe displays for vCPUs, memory, disk, network policy, IP address, and published ports.
- [x] 3.3 Create `VmMetadataCard` in `src/components/vms/vm-metadata-card.tsx` rendering creation timestamp, calculated age, and runtime environment.
- [x] 3.4 Create `VmDetailSkeleton`, `VmNotFound`, and `VmDetailError` state components in `src/components/vms/` for initial loading, 404 recovery, and error retry states.
- [x] 3.5 Create `VmDetailView` container in `src/components/vms/vm-detail-view.tsx` integrating data fetching, manual refresh, lifecycle actions (Start, Stop, Delete with confirmation), error handling, and navigation.

## 4. Route Page & Dashboard Link Integration

- [x] 4.1 Create `/vms/[id]` route page in `src/app/vms/[id]/page.tsx` rendering the detail view and back navigation header.
- [x] 4.2 Update `VmCard` in `src/components/vms/vm-card.tsx` with a "View Details" link and clickable identifier leading to `/vms/[id]` without triggering lifecycle actions, and verify with dashboard card tests.
- [x] 4.3 Add component test suite for `VmDetailView` in `src/components/vms/__tests__/vm-detail-view.test.tsx` verifying loading, 404, error recovery, data presentation, and lifecycle action dispatching.

## 5. System Verification

- [x] 5.1 Run test suite (`npm test`) and Next.js build validation (`npm run build`) to ensure all unit, security, and integration tests pass without regressions.
