# Design Brief: Bisect Workbench & Agent Cockpit

## Problem

When software regressions, flaky tests, or silent behavioral changes enter large codebases, developers face grueling manual bisecting and debugging sessions: pulling commits, rebuilding environments, running test suites, parsing gigabytes of logs, and formulating candidate fixes. While AI coding agents can automate this investigative loop, developers currently lack a trusted, local-first cockpit that provides fine-grained control, sandboxed isolation, real-time observability, and explicit human-in-the-loop safety gates across multi-model providers.

## Solution

The Bisect Workbench is an authoritative, high-density developer cockpit for orchestrated multi-agent debugging, automated regression bisecting, and repair loops. It integrates multi-model routing (Claude, Codex, Gemini, Ollama), isolated Podman sandboxes, structured state-machine step progression, interactive commit timeline scrubbing, side-by-side diff reviews, and human-in-the-loop approval gates into a unified, local-first web interface.

## Experience Principles

1. **Radical Transparency over Black-Box Magic** — Every agent thought, command execution, sandbox state change, and diff inspection is surfaced deterministically in structured chronological timelines. No opaque spinners or hidden side effects.
2. **Deterministic Safety over Unchecked Autonomy** — Sensitive actions (git push, destructive commands, credential exposure, external networking) require explicit human-in-the-loop consent and granular capability toggles. The developer always retains absolute repository ownership.
3. **High-Density Precision over Decorative Whitespace** — Built for professional engineers who triage complex systems. Information hierarchy prioritizes signal-to-noise ratio, monospace clarity, keyboard shortcuts, and instant state filtering over airy marketing aesthetics.

## Aesthetic Direction

- **Philosophy**: *High-Density Devtools & Terminal-Native Precision* — Dark-mode first, clean slate/navy surfaces (`#090d16` background with `#0f172a` container cards), sharp borders (`#1e293b`/`#334155`), vibrant semantic status indicators (emerald pass, rose fail, blue running, amber gate awaiting approval), and monospace data tables.
- **Tone**: Authoritative, calm, dependable, engineer-grade.
- **Reference points**: Linear (issue triage and shortcut efficiency), Datadog/Sentry (live trace timelines and log drill-downs), GitHub Actions / GitKraken (commit graphs and diff inspectors), Raycast (command speed).
- **Anti-references**: Low-density consumer dashboards, floating bubbly cards, cartoonish chatbot speech bubbles, or sluggish accordion-heavy nested layouts.

## Existing Patterns

- **Typography**: System sans-serif stack (`system-ui`, `-apple-system`, `Roboto`, `Segoe UI`) paired with tabular monospace fonts for commits, logs, diffs, and token counts.
- **Colors**: Dark slate palette defined via CSS variables in `@layer base`:
  - Background: `#090d16`
  - Cards/Surfaces: `#0f172a`
  - Primary Accent: `#3b82f6` (blue)
  - Borders: `#334155` / `#1e293b`
  - Status Semantics: Emerald (`#10b981`), Amber (`#f59e0b`), Rose (`#ef4444`), Violet (`#8b5cf6`).
- **Spacing**: Tailwind 4px base scale (`p-4`, `p-6`, `gap-3`, `gap-6`), compact headers, dense tables.
- **Components**: `AppShell`, `Sidebar`, `Header`, `WorkspaceHeader`, `StatusSummary`, `SessionCard`, `ActivityFeed`, `EmptyState`, `ErrorState`, `LoadingSkeleton`.

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| `AppShell` & `Sidebar` | Exists | Master responsive navigation shell; needs badges for running sessions and approval alerts. |
| `WorkspaceHeader` | Exists | Repository selector and sync status bar; extend with branch/worktree switcher. |
| `StatusSummary` | Exists | Lifecycle & validation health badge bar (ready, validating, passed, failed). |
| `TaskDispatchBar` | Exists / Modify | Agent task trigger bar; enhance with multi-agent/model router dropdown (Claude, Gemini, Ollama) and sandbox preset picker. |
| `SessionCard` | Exists / Modify | Active session overview; add resource counters (tokens, sandbox runtime, CPU/memory limits). |
| `ActivityFeed` & Step Inspector | Exists / Modify | Chronological execution feed; enhance with terminal stdout/stderr stream views and tool call drill-downs. |
| `CommitTimelineScrubber` | New | Interactive visual commit bisect timeline showing tested, passing, failing, and suspect commits. |
| `DiffReviewPanel` | New | Split/unified diff inspector displaying exact agent-generated patches with accept/reject hunk controls. |
| `HumanApprovalGateModal` | New | Modal / persistent banner prompting user confirmation for sensitive commands or branch mutations. |
| `OpenSpecLifecycleTracker` | New | Step progression bar tracking Explore → Propose → Implement → Verify → Archive phases. |
| `ProviderSettingsPanel` | Modify | Multi-provider API key manager (Anthropic, Google, Ollama, OpenRouter) with local validation. |

## Key Interactions

1. **Multi-Agent Task Dispatch**: User types an objective or selects an automated bisect target → chooses target Agent/Model (e.g. Claude 3.7 / Ollama Llama 3) and sandbox policy → clicks *Start Task* → workspace smoothly transitions into live streaming mode with polling fallback.
2. **Live Execution & Step Scrubbing**: As the agent executes within the Podman sandbox, steps (commands, file reads, test runs) stream into the Activity Feed. Clicking any step expands command details, exit codes, and stdout/stderr with syntax highlighting.
3. **Human-in-the-Loop Interception**: When an agent attempts a sensitive operation (e.g., executing a destructive script or preparing a git commit), the session state switches to `awaiting_approval`. A high-visibility banner/modal presents the pending command and context with explicit **Approve** (hotkey `A`) and **Reject / Abort** (hotkey `X`) actions.
4. **Interactive Bisect & Diff Review**: When a regression is isolated or a candidate fix is synthesized, the user can toggle the *Diff Review Panel* to inspect git hunks, compare against baseline commits, and trigger automated validation.

## Responsive Behavior

- **Desktop (>= 1280px)**: 3-column / multi-pane layout: Navigation sidebar, central execution/timeline cockpit, right-hand session metrics, and expandable bottom/side diff drawer.
- **Tablet (768px - 1024px)**: Collapsible sidebar (hamburger toggle), stacked 2-column layout with tabbed switching between Activity Stream, Diff Inspector, and Metrics.
- **Mobile (< 768px)**: Single column stream, overlay navigation drawer, sticky task status banner, simplified step cards, and full-screen modal diff previews.

## Accessibility Requirements

- **Contrast Ratios**: Minimum 4.5:1 for all text against dark surfaces (`#090d16` / `#0f172a`), 3:1 for graphical UI elements and interactive boundaries.
- **Keyboard Navigation**: Full keyboard traversal across all interactive elements (`Tab`, `Shift+Tab`, `Enter`, `Space`), with dedicated shortcuts (`Escape` to close drawers/modals, `Cmd/Ctrl+K` for command palette, `J`/`K` for step navigation).
- **Focus Management**: Explicit visible focus rings (`focus:ring-2 focus:ring-blue-500`) on buttons, inputs, and interactive step cards. Auto-focus management inside approval dialogs.
- **Screen Reader Announcements**: `aria-live="polite"` regions for streaming step updates and status transitions; clear `aria-expanded` and role landmarks across collapsible panels.

## Out of Scope

- Hosting or deploying external cloud containers (execution is strictly local/Podman-first).
- Full browser-based IDE code editing (Bisect is an inspection, bisect, and validation workbench, not a replacement for VS Code / Cursor).
- Direct payment/billing gateways for LLM tokens (developers bring their own API keys or use local Ollama models).
