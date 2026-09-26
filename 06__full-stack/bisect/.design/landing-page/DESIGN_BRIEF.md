# Design Brief: Bisect Landing Page & Developer Cockpit Entry

## Problem

Software engineers waste hours manually isolating regressions, running git bisects across dozens of commits, and debugging CI failures. Existing AI tools often attempt code edits blindly without container isolation, risking local development environments or hallucinating broken fixes without running real test suites.

## Solution

Bisect is an intelligent developer cockpit and AI coding agent that automates regression localization, runs real test suites in secure Podman container sandboxes, leverages Groq for ultra-low latency reasoning, and enforces strict human-in-the-loop approval before executing code changes.

The landing page communicates this power immediately to any visiting developer:
- Introduces Bisect's core value proposition with crystal-clear developer-focused messaging.
- Anchors the experience with a dynamic, simulated **Live Cockpit Terminal** illustrating an automated git bisect session in action.
- Showcases the 5 core capabilities: Automated Bisecting, Groq Sub-Second Inference, Podman Container Sandbox, Human Safety Gates, and Real-Time Telemetry.
- Displays quantified impact metrics and role-based engineer reviews.
- Provides a seamless 1-click GitHub OAuth entry point directly into the authenticated `/workspace` developer cockpit.

## Experience Principles

1. **Proof Over Promises (Simulate the Reality)**: Don't just tell developers what Bisect does; show a live, high-fidelity simulation of the cockpit bisecting a regression in real time right inside the hero.
2. **Safety & Transparency First**: Highlight the human-in-the-loop approval gates and Podman container sandboxes so developers know their code and machines are completely secure.
3. **Zero-Friction Conversion**: Instant GitHub OAuth sign-in with instant transition to the `/workspace` cockpit.

## Aesthetic Direction

- **Philosophy**: **Functionalist Dark Cockpit (Dieter Rams + Modern Developer Tooling)**
  - Crisp dark slate surfaces (`#090d16`, `#0f172a`, `#1e293b`), vibrant electric blue accents (`#3b82f6`), emerald status indicators (`#10b981`), and amber warning/gate markers (`#f59e0b`).
  - Terminal-grade monospaced accents (`JetBrains Mono` / `font-mono`) paired with clean system sans-serif typography.
- **Tone**: Precise, authoritative, fast, secure, and developer-native.
- **Reference Points**: Linear, Vercel, Raycast, GitHub CLI, Warp.
- **Anti-References**: Generic SaaS marketing fluff, cartoonish illustrations, pastel gradients, or vague AI buzzwords without concrete terminal/code context.

## Existing Patterns & Reuse

- **Color System**: CSS variables defined in `frontend/src/app/globals.css`:
  - Background: `#090d16` (primary), `#0f172a` (card / secondary), `#1e293b` (tertiary / borders).
  - Accents: `#3b82f6` (blue primary), `#10b981` (success / passes), `#f59e0b` (safety gate / warning).
- **Icons**: `lucide-react` (GitHub, Terminal, ShieldCheck, Sparkles, GitCommit, Play, Cpu, CheckCircle2, ArrowRight, Star, Layers, etc.).
- **Auth Provider**: `useAuth` hook (`frontend/src/lib/auth/useAuth.ts`) for seamless 1-click GitHub OAuth triggering.

## Component Inventory

| Component | Status | Description |
| --------- | ------ | ----------- |
| `LandingNavbar` | New | Fixed top navigation with Bisect logo, section links (Features, How it works, Reviews), GitHub star indicator, and "Sign in with GitHub" CTA. |
| `HeroSection` | New | High-impact headline, sub-headline, primary & secondary action buttons, developer badge, and the interactive `HeroTerminal` preview. |
| `HeroTerminal` | New | Animated interactive simulated terminal demonstrating live git bisecting, commit analysis, Groq reasoning, and human approval prompt. |
| `FeatureGrid` | New | 6-card interactive capability grid with live tags, code snippets, and architecture badges. |
| `HowItWorksSection` | New | 3-step visual pipeline: 1. Connect Repo & Prompt → 2. Sandboxed Bisect & Test → 3. Verified Patch with Human Gate. |
| `MetricsBanner` | New | Quantified impact statistics (85% triage reduction, <2s Groq latency, 100% sandboxed Podman execution, 0 unapproved writes). |
| `TestimonialsSection` | New | 3 role-based developer quotes (Staff Engineer, Open Source Maintainer, Lead Platform SRE) with ratings and verification badges. |
| `CtaBanner` | New | High-conversion bottom banner inviting developers to connect their repositories with GitHub OAuth. |
| `LandingFooter` | New | Comprehensive footer with product links, architecture notes, GitHub link, and copyright. |
| `Home` (Page Router) | Modify | Updates `src/app/page.tsx` to render the rich Landing Page for unauthenticated visitors and seamlessly route authenticated users to `/workspace`. |

## Key Interactions

1. **Interactive Hero Terminal Playback**:
   - Users can watch the simulated bisect execution step through commit logs, or click "Replay" / step tabs to see specific agent actions (Bisecting, Testing, Gate approval).
2. **GitHub OAuth Sign-in**:
   - Clicking "Sign in with GitHub" triggers `login()` from `useAuth`, redirecting to GitHub OAuth and returning to `/workspace`.
3. **Smooth Scroll Navigation**:
   - Clicking Navbar links smoothly scrolls to `#features`, `#how-it-works`, and `#reviews`.
4. **Responsive Mobile Drawer**:
   - Full mobile navigation drawer for screens < 768px with full touch targets (>44px).

## Responsive Behavior

- **Desktop (≥1024px)**: 2-column Hero with side-by-side headline and interactive terminal; 3-column feature grid; 3-column review cards.
- **Tablet (768px - 1023px)**: Stacked Hero with full-width terminal; 2-column feature grid; 2-column reviews.
- **Mobile (<768px)**: Single-column stack, collapsible mobile nav drawer, optimized terminal view with horizontal scrolling for code diffs.

## Accessibility Requirements

- Color contrast ≥ 4.5:1 for all text against dark surfaces.
- Fully accessible keyboard focus rings (`focus:outline-none focus:ring-2 focus:ring-blue-500`).
- Semantic HTML tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`).
- ARIA labels on icon buttons and interactive controls.

## Out of Scope

- Billing / Pricing tiers (Bisect is open-source/developer workbench).
- Multi-tenant team management settings (handled in future workspace iterations).
- Third-party blog or CMS integrations.
