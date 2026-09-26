# Information Architecture: Bisect Landing Page & Developer Cockpit Entry

## Site Map & Route Architecture

```text
- / (Root Entry)
  ├── [If Authenticated] ──> Instant client redirect to /workspace
  └── [If Unauthenticated] ──> Bisect Landing Page
        ├── 1. Navbar (Sticky header with anchor navigation & GitHub Auth)
        ├── 2. Hero Section
        │     ├── Headline & Value Proposition
        │     ├── Action Bar (Sign in with GitHub, View Docs, Quick install)
        │     └── Simulated Live Cockpit Terminal (Interactive Git Bisect Demo)
        ├── 3. Metrics & Social Proof KPI Bar (Quantified Developer Benchmarks)
        ├── 4. Feature Matrix Section (#features)
        │     ├── Automated Git Bisect Engine
        │     ├── Groq Fast Inference (<2s per step)
        │     ├── Podman Isolated Container Sandboxes
        │     ├── Human-in-the-Loop Safety Gate
        │     ├── Live Execution Activity Trace
        │     └── Interactive Git Diff & Commit Scrubber
        ├── 5. How It Works Section (#how-it-works)
        │     ├── Step 1: Connect GitHub Repo & Provide Bisect Objective
        │     ├── Step 2: Agent Runs Sandboxed Bisect & Test Suite Execution
        │     └── Step 3: Inspect Diff, Approve via Safety Gate, Apply Fix
        ├── 6. Testimonials & Developer Reviews (#reviews)
        │     ├── Staff Engineer Review
        │     ├── Open Source Maintainer Review
        │     └── Platform SRE Review
        ├── 7. Conversion CTA Banner (Ready to accelerate debugging?)
        └── 8. Footer (Navigation links, GitHub repo, status, copyright)

- /workspace (Authenticated Developer Cockpit)
  ├── Header (Logo, Active Repo Selector, User Profile, Logout)
  ├── Sidebar Navigation (Workspace, Sessions, Activity, Settings)
  └── Main Cockpit Area
        ├── Workspace Header & Repository Status
        ├── Session Status Card (Idle / Running / Completed)
        ├── Activity Feed (Chronological Execution Steps)
        ├── Validation Status Indicator (Not Run / Validating / Passed / Failed)
        ├── Agent Task Dispatch Bar & Model Selector
        └── View Tabs (Live Trace, Bisect Timeline, Diff Review)

- /sessions (Historical Agent Sessions & Logs)
- /activity (Global Audit Logs & Telemetry)
- /settings (GitHub Credentials, Groq API Keys, Sandbox Config)
```

## Navigation Model

### 1. Primary Navigation (Landing Header)
- **Brand**: `BISect` logo badge with quick status dot.
- **Anchor Links**:
  - `Features` → Smooth scroll to `#features`
  - `How It Works` → Smooth scroll to `#how-it-works`
  - `Reviews` → Smooth scroll to `#reviews`
- **Call-to-Action**:
  - `Sign in with GitHub` (Primary button with GitHub icon, triggers OAuth flow).

### 2. Mobile Navigation
- Collapsible hamburger menu (< 768px).
- Displays all anchor links + GitHub Sign In button as full-width touch targets (minimum 48px height).

### 3. Utility Navigation & Footer
- **Product Links**: Documentation, Architecture, API Reference, GitHub Repository.
- **System Info**: Operational Status (`All systems operational`, `Groq API online`).
- **Legal & Copyright**: MIT License, Bisect Open Source Project.

## Content Hierarchy & Page Breakdown

### 1. Hero Section (First Fold)
1. **Pill Badge**: `⚡ Powered by Groq & Podman Sandboxes • Bisect v0.1.0`
2. **Main Headline**: `Automate Regression Isolation with AI-Driven Git Bisect`
3. **Sub-headline**: `Stop wasting hours manually bisecting broken commits. Bisect runs your test suite in isolated container sandboxes, pinpoints the root-cause commit with Groq-speed AI, and generates verified diffs with strict human approval gates.`
4. **Primary CTAs**:
   - `Sign in with GitHub` (Primary accent button)
   - `View Interactive Demo` (Secondary ghost button scrolling to terminal)
5. **Interactive Hero Terminal**:
   - Live simulated playback showing:
     - `git clone` & sandbox spin-up
     - Automated binary search through 14 commits
     - Failing test execution inside Podman
     - Groq model diagnosing culprit commit (`8f2a1b9`)
     - Human approval prompt for diff proposal

### 2. Proof Metric Strip (KPIs)
- `85%` — Reduction in regression triage & isolation time
- `< 2.0s` — Average Groq reasoning step turnaround
- `100%` — Podman container sandboxing (Zero host contamination)
- `0` — Unreviewed writes (Strict human safety approval barrier)

### 3. Feature Showcase Matrix (Grid)
- **Card 1: Automated Git Bisect Engine** — Fast binary search across commit histories to pinpoint regressions automatically.
- **Card 2: Sub-Second Groq AI Inference** — Ultra-low latency LLM reasoning to parse stack traces, ASTs, and test reports.
- **Card 3: Isolated Podman Execution Sandboxes** — Run untrusted builds and scripts safely inside disposable containers.
- **Card 4: Human-in-the-Loop Safety Gate** — Complete developer control with strict approval gates before modifying code or running shell commands.
- **Card 5: Real-Time Execution Trace** — Live streaming telemetry of every tool invocation, shell command, and status change.
- **Card 6: Visual Diff & Timeline Scrubber** — Comprehensive commit timeline and visual patch review before applying fixes.

### 4. How It Works (3-Step Lifecycle)
1. **Connect & Dispatch**: Connect your GitHub repository with 1-click OAuth and specify your task objective or failing test suite.
2. **Sandboxed Bisect & Diagnose**: The agent initializes an isolated container, steps through commit history, runs tests, and diagnoses the root cause.
3. **Review & Approve**: Review the structured diff, verify the test results, approve the change at the human gate, and commit with confidence.

### 5. Developer Testimonials & Reviews
- **Review 1 (Staff Backend Engineer)**: *"Bisect trimmed our regression triage from 3 hours to under 4 minutes. The container sandboxing gives us total peace of mind."*
- **Review 2 (Core OSS Maintainer)**: *"Finding the exact commit that broke upstream builds used to be a chore. Bisect automates the entire binary search and proposes exact patches."*
- **Review 3 (Lead Platform SRE)**: *"The human approval gate makes Bisect the only AI coding agent we trust in our deployment pipeline."*

### 6. Bottom CTA
- Clear call to action banner: `Ready to Supercharge Your Debugging Workflow?` with instant GitHub sign-in button.

### 7. Footer
- Links grouped into Product, Architecture, Community, and System Status.

## User Flows

### Flow 1: New Visitor Exploration & Sign-In
1. User arrives at `/`.
2. App checks `useAuth` state:
   - If not authenticated: renders the full landing page.
3. User reads hero headline and interacts with the simulated Live Cockpit Terminal.
4. User clicks `Sign in with GitHub` in the Navbar, Hero, or CTA banner.
5. User is redirected to GitHub OAuth authorization.
6. Upon successful callback (`/auth/callback`), session JWT is saved and user is automatically routed to `/workspace`.

### Flow 2: Returning Authenticated User
1. User arrives at `/`.
2. App checks `useAuth` state:
   - Authenticated user detected (`isAuthenticated === true`).
3. App displays loading skeleton and seamlessly redirects to `/workspace`.
4. User sees their active repositories, recent sessions, and agent cockpit.

## Naming Conventions & UI Glossary

| Concept | Label in UI | Purpose / Context |
| ------- | ----------- | ----------------- |
| Automated commit search | `Git Bisect Engine` | Explains how regressions are isolated |
| Sandboxed runtime | `Podman Sandbox` | Describes container isolation security |
| High-speed LLM | `Groq Acceleration` | Highlights ultra-fast inference speed |
| Manual safety check | `Human Approval Gate` | Describes safety barrier for agent actions |
| Live telemetry | `Execution Trace` | Real-time agent log & tool output feed |
| Patch inspection | `Diff Review Panel` | Visual comparison of proposed code fixes |

## Component Reuse Map

| Component | Used On | Variations |
| --------- | ------- | ---------- |
| `Header` / `LandingNavbar` | Landing page (`/`) & Workspace (`/workspace`) | Landing has anchor links & full GitHub CTA; Workspace has repo picker, user avatar, and logout |
| `ErrorBanner` | Landing error notifications & Workspace errors | Reused from `src/components/ui/ErrorState` |
| `AppProviders` | Root layout (`layout.tsx`) | Shared theme, query, and auth context |
