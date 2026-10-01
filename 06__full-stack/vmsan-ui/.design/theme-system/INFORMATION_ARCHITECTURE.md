# Information Architecture: vmsan Hypervisor UI

## Site Map

- Dashboard `/`
  - Top Navigation Bar (Brand Identity, Active VM summary counter, Global Actions, Theme Switcher)
  - VM Fleet Grid / List View
    - MicroVM Resource Card `[Card: vm.id]`
      - Quick Status Diode & Badge
      - Specs Snapshot (vCPUs, Memory, Runtime, Age)
      - Direct Lifecycle Controls (Start / Stop / Delete / Refresh)
      - Deep-link to Detail View `/vms/[id]`
  - Global Create VM Modal `[Dialog]`
- MicroVM Inspection & Console `/vms/[id]`
  - Breadcrumb Header (`← Virtual Machines` + Live Refresh + Theme Switcher)
  - Master Lifecycle & Status Bar (`VmOverviewCard`)
  - Real-time Interactive Terminal Console (`VmTerminal`)
  - Technical Specifications Grid:
    - Compute & Memory Allocation (`VmResourcesCard`)
    - Network Interfaces & IP routing (`VmNetworkCard`)
  - Metadata, Kernel & Socket Details (`VmMetadataCard`)

## Navigation Model

- **Primary Navigation**: 
  - Brand Logo + Title (`vmsan` with Firecracker engine moniker).
  - Breadcrumb trail (`/` ↔ `/vms/[id]`) for single-click fleet return.
- **Utility Navigation**:
  - Global Theme Toggle (Sun ☀️ / Moon 🌙 / Monitor 💻) anchored in the top-right header across all views.
  - Global Action Triggers (`+ New VM` modal trigger, `Refresh` sync button).
- **Contextual Actions**:
  - Card-level and detail-level action groups (Start, Stop, Delete with confirmation dialog).
- **Mobile Navigation**:
  - Compact header with icon-only action triggers and responsive single-column layout flow.

## Content Hierarchy

### 1. Dashboard View (`/`)
1. **Application Context & System Health**: Top header with microVM count indicator and global actions.
2. **Alert & Network Banner (Conditional)**: Visual error banner if socket connection or API daemon drops.
3. **VM Fleet Grid**: High-density cards prioritizing ID, Status Diode, and core metrics (vCPU, RAM, Runtime, Age).
4. **Quick Lifecycle Footers**: Instant Start/Stop/Delete actions per VM.

### 2. VM Detail Inspection View (`/vms/[id]`)
1. **Overview & Lifecycle Deck**: VM ID in high-contrast monospace font, dynamic LED status diode, uptime, and primary power buttons.
2. **Interactive Terminal Console**: Full-width monospace terminal canvas with instant command prompt and execution stream.
3. **Resource & Network Telemetry Grid**: Side-by-side spec cards detailing CPU architecture, allocated RAM, CID, IP address, and MAC interface.
4. **Environment & Metadata Sheet**: Kernel image path, rootfs source, socket paths, and creation timestamps.

## User Flows

### Flow 1: Theme Selection & Zero-Flash Persistence
1. User clicks the Theme Toggle in the top navigation bar.
2. A dropdown presents: `Light`, `Dark`, `System`.
3. User selects their preference (e.g., `Dark`).
4. `ThemeProvider`:
   - Instantly applies `.dark` class to `document.documentElement` without page reload or CSS transition flashes.
   - Writes preference to `localStorage.setItem('theme', 'dark')`.
5. On next visit or page refresh, inline initialization script reads `localStorage` before paint, preventing white flash of unstyled content (FOUC).

### Flow 2: MicroVM Fleet Management & Health Inspection
1. User lands on `/`.
2. Inspects VM cards arranged in a responsive grid. Running VMs pulse with emerald LED diodes; stopped VMs show muted zinc badges.
3. User clicks on a VM ID or "View Details".
4. Navigates to `/vms/[id]`.
5. Reviews hardware specs, issues commands in `VmTerminal`, or executes lifecycle transitions (Start/Stop).

## Naming Conventions

| Concept | Label in UI | Notes |
|---------|-------------|-------|
| MicroVM Instance | `Virtual Machine` / `VM` | Standard hypervisor nomenclature |
| Active execution state | `Running` / `Stopped` / `Starting` / `Stopping` / `Error` | Distinct jewel-toned status tokens |
| Processing units | `vCPUs` | Standard cloud compute notation |
| Memory metric | `Memory` (e.g., `512 MiB`, `2.0 GiB`) | Binary prefix for technical accuracy |
| Virtualization engine | `Firecracker microVM` | Clarifies lightweight jailer context |
| Theme options | `Light`, `Dark`, `System` | Standard, intuitive naming |

## Component Reuse Map

| Component | Used on | Behavior differences |
|-----------|---------|---------------------|
| `Header` / `ThemeToggle` | `/` and `/vms/[id]` | Shared utility bar with theme selection |
| `VMStatusBadge` | VM Cards & Detail View | Compact pill on cards; larger telemetry badge on overview |
| `Button` / `Badge` | All pages | Standardized variants (`default`, `outline`, `secondary`, `destructive`, `ghost`) |
| `Card` | All pages | Consistent tiered background, 1px border tokens, and hover states |
| `DeleteVMDialog` | VM Cards & Detail View | Unified confirmation modal across fleet and detail screens |

## Content Growth Plan

- **Fleet Expansion**: As VM counts increase, the grid seamlessly shifts into multi-column responsive rows with fast filter/search readiness.
- **Terminal History**: Monospace terminal panel supports smooth vertical scrolling and fixed prompt anchorage.

## URL Strategy

- `/` — Main MicroVM fleet dashboard.
- `/vms/[id]` — Direct deep-linkable inspection view for a specific microVM.
