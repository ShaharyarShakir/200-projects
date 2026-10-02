# Tasks

## 1. Manager Protocol and Sudo Execution Boundary

- [x] 1.1 Update `vmsan-manager/src/protocol.ts` and `src/lib/vmsan-manager/protocol.ts` to include `sudo?: boolean` in `VmExecParams` and validate that `sudo`, if provided, is a strict boolean; verify via protocol unit tests.
- [x] 1.2 Update `vmsan-manager/src/vmsan.ts` to pass `sudo: params.sudo` to `AgentClient.runCommand()` in `execVm()`, maintaining strict host isolation with no host-level `sudo` execution; verify via `vmsan-manager/src/__tests__/vmsan.test.ts`.
- [x] 1.3 Update `vmsan-manager/src/server.ts` and verify manager RPC integration tests in `vmsan-manager/src/__tests__/server.test.ts` and `vmsan-manager/src/__tests__/protocol.test.ts`.

## 2. Web API Validation and VM Service Layer

- [x] 2.1 Update `src/lib/vms/types.ts` to include `sudo?: boolean` in `VmExecRequest` and `diskSizeGb?: number` in `CreateVMRequest`; verify type checking with `npx tsc --noEmit`.
- [x] 2.2 Update `src/lib/vms/validation.ts` to enforce `diskSizeGb` integer range `[1, 20]` (updating `RESOURCE_LIMITS.diskSizeGb` max to 20) in `validateCreateVmInput` and validate `sudo?: boolean` in `validateVmExecInput`; verify via `src/lib/vms/__tests__/validation.test.ts`.
- [x] 2.3 Update `src/lib/vms/vm-service.ts` to forward `sudo` in `execVm()` and `diskSizeGb` in `createVM()`; verify via `src/lib/vms/__tests__/vm-service.test.ts`.
- [x] 2.4 Update `src/app/api/vms/[id]/terminal/route.ts` and `src/app/api/vms/route.ts` to handle `sudo` and `diskSizeGb` parameters respectively; verify via API endpoint tests.

## 3. Storage Provisioning and Dashboard Card Redesign

- [x] 3.1 Update `src/components/vms/create-vm-dialog.tsx` to add a Storage (GB) input defaulting to 10 GB with range `[1, 20]`, helper text, and client validation; verify with component tests.
- [x] 3.2 Update `src/components/vms/vm-card.tsx` to render storage allocation (e.g. "10 GB"), compact resource badges, and an "Open Console" button navigating to `/vms/[id]`; verify with component tests.

## 4. Console Shell and Persistent Navigation

- [x] 4.1 Create `src/components/vms/vm-console-sidebar.tsx` with navigation links (`Overview`, `Terminal`, `Storage`, `Networking`, `Files`, `Snapshots`, `Settings`), matching Lucide icons, and active route detection using `usePathname()`; verify component rendering tests.
- [x] 4.2 Create `src/components/vms/vm-console-header.tsx` with VM title, status badge, runtime, back navigation, refresh trigger, and lifecycle action controls; verify component rendering tests.
- [x] 4.3 Implement `src/app/vms/[id]/layout.tsx` providing persistent console header and sidebar shell with shared VM context across sub-routes; verify layout tests.

## 5. Console Sub-Routes and Views

- [x] 5.1 Implement `src/components/vms/vm-overview.tsx` and update `src/app/vms/[id]/page.tsx` displaying VM identity, compute resources, minimal network summary, and lifecycle controls; verify overview rendering tests.
- [x] 5.2 Update `src/components/vms/vm-terminal.tsx` and create `src/app/vms/[id]/terminal/page.tsx` featuring full viewport terminal presentation, administrative sudo execution toggle/mode, distinct stdout/stderr rendering, and output clear action; verify terminal tests.
- [x] 5.3 Implement `src/components/vms/vm-storage.tsx` and create `src/app/vms/[id]/storage/page.tsx` displaying allocated storage (10 GB) and honest unavailable usage note; verify storage view tests.
- [x] 5.4 Implement `src/components/vms/vm-networking.tsx` and create `src/app/vms/[id]/networking/page.tsx` displaying network policy summary and honest placeholder for future controls; verify networking view tests.
- [x] 5.5 Create `src/app/vms/[id]/files/page.tsx` hosting `VmFileBrowser` within the console layout; verify files sub-route tests.
- [x] 5.6 Implement `src/components/vms/vm-snapshots.tsx` and create `src/app/vms/[id]/snapshots/page.tsx` displaying an honest placeholder explaining snapshots will be available in a future phase; verify snapshots view tests.
- [x] 5.7 Implement `src/components/vms/vm-settings.tsx` and create `src/app/vms/[id]/settings/page.tsx` displaying VM configuration and settings details; verify settings view tests.

## 6. Verification and Integration Testing

- [x] 6.1 Run test suites across `vmsan-manager` (`npm --prefix vmsan-manager test`) and Next.js frontend (`npm test`) to ensure full test coverage and no regressions.
- [x] 6.2 Run Next.js production build (`npm run build`) and type checks (`npx tsc --noEmit`) to verify all route and component contracts.
