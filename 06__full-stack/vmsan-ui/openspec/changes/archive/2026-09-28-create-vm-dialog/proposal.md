# Proposal

## Why

The vmsan dashboard currently allows users to view and refresh the existing inventory of Firecracker microVMs, but requires the command line or manual API calls to create new VMs. Providing an interactive, accessible "Create VM" dialog directly on the dashboard completes the creation lifecycle in the UI while ensuring all operations route safely through the validated server-side API (`POST /api/vms`).

## What Changes

- Add a **+ Create VM** button to the dashboard header alongside the existing Refresh control.
- Introduce a client-side `createVM` helper in `src/lib/api/vms.ts` to perform `POST /api/vms` with standardized JSON payload and error handling.
- Implement a modal `CreateVMDialog` component (`src/components/vms/create-vm-dialog.tsx`) using shadcn Dialog, Select, Input, Label, and Button components.
- Support configuring:
  - **Runtime**: Select dropdown with options `Base` (`base`), `Node.js 22` (`node22`), `Node.js 24` (`node24`), and `Python 3.13` (`python3.13`), defaulting to `base`.
  - **vCPUs**: Numeric integer input >= 1, defaulting to `1`.
  - **Memory (MiB)**: Numeric integer input >= 128, defaulting to `128`.
- Implement client-side form validation with inline feedback before submission.
- Manage submission state: disable action buttons and show loading indicator during creation to prevent duplicate submissions.
- On successful VM creation: close the dialog, reset form fields to defaults, and automatically refresh the dashboard VM inventory via `GET /api/vms`.
- On creation failure: keep dialog open, display user-safe error message without exposing backend internals, and preserve user input.
- Maintain strict local component state with zero new global state libraries.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `vm-dashboard`: Add requirements for the Create VM dialog trigger, form input controls and client-side validation, submission lifecycle state handling, error reporting, and post-creation inventory synchronization.

## Impact

- **UI Components**: `src/components/vms/create-vm-dialog.tsx` added; `src/components/vms/vm-dashboard.tsx` updated to include the dialog trigger and refresh callback.
- **Client API**: `src/lib/api/vms.ts` and `src/lib/api/types.ts` extended with `createVM` function and `CreateVMRequest` / `CreateVMResponse` types.
- **Testing**: Unit and integration test suites added for `createVM` client helper, `CreateVMDialog` component, and dashboard creation workflows.
- **Dependencies**: Reuses existing installed shadcn/ui components (`dialog.tsx`, `select.tsx`, `input.tsx`, `label.tsx`, `button.tsx`) and Lucide icons; no new third-party dependencies.
