# Proposal

## Why

Firecracker microVMs are assigned machine-generated identifiers (such as `vm-6ce50edc`) by the underlying `vmsan` CLI, which lacks built-in custom naming options. Adding human-friendly custom names in `vmsan-ui` allows users to identify, manage, and track microVMs intuitively without altering the low-level CLI or compromising security.

## What Changes

- **VM Resource Model**: Extend the VM resource schema with `name` (human-friendly display name) and explicit `vmsanId` (authoritative Firecracker identifier), keeping `id` as the application resource identity.
- **Metadata Persistence Layer**: Introduce a lightweight, local, atomic file-backed metadata store at `.vmsan-ui/vms.json` mapping `vmsanId` to custom names without introducing a database.
- **Name Validation & Uniqueness**: Implement strict validation for VM names (`^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$`), reject reserved prefixes (e.g. `vm-`), and enforce case-insensitive uniqueness while preserving the original display case.
- **API Endpoints**:
  - Extend `POST /api/vms` to accept and validate `name`, check uniqueness, execute VM creation via `vmsan`, and persist the name mapping upon creation.
  - Return `409 Conflict` with error code `VM_NAME_ALREADY_EXISTS` when duplicate names are submitted.
  - Update `GET /api/vms` to merge live `vmsan` inventory with persisted custom name metadata.
  - Update `DELETE /api/vms/:id` to enforce deletion orchestration (invoke `vmsan remove` first; delete metadata only upon successful removal; preserve metadata if removal fails).
  - Ensure all lifecycle operations (start, stop, delete) route via the authoritative `vmsanId`.
- **UI & Dashboard**:
  - Update microVM cards in the dashboard to render the custom name as the primary title and display the technical `vmsanId` secondarily.
  - Update the Create VM dialog with a dedicated `Name` input field and client-side validation against naming rules and reserved prefixes.

## Capabilities

### New Capabilities
- `vm-metadata`: Persistent storage, atomic file operations, name validation, case-insensitive uniqueness checks, and mapping management between custom human-friendly names and `vmsanId` identifiers.

### Modified Capabilities
- `vm-api`: Extend VM list, creation, and deletion endpoints to process custom names, merge metadata with live vmsan state, handle conflict errors (`VM_NAME_ALREADY_EXISTS`), and guarantee delete ordering without shell interpolation.
- `vm-dashboard`: Update VM cards to prominently display human-friendly names with secondary technical IDs, and extend the Create VM modal dialog with custom name input and validation.

## Impact

- **API Contracts**: `GET /api/vms` responses and `POST /api/vms` request/response schemas now include `name` and `vmsanId`.
- **Storage**: Introduces `.vmsan-ui/vms.json` in the application environment using atomic write/rename file operations.
- **Components**: `VMCard`, `CreateVMDialog`, and related dashboard state handlers are updated to handle the new resource model and validation.
- **Security**: Strict validation prevents shell metacharacters and ensures custom names are never interpolated into shell commands.
