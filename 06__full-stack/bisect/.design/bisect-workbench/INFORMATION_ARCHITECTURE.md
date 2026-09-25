# Information Architecture: Bisect Workbench & Agent Cockpit

## Site Map

A hierarchical map of all views in the Bisect developer application:

- **Root** `/` *(Auto-redirects to `/workspace`)*
- **Agent Workspace (Cockpit)** `/workspace`
  - Repository Selector & Sync Bar
  - Workspace Lifecycle & Health Status
  - Task Dispatch Bar (Agent / Model Router + Prompt + Presets)
  - Active Session Inspector & Metrics
  - Real-time Activity & Execution Feed
  - Interactive Bisect Timeline & Diff Review Drawer
- **Sessions Archive** `/sessions`
  - Filter / Search Bar (Status, Repo, Model, Date range)
  - Sessions Table & Historical Runs
  - **Session Detail View** `/sessions/[id]`
    - Session Overview & Token/Cost Metrics
    - Full Step Trace & Terminal Execution Logs
    - Git Diff & Artifact Inspector
    - OpenSpec Phase Progress (Explore → Propose → Implement → Verify → Archive)
- **Live Activity Feed** `/activity`
  - Global Cross-Session Event Stream
  - Podman Sandbox Lifecycle Events (Start, Stop, Cleanup)
  - Safety & Permission Audit Log
- **Settings & Config** `/settings`
  - **GitHub Integration** `/settings#github` (OAuth, Sync status, Git Safety Mode)
  - **AI Providers & Models** `/settings#providers` (Anthropic, Gemini, OpenAI, Ollama Local)
  - **Podman Sandbox & Limits** `/settings#sandbox` (Timeout, Memory/CPU, Network policy)
  - **Permissions & Approval Gates** `/settings#permissions` (Human-in-the-loop toggles)
- **Auth Callback** `/auth/callback` (OAuth code exchange & session initialisation)

---

## Navigation Model

- **Primary Navigation (Left Sidebar / Top Header)**:
  - **Workspace** (`/workspace`) — Live agent cockpit, active execution, and task dispatch (where users spend 80% of their time).
  - **Sessions** (`/sessions`) — Searchable history of all past and concurrent agent sessions.
  - **Activity** (`/activity`) — Global real-time audit trail of container, tool, and validation events.
  - **Settings** (`/settings`) — Provider keys, sandbox limits, and safety mode settings.
- **Secondary Navigation (Contextual & Tabbed)**:
  - Inside Workspace / Session Inspector: Tabbed toggle between *Execution Trace*, *Bisect Timeline*, *Diff Review*, and *OpenSpec Stages*.
  - Repository & Branch dropdown switcher in the workspace header.
- **Utility Navigation**:
  - User profile / GitHub account badge in header.
  - Live polling indicator with manual refresh trigger.
  - Global human-in-the-loop alert badge (pulsing indicator when an agent is `awaiting_approval`).
- **Mobile Navigation**:
  - Off-canvas sliding drawer with overlay backdrop for the sidebar menu.
  - Sticky bottom/top action bar for quick session control (Pause, Abort, Approve).

---

## Content Hierarchy

### 1. Agent Workspace (`/workspace`)
1. **Repository & Connection Header** — Confirms the active codebase context, branch, and sync status.
2. **Lifecycle Health & Status Summary** — Instant color-coded badges showing Workspace Status, Session State, and Validation Health.
3. **Agent Task Dispatch Bar** — Action-oriented input field with Model Router selector (Claude 3.7, Codex, Ollama Llama 3) and quick preset buttons.
4. **Active Session Inspector (Left/Split Col)** — Core execution telemetry: duration, token consumption, exit codes, and sandbox state.
5. **Real-time Activity Stream (Center/Right Col)** — Chronological step-by-step trace showing tool calls, commands, and expandable stdout/stderr outputs.
6. **Commit Bisect & Diff Panel (Drawer / Expansion)** — Visual commit progression and side-by-side patch review for generated fixes.

### 2. Sessions Archive (`/sessions`)
1. **Search, Filter & Sort Bar** — Multi-parameter filtering by status (`completed`, `failed`, `running`, `awaiting_approval`), repository, and date.
2. **Sessions Data Table / Grid** — High-density summary list with commit hashes, prompts, durations, token counts, and outcome badges.
3. **Bulk Actions** — Archive, re-run, or export session traces.

### 3. Session Detail View (`/sessions/[id]`)
1. **Session Meta & Action Bar** — Prompt, model used, total runtime, status, and Re-run / Fork session buttons.
2. **OpenSpec Lifecycle Bar** — Phase indicator (Explore → Propose → Implement → Verify → Archive).
3. **Execution Trace & Terminal Log Tab** — Deep inspection of all intermediate commands with raw log copy/export.
4. **Git Diff & Changed Files Tab** — Interactive file tree and unified diff viewer.

### 4. Settings (`/settings`)
1. **AI Model & Provider Credentials** — Key configuration for Anthropic, Google Gemini, OpenAI, and local Ollama endpoint.
2. **Sandbox & Resource Policy** — Execution limits (max timeout, Podman container image, memory limits).
3. **Security & Human-in-the-Loop Gates** — Safety checkboxes for command execution, git commit/push, and network access.

---

## User Flows

### Flow 1: Automated Regression Bisect & Fix Loop
1. User opens `/workspace` and selects the target repository and branch from the header.
2. User enters a regression prompt (e.g. *"Bisect test failure in test_auth.py between v1.2 and HEAD"*) and selects **Claude 3.7** with **Isolated Podman Sandbox**.
3. User clicks **Start Task**.
4. The system initializes a new session and spawns a sandboxed agent; the workspace transitions to live polling.
5. Steps appear chronologically in the **Activity Feed** (Checking out commits → running test suite → binary search step).
6. Agent isolates the breaking commit: **Commit Timeline Scrubber** highlights the exact offending commit hash.
7. Agent formulates a patch and runs automated validation tests:
   - *If tests pass* → status changes to `completed`, candidate diff is highlighted in the **Diff Review Panel**.
   - *If tests fail* → agent triggers repair loop (step count increments, self-correction attempt).

### Flow 2: Human-in-the-Loop Sensitive Action Approval
1. During execution, the agent determines it needs to run a potentially destructive shell command or create a git commit/PR.
2. Session status switches to `awaiting_approval`.
3. A modal / prominent banner appears in the cockpit with the exact command, target files, and rationale.
4. User reviews the proposed action:
   - User clicks **Approve** (or presses `A`) → agent resumes execution in sandbox.
   - User clicks **Reject** (or presses `X`) → user optionally provides feedback reason; agent attempts alternative approach.

### Flow 3: Code Diff Inspection & Verification
1. User clicks on the **Diff Review** tab on an active or completed session.
2. User inspects the modified files list and side-by-side patch viewer.
3. User can click **Run Validation** to execute the project's test suite against the patch in the sandbox.
4. User clicks **Accept Patch** to apply changes to their working tree or branch.

---

## Naming Conventions

| Concept | Label in UI | Notes |
|---------|-------------|-------|
| Autonomous agent run | **Session** | Represents a single execution lifecycle of an agent on a task. |
| Single action taken by agent | **Step** | A discrete command execution, file read/write, or LLM reasoning node. |
| Sandboxed execution container | **Sandbox** | Local Podman-isolated environment. |
| Regression isolation process | **Bisect** | Binary search / automated triage across commit history. |
| Human intervention gate | **Approval Gate** | State where agent is paused waiting for user authorization (`awaiting_approval`). |
| Multi-model routing engine | **Model Router** | Selection of LLM provider (Claude, Codex, Gemini, Ollama). |
| Self-healing fix cycle | **Repair Loop** | Autonomous iterate → test → diagnose → fix cycle. |
| Specification lifecycle | **OpenSpec Phase** | Structured progression (Explore → Propose → Implement → Verify → Archive). |

---

## Component Reuse Map

| Component | Used on | Behavior differences |
|-----------|---------|---------------------|
| `AppShell` | All pages (`/workspace`, `/sessions`, `/activity`, `/settings`) | Provides responsive layout, sidebar, header, and global notification badges. |
| `StatusSummary` | `/workspace`, `/sessions/[id]` | Displays compact workspace vs. deep session validation health. |
| `ActivityFeed` | `/workspace`, `/sessions/[id]`, `/activity` | Shows live session steps on workspace/detail; shows multi-session events on activity page. |
| `ErrorBanner` & `ErrorState` | All pages | Standardized dismissible error alerts and empty-state placeholders. |
| `DiffReviewPanel` | `/workspace`, `/sessions/[id]` | Inline collapsible drawer on workspace; full-page tab on session detail. |
| `CommitTimelineScrubber` | `/workspace`, `/sessions/[id]` | Interactive commit graph with pass/fail/suspect color coding. |

---

## Content Growth Plan

- **Sessions Archive (`/sessions`)**: Will accumulate hundreds of runs over time. Supports server-side pagination (20 items/page), status filtering tabs, repository filtering, and date range query parameters.
- **Activity Feed (`/activity`)**: Uses virtualized windowing / cursor-based pagination to render thousands of step events without browser performance degradation.
- **Execution Logs**: High-volume terminal outputs are collapsed by default with lazy-loaded log viewer and search highlighting.

---

## URL Strategy

- **Workspace**: `/workspace` (optional query param `?session_id=<uuid>` to deep-link to a specific active cockpit session).
- **Sessions List**: `/sessions?status=<status>&repo_id=<uuid>&page=<int>&q=<search>`
- **Session Detail**: `/sessions/:id` (tabs via subpath or query param: `?tab=trace|diff|timeline|openspec`)
- **Settings**: `/settings` (deep-link anchor hashes `#providers`, `#sandbox`, `#github`, `#permissions`)
