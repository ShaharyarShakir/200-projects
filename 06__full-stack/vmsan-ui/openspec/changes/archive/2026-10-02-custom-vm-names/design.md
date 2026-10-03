# Design

## Context

Firecracker microVMs are assigned machine-generated identifiers (e.g. `vm-6ce50edc`) by the underlying `vmsan` CLI. The CLI does not accept or track human-readable names. `vmsan-ui` must maintain a persistent mapping between custom names and authoritative `vmsanId` identifiers without modifying `vmsan` or introducing external database dependencies.

See `proposal.md` for motivation and background.

## Goals / Non-Goals

**Goals:**
- Implement the foundational custom VM naming model (`id`, `name`, `vmsanId`, `status`, `runtime`, `vcpus`, `memoryMiB`, `age`).
- Provide strict name validation (`^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$`) and rejection of reserved prefixes (`vm-`).
- Enforce case-insensitive uniqueness while preserving user-entered casing for display.
- Persist metadata atomically to `.vmsan-ui/vms.json` with crash resilience.
- Keep the metadata layer strictly decoupled from the low-level `vmsan` process adapter (`src/lib/vmsan/`).
- Ensure all lifecycle operations (start, stop, delete) route strictly using validated `vmsanId`.
- Orchestrate deletion sequence: remove from `vmsan` first; remove metadata only upon success; preserve metadata on failure.
- Update UI cards to feature custom names as primary titles with `vmsanId` as secondary details, and add custom name input to the creation dialog.

**Non-Goals:**
- Implementing a database (SQLite, PostgreSQL, etc.).
- Adding authentication, multi-user tenancy, or permissions.
- Advanced features: snapshots, terminal access, file transfer, network policies, Electron shell, Agent Workspace, Incus integration.
- Full rename UI (Phase 0 defines data contracts and models; rename UI is deferred).

## Decisions

### Decision 1: Separation of Metadata Store and vmsan Adapter
- **Approach**: Create `src/lib/vm-metadata/` containing:
  - `types.ts`: Metadata schemas and stored entity types.
  - `validation.ts`: Name format validators, reserved prefix checks, and normalization functions.
  - `store.ts`: Atomic JSON file persistence and query/mutation methods.
- **Rationale**: `vmsan` remains purely responsible for running host commands and parsing CLI output. API route handlers coordinate between `vm-metadata` and `vmsan`.
- **Alternatives Considered**: Embedding metadata persistence in `src/lib/vmsan/client.ts`. Rejected to keep CLI execution decoupled from UI metadata state.

### Decision 2: Atomic File-Based Persistence
- **Approach**: Store metadata in `.vmsan-ui/vms.json` formatted as:
  ```json
  {
    "version": 1,
    "vms": {
      "vm-a83f19c2": {
        "name": "my-node",
        "createdAt": "2026-09-29T12:00:00.000Z"
      }
    }
  }
  ```
  Writes use a write-to-temporary-file + `fs.promises.rename` strategy in the `.vmsan-ui` directory.
- **Rationale**: Guarantees atomic updates on POSIX filesystems without partial writes or corruptions if the process crashes mid-write.
- **Alternatives Considered**:
  - Direct file overwrite (`fs.writeFile`): Risk of file truncation/corruption on unexpected termination.
  - SQLite/Embedded DB: Unnecessary dependency weight for Phase 0 local prototyping.

### Decision 3: Resource Identity Model
- **Approach**:
  ```typescript
  export type ClientVM = {
    id: string;        // vmsan-ui resource identity (defaults to vmsanId)
    name: string;      // Human-friendly custom name
    vmsanId: string;   // Underlying vmsan CLI VM identifier
    status: ClientVMStatus;
    memoryMiB: number | null;
    vcpus: number | null;
    runtime: string | null;
    age: string | null;
  };
  ```
- **Rationale**: Clarifies the boundary between UI resource identity and the physical vmsan identifier while maintaining backward compatibility where `id === vmsanId`.

### Decision 4: Validation & Case-Insensitive Uniqueness
- **Approach**:
  - Regex pattern: `/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/`.
  - Reserved prefix check: `/^vm-/i.test(name)` is rejected.
  - Uniqueness: Indexed/compared by `name.trim().toLowerCase()`. Stored and rendered with exact user casing.
- **Rationale**: Rejection of `vm-` prevents confusing user-created names with raw Firecracker identifiers. Normalized uniqueness prevents confusing lookups while honoring user casing preference.

### Decision 5: Delete Orchestration Sequence
- **Approach**:
  ```text
  DELETE /api/vms/:id
     │
     ▼
  1. Validate VM ID and resolve vmsanId
     │
     ▼
  2. Call vmsan remove <vmsanId>
     │
     ├─► [Failure] ──► Return error response; keep metadata intact
     │
     └─► [Success] ──► Delete key from .vmsan-ui/vms.json ──► Return 200 OK
  ```
- **Rationale**: If `vmsan remove` fails (e.g. running VM or permission issue), keeping metadata ensures the user does not lose their custom name association for a VM that still exists.

## Risks / Trade-offs

- **[Risk] Metadata out of sync with external CLI operations (e.g., user runs `vmsan remove` manually in terminal)**
  → *Mitigation*: On `GET /api/vms`, metadata for missing VMs is safely ignored and not rendered in the live inventory. Metadata is not automatically purged or recreated.
- **[Risk] Concurrent file writes under high load**
  → *Mitigation*: Use an in-process serialization lock (promise queue) combined with atomic temp-file rename in `store.ts` to ensure consistency.
- **[Risk] Corrupted metadata file**
  → *Mitigation*: Gracefully handle JSON parse failures by falling back to an empty in-memory state and creating a backup of the corrupted file, ensuring the app remains functional.
