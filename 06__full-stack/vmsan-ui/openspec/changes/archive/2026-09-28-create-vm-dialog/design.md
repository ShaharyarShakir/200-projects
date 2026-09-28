# Design

## Context

The vmsan UI dashboard (`src/components/vms/vm-dashboard.tsx`) currently renders the inventory of microVMs retrieved from `GET /api/vms`. The server-side API route `POST /api/vms` was established in Phase 1C and accepts `{ runtime?: SupportedRuntime, vcpus?: number, memoryMiB?: number }`, validates the parameters, invokes `createVM` in the vmsan adapter, and returns `{ success: true, result }` or structured error `{ error: { code, message } }`.

The UI uses Tailwind CSS, Lucide icons, and pre-installed shadcn/ui components (`Dialog`, `Select`, `Input`, `Label`, `Button`).

See `proposal.md` for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Provide an accessible, compact modal dialog (`CreateVMDialog`) triggered from the dashboard header.
- Provide intuitive input controls:
  - Runtime dropdown: `Base` (`base`), `Node.js 22` (`node22`), `Node.js 24` (`node24`), `Python 3.13` (`python3.13`), defaulting to `base`.
  - vCPUs input: Integer >= 1, defaulting to `1`.
  - Memory input: Integer >= 128 (in MiB), defaulting to `128`.
- Validate user inputs client-side with clear inline error messaging.
- Prevent duplicate submissions while an API request is in flight.
- Extend `src/lib/api/vms.ts` with a reusable `createVM(options, fetchFn)` client helper.
- Ensure the dialog resets to defaults upon successful creation and triggers an inventory refresh via `GET /api/vms`.
- Retain form state and display user-safe error messages if creation fails.

**Non-Goals:**
- No global state management libraries (Redux, Zustand, Jotai, Context).
- No multi-step wizard or complex tabs.
- No advanced CLI configuration flags (`--kernel`, `--rootfs`, `--disk`, `--network-policy`, `--timeout`, etc.).
- No VM lifecycle action buttons (start/stop/delete) inside the dashboard or dialog.
- No direct browser-to-CLI execution.

## Decisions

### 1. Component Architecture & Encapsulation
- **Decision**: Implement `CreateVMDialog` in `src/components/vms/create-vm-dialog.tsx` that manages its own dialog open/close state (with optional controlled prop), local form state (`runtime`, `vcpus`, `memoryMiB`), validation errors, loading state (`isSubmitting`), and submission error messages.
- **Rationale**: Isolates form-specific state and re-renders to the dialog itself, keeping `VMDashboard` clean and focused on inventory presentation and refresh coordination.
- **Alternatives Considered**: Keeping all form state in `VMDashboard` (rejected: causes unnecessary top-level dashboard re-renders on every keystroke).

### 2. Client API Helper & Type Definitions
- **Decision**: Add `createVM` to `src/lib/api/vms.ts` with custom `fetchFn` parameter for testability:
  ```ts
  export interface CreateVMRequest {
    runtime: "base" | "node22" | "node24" | "python3.13";
    vcpus: number;
    memoryMiB: number;
  }

  export interface CreateVMResponse {
    success: boolean;
    result?: {
      stdout: string;
      stderr: string;
      exitCode: number;
    };
  }

  export async function createVM(
    options: CreateVMRequest,
    fetchFn: typeof fetch = fetch
  ): Promise<CreateVMResponse>
  ```
  Follow existing `ApiError` parsing patterns to reject on non-2xx status with sanitized `ApiError` details.
- **Rationale**: Reuses the proven API client pattern established in Phase 1D for `getVMs`, decoupling UI components from raw `fetch` mechanics and error parsing.
- **Alternatives Considered**: Inlining `fetch` calls inside `CreateVMDialog` (rejected: hard to unit test in isolation and duplicates error parsing).

### 3. Client-Side Input Validation Strategy
- **Decision**: Validate inputs synchronously during form submission and on field blur/change:
  - `runtime`: must be one of `"base" | "node22" | "node24" | "python3.13"`.
  - `vcpus`: must parse to an integer, must be `Number.isInteger(val)` and `val >= 1`.
  - `memoryMiB`: must parse to an integer, must be `Number.isInteger(val)` and `val >= 128`.
- **Rationale**: Gives users instantaneous visual feedback next to the specific field before triggering a network roundtrip. Server-side validation in `POST /api/vms` remains the authoritative security gate.
- **Alternatives Considered**: Relying purely on server-side 400 responses (rejected: slower feedback and degraded user experience).

### 4. Post-Creation Inventory Refresh Flow
- **Decision**: `CreateVMDialog` accepts an `onSuccess?: () => Promise<void> | void` callback (provided by `VMDashboard.handleRefresh`).
  When `createVM()` succeeds:
  1. Await/trigger `onSuccess()` (which executes `GET /api/vms` and updates dashboard state).
  2. Reset form state to defaults.
  3. Close the dialog.
- **Rationale**: Ensures the dashboard inventory reflects the true backend state directly from the server API rather than fabricating an optimistic client VM object.

## Risks / Trade-offs

- **[Risk] Duplicate submissions if user clicks Create multiple times rapidly**
  - *Mitigation*: Set `isSubmitting = true` immediately upon submit trigger; disable the submit and cancel buttons and show spinner with "Creating..." text while pending.
- **[Risk] Number input quirks (e.g. empty string, decimals, exponential notation)**
  - *Mitigation*: Store input values as strings or numbers with strict parsing (`parseInt(value, 10)` checked with `Number.isInteger` and exact string equality / regex) before payload generation.
- **[Risk] Exposing sensitive server error details on failure**
  - *Mitigation*: Display sanitized messages from `ApiError.message` or a standard fallback message ("Unable to create VM. Please check the configuration and try again.") without leaking backend stack traces or paths.
