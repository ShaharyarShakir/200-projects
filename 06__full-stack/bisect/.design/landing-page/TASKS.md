# Build Tasks: Bisect Landing Page & Developer Cockpit Entry

Generated from: .design/landing-page/DESIGN_BRIEF.md
Date: 2026-09-26

## Foundation & Navigation
- [x] **Task 1: Landing Navbar Component (`LandingNavbar.tsx`)**: Build sticky navigation with Bisect logo, status indicator, anchor links (#features, #how-it-works, #reviews), mobile menu drawer toggle, and "Sign in with GitHub" CTA. _New component._
- [x] **Task 2: Hero Section & Interactive Cockpit Terminal (`HeroSection.tsx`, `HeroTerminal.tsx`)**: Build the primary hero fold with pill badge, value proposition headline, primary/secondary action buttons, and an interactive simulated terminal demonstrating live git bisect playback across commits, sandbox test execution, Groq reasoning, and human approval gates. _New components._

## Core Showcase Sections
- [x] **Task 3: Metrics & Proof Banner (`MetricsBanner.tsx`)**: Build the 4-column KPI strip highlighting 85% triage time reduction, <2s Groq latency, 100% container isolation, and 0 unapproved writes. _New component._
- [x] **Task 4: Feature Matrix Grid (`FeatureGrid.tsx`)**: Build the 6-card interactive capability grid with terminal icons, feature tags, and architectural highlights. _New component._
- [x] **Task 5: How It Works Visual Pipeline (`HowItWorksSection.tsx`)**: Build the 3-step workflow pipeline (Connect Repo → Sandboxed Bisect & Test → Verified Patch Approval). _New component._

## Social Proof & Conversion
- [x] **Task 6: Developer Testimonials & Reviews (`TestimonialsSection.tsx`)**: Build the 3-column role-based review cards (Staff Backend Engineer, OSS Maintainer, Platform SRE) with star ratings and verified developer badges. _New component._
- [x] **Task 7: CTA Banner & Comprehensive Footer (`CtaBanner.tsx`, `LandingFooter.tsx`)**: Build the conversion CTA banner and bottom navigation with links, system operational status, and GitHub repo badge. _New components._

## Page Integration & Verification
- [x] **Task 8: Landing Page Assembly & Auth Redirection (`page.tsx`)**: Assemble the full landing page on `/`, preserving instant redirect to `/workspace` when authenticated. _Modifies `src/app/page.tsx`._
- [x] **Task 9: Automated Unit & Component Tests (`landing.test.tsx`)**: Write unit and integration tests verifying rendering, anchor navigation, hero terminal interactions, and GitHub OAuth sign-in triggers. _New test file in `src/test/`._
- [x] **Task 10: Build & Typecheck Verification**: Run `pnpm test` and `pnpm build` to verify clean compilation with zero TypeScript or styling regressions.

## Review
- [ ] **Design Review**: Run /design-review against the brief.
