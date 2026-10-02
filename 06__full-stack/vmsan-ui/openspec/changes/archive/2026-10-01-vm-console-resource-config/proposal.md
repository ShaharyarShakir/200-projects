# Proposal

## Why

The current microVM detail view stacks lifecycle controls, terminal execution, and filesystem exploration directly into a single crowded page, resembling an early developer prototype rather than a production-grade infrastructure management console. As VM management capabilities expand (storage allocation, networking controls, filesystems, snapshots, and host settings), a unified infrastructure console architecture with a persistent navigation sidebar and dedicated sub-routes is required.

Additionally, VM creation currently defaults to a fixed 1 GB disk without user control, and administrative command execution inside guest microVMs lacks a dedicated sudo-capable path through the privileged manager's `AgentClient` boundary without asking users for unshared guest credentials.

## What Changes

- **VM Console Information Architecture**: Refactor the VM detail route (`/vms/[id]`) into a dedicated VM Management Console featuring a persistent sidebar and route-based navigation across `Overview` (`/vms/[id]`), `Terminal` (`/vms/[id]/terminal`), `Storage` (`/vms/[id]/storage`), `Networking` (`/vms/[id]/networking`), `Files` (`/vms/[id]/files`), `Snapshots` (`/vms/[id]/snapshots`), and `Settings` (`/vms/[id]/settings`).
- **Terminal Route & Sudo Execution**: Move the interactive terminal out of the Overview page into `/vms/[id]/terminal` where it occupies the primary content viewport. Support administrative command execution using a `sudo: boolean` parameter routed through `vmsan-manager`'s privileged `AgentClient` execution boundary without collecting or requiring guest sudo passwords.
- **Dedicated Section Views & Placeholders**: Provide a dedicated `Storage` view displaying allocated disk resources (10 GB default), a dedicated `Files` view housing the filesystem explorer, an informational `Networking` view displaying policy and address summaries, a `Settings` view for metadata inspection, and honest placeholders for future capabilities (`Snapshots` and interactive `Networking` controls).
- **First-Class Storage Configuration on VM Creation**: Update the VM creation dialog to expose a user-selectable storage input defaulting to `10 GB` (allowed range `1–20 GB`), and update client/server validation to strictly enforce these limits (`1–20 GB`).
- **Infrastructure-Oriented Dashboard Cards**: Redesign VM dashboard cards with compact resource metrics (vCPUs, Memory, Storage, Runtime) and an explicit "Open Console" action navigating to `/vms/[id]`.
- **Privileged Manager RPC & API Updates**: Extend `vm.exec` in `vmsan-manager` and `/api/vms/[id]/terminal` to accept `sudo?: boolean` and forward it safely to `AgentClient.runCommand()`.

## Capabilities

### New Capabilities
<!-- None: all changes modify existing capability specifications -->

### Modified Capabilities
- `vm-detail`: Restructure `/vms/[id]` into a persistent sidebar console layout with dedicated nested routes (`overview`, `terminal`, `storage`, `networking`, `files`, `snapshots`, `settings`), relocating the terminal and filesystem components to their respective routes and providing clear placeholders for future sections.
- `vm-terminal`: Update terminal execution to support administrative command execution (`sudo: boolean`) via the backend manager without prompting for or storing guest passwords, and support full-viewport rendering on the dedicated `/vms/[id]/terminal` route.
- `vm-dashboard`: Update VM creation dialog to expose user-configurable storage selection defaulting to 10 GB (1–20 GB range) and update VM card presentation to display storage allocation alongside an "Open Console" entry point.
- `vm-api`: Update VM creation endpoint (`POST /api/vms`) to validate `diskSizeGb` between 1 and 20 GB, and update command execution endpoint (`POST /api/vms/:id/terminal`) to accept and validate optional `sudo: boolean` execution flag.
- `vmsan-manager`: Update `vm.exec` protocol validation and RPC handler to support optional `sudo: boolean` dispatch via `AgentClient.runCommand()` without exposing root passwords or executing host-level sudo commands from Next.js.

## Impact

- **Frontend Routes & Components**:
  - Add nested route structure under `src/app/vms/[id]/` (`layout.tsx`, `page.tsx`, `terminal/page.tsx`, `storage/page.tsx`, `networking/page.tsx`, `files/page.tsx`, `snapshots/page.tsx`, `settings/page.tsx`).
  - Create new console navigation components (`vm-console-sidebar.tsx`, `vm-console-header.tsx`, `vm-overview.tsx`, `vm-storage.tsx`, `vm-networking.tsx`, `vm-settings.tsx`).
  - Refactor `create-vm-dialog.tsx`, `vm-card.tsx`, `vm-terminal.tsx`, and `vm-detail-view.tsx`.
- **Backend & API Layer**:
  - Update `src/lib/api/types.ts` and `src/lib/vms/types.ts` for `ExecuteVmCommandRequest`, `ExecVmInput`, and `CreateVmInput`.
  - Update validation in `src/lib/vms/validation.ts` (`diskSizeGb` [1, 20], `sudo` boolean).
  - Update `src/lib/vms/vm-service.ts` and `src/app/api/vms/[id]/terminal/route.ts`.
- **Manager Service (`vmsan-manager`)**:
  - Update `vmsan-manager/src/protocol.ts` and `src/lib/vmsan-manager/protocol.ts` for `VmExecParams` validation.
  - Update `vmsan-manager/src/vmsan.ts` `execVm` to pass `sudo` to `client.runCommand`.
- **Security & Privilege Boundary**:
  - Preserves strict privilege isolation: Next.js remains unprivileged and never invokes host `sudo`. Sudo execution inside microVMs is mediated by the privileged manager daemon via `AgentClient`.
- **Compatibility**:
  - Fully backward compatible with existing VMs (existing disks are untouched).
