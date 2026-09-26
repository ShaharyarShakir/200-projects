# Build Tasks: Bisect Workbench & Agent Cockpit

Generated from: .design/bisect-workbench/DESIGN_BRIEF.md
Date: 2026-09-25

## Foundation
- [x] **Task 1: Multi-Provider & Agent Router Configuration**: Build the agent model selector component (`AgentModelSelector.tsx`) supporting Claude 3.7, GPT-4o / Codex, Gemini 1.5 Pro, and Local Ollama, with badging and capability metadata. _Modifies: `WorkspaceHeader` & `TaskDispatchBar`._
- [x] **Task 2: OpenSpec Lifecycle Progression Tracker**: Create `OpenSpecLifecycleTracker.tsx` rendering the five discrete stages (Explore → Propose → Implement → Verify → Archive) with active/completed step state indicators. _New component._

## Core UI
- [x] **Task 3: Interactive Commit Bisect Timeline Scrubber**: Create `CommitTimelineScrubber.tsx` to visualize git commit histories with color-coded nodes (Good, Bad, Tested, Suspect, Culprit) and interactive click-to-inspect commit diffs. _New component._
- [x] **Task 4: Side-by-Side & Unified Diff Review Panel**: Create `DiffReviewPanel.tsx` supporting syntax-highlighted git diffs, changed file navigation tree, additions/deletions stats, and "Run Test Validation" trigger. _New component._
- [x] **Task 5: Human-in-the-Loop Approval Gate Modal & Banner**: Create `HumanApprovalGate.tsx` surfacing pending sensitive actions when session status is `awaiting_approval`, with command execution previews, risk tags, and keyboard shortcuts (`A` to approve, `X` to reject). _New component._

## Interactions & States
- [x] **Task 6: Cockpit Integration & State Synchronization in Workspace**: Integrate `AgentModelSelector`, `OpenSpecLifecycleTracker`, `CommitTimelineScrubber`, `DiffReviewPanel`, and `HumanApprovalGate` into `/workspace` with smooth tab toggles, live polling, and error boundaries. _Modifies: `app/workspace/page.tsx`._
- [x] **Task 7: Sessions Archive & Filtered History View**: Enhance `/sessions/page.tsx` with dynamic multi-parameter filtering (status, repo, model provider), search, token metrics column, and quick drill-down links. _Modifies: `app/sessions/page.tsx`._
- [x] **Task 8: Multi-Provider & Sandbox Settings Panel**: Update `/settings/page.tsx` with API key management for Anthropic, Google, OpenAI, and local Ollama endpoint configuration, alongside Podman sandbox resource limits and safety mode toggles. _Modifies: `app/settings/page.tsx`._

## Responsive & Polish
- [x] **Task 9: Responsive Layout & Mobile/Tablet Drawer Polish**: Ensure all panels (Diff Review drawer, commit scrubber, activity timeline) adapt seamlessly across breakpoints (`sm: 375px`, `md: 768px`, `xl: 1280px`). _Covers: responsive shell & touch interactions._
- [x] **Task 10: Test Suite & Accessibility Verification**: Add comprehensive Vitest & React Testing Library tests for the new components (Timeline Scrubber, Diff Review, Human Approval Gate, Model Selector) and verify full test suite passing with keyboard navigation & ARIA assertions. _Covers: Vitest test coverage._

## Review
- [ ] **Task 11: Design Review**: Run /design-review against the brief.
