# Design: VM Console & Resource Configuration

## Context

The current microVM interface places the interactive terminal and filesystem explorer directly on the VM detail page (`/vms/[id]`), creating a crowded layout that does not scale as more infrastructure management features are added. VM creation hardcodes disk sizes to 1 GB rather than exposing storage provisioning to operators, and administrative commands require manual workarounds because the user is not given a guest root password.

See `proposal.md` for the motivation and `specs/` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Transform `/vms/[id]` into a persistent-sidebar VM Management Console with clean route-based navigation.
- Relocate the terminal to `/vms/[id]/terminal` occupying the primary main viewport.
- Relocate the filesystem explorer to `/vms/[id]/files`.
- Provide dedicated routes and components for `Storage` (`/vms/[id]/storage`), `Networking` (`/vms/[id]/networking`), `Snapshots` (`/vms/[id]/snapshots`), and `Settings` (`/vms/[id]/settings`).
- Provide honest, non-functional placeholders for future sections (`Snapshots` and interactive `Networking`).
- Expose user-configurable storage allocation in the VM creation dialog with a 10 GB default and 1–20 GB validation range.
- Support administrative guest execution (`sudo: boolean`) through `vmsan-manager`'s `AgentClient` without requesting guest passwords or running host `sudo` from Next.js.
- Refactor the dashboard VM card to an infrastructure control-plane layout featuring compute/storage metrics and an "Open Console" action.

**Non-Goals:**
- Real-time disk usage introspection (e.g. `df -h` parsing) inside the storage view (manager does not expose filesystem telemetry yet; display "Usage information unavailable").
- Dynamic live disk resizing (future phase).
- Snapshot creation or restoration (reserved for Phase 2D).
- Interactive network policy or port mapping configuration (reserved for future networking phase).
- Adding heavy client-side routing or state-management frameworks (standard Next.js App Router and React state only).

## Decisions

### 1. Nested Route and Persistent Layout Architecture

**Choice**: Use Next.js App Router layout hierarchy under `src/app/vms/[id]/` with `layout.tsx` providing the persistent shell (sidebar + header) and sub-routes providing main content.

```text
src/app/vms/[id]/
├── layout.tsx         # Console shell: header with VM status/actions + persistent sidebar
├── page.tsx           # Default route: Overview
├── terminal/page.tsx  # Terminal sub-route
├── storage/page.tsx   # Storage sub-route
├── networking/page.tsx# Networking sub-route
├── files/page.tsx     # Files sub-route
├── snapshots/page.tsx # Snapshots placeholder
└── settings/page.tsx  # Settings sub-route
```

**Rationale**:
- Next.js layout persistence prevents sidebar and header re-rendering when navigating between sections.
- URLs are clean, bookmarkable, and match standard cloud control plane patterns (AWS EC2, DigitalOcean, Incus).
- Isolates complex components (like `VmTerminal` and `VmFileBrowser`) to their own pages, reducing unnecessary re-renders.

**Alternatives Considered**:
- *Single-page tabbed component*: Rejected because it balloons bundle and render complexity on one route and prevents direct deep-linking to sub-sections.

### 2. VM Console Sidebar and Header Components

**Choice**: Build `VmConsoleSidebar` and `VmConsoleHeader` using Tailwind and Lucide icons.

Navigation Mapping:
- Overview (`/vms/[id]`) → `LayoutDashboard`
- Terminal (`/vms/[id]/terminal`) → `Terminal`
- Storage (`/vms/[id]/storage`) → `HardDrive`
- Networking (`/vms/[id]/networking`) → `Network`
- Files (`/vms/[id]/files`) → `Folder`
- Snapshots (`/vms/[id]/snapshots`) → `Camera`
- Settings (`/vms/[id]/settings`) → `Settings`

Active route detection uses `usePathname()`. On mobile viewports, the sidebar collapses into a top navigation bar or drawer without breaking desktop density.

### 3. Manager Sudo Execution Boundary

**Choice**: Extend the existing `vm.exec` RPC method in `vmsan-manager` to accept `sudo?: boolean` in `VmExecParams`, forwarding `sudo` to `AgentClient.runCommand({ cmd: "sh", args: ["-c", params.command], sudo: params.sudo })`.

```text
HOST
├── Next.js (Unprivileged)
│     POST /api/vms/:id/terminal { "command": "...", "sudo": true }
│     ↓ (Unix domain socket RPC: vm.exec)
└── vmsan-manager (Privileged)
      ↓ (Internal HTTP AgentClient)
      MicroVM Guest Agent (Root-capable execution)
      ↓
      Executes command inside microVM
```

**Rationale**:
- Next.js never executes `sudo` on the host.
- The user is never prompted for a VM root password that they do not know.
- The manager already owns the privileged execution boundary and can safely invoke root-capable execution via `AgentClient`.

**Alternatives Considered**:
- *Prompting user for guest password*: Rejected because the VM is a disposable sandbox and the user does not know the internal sudo password.
- *Host sudo from Next.js*: Rejected because Next.js must remain completely unprivileged.

### 4. Storage Configuration on VM Creation

**Choice**: Update `CreateVMDialog` and API endpoints:
- Expose a numeric `Storage (GB)` input with default value `10` and helper text "Minimum 1 GB, Maximum 20 GB".
- Update `CreateVMRequest` type to include `diskSizeGb?: number`.
- Client and server validation strictly enforce integer values in the range `[1, 20]`.
- Update `validateCreateVmInput` (`src/lib/vms/validation.ts`) to validate `RESOURCE_LIMITS.diskSizeGb` between 1 and 20.
- `vmsan-manager` protocol already enforces `diskSizeGb` in `[1, 20]`.

**Alternatives Considered**:
- *Complicated storage volume provisioning widget*: Rejected in favor of a straightforward integer input in GB.

### 5. Infrastructure-Oriented Dashboard Card

**Choice**: Update `VMCard` (`src/components/vms/vm-card.tsx`):
- Display vCPU, Memory, Storage (e.g. `10 GB`), and Runtime in a compact grid.
- Provide a prominent "Open Console" primary link to `/vms/[id]`.
- Keep contextual lifecycle actions (Start, Stop, Delete) accessible on the card footer.

## Risks / Trade-offs

- **[Risk] State Synchronization across Nested Console Routes**: When navigating between `/vms/[id]` and sub-routes, VM state (e.g. running vs stopped) needs to stay synchronized.
  - *Mitigation*: Provide a lightweight React Context (`VmConsoleContext`) in `layout.tsx` or shared fetch hooks so sub-routes access the cached VM state, status, and lifecycle handlers with a single source of truth and manual refresh trigger.
- **[Risk] Sudo Execution Misinterpretation**: Users might type `sudo apt install` directly into the terminal.
  - *Mitigation*: The terminal UI provides a clear "Run as Sudo" or administrative execution toggle/indicator, and backend `sudo: true` executes the command directly with root privileges in the guest.
- **[Risk] Existing VM Disk Size Compatibility**: Existing VMs may have null or legacy disk sizes.
  - *Mitigation*: Null-safe formatters (`formatDiskSize`) handle undefined or legacy values with `—` fallback, ensuring existing VMs remain functional and unaffected.
