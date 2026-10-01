# Build Tasks: Hypervisor Monolith (Dark & Light Themes)

Generated from: `.design/theme-system/DESIGN_BRIEF.md`
Date: 2026-09-30

## Foundation
- [x] **Task 1: Integrate OKLCH Design Tokens in globals.css**: Apply the Hypervisor Monolith light/dark color variables, tiered obsidian surfaces, titanium light mode, and semantic status diode colors to `src/app/globals.css`. _Modifies: `src/app/globals.css`._
- [x] **Task 2: Create ThemeProvider and Theme Storage System**: Build `src/components/theme/theme-provider.tsx` to handle `light`, `dark`, and `system` modes with `localStorage` persistence, inline script to prevent hydration flash (FOUC), and React Context. _New component: `src/components/theme/theme-provider.tsx`._
- [x] **Task 3: Create ThemeToggle Component**: Build an accessible `ThemeToggle` (`src/components/theme/theme-toggle.tsx`) with Sun, Moon, and System icons, smooth animated transitions, and keyboard navigation. _New component: `src/components/theme/theme-toggle.tsx`._
- [x] **Task 4: Wire ThemeProvider into RootLayout**: Update `src/app/layout.tsx` to wrap children in `ThemeProvider` with `suppressHydrationWarning` on `<html>`. _Modifies: `src/app/layout.tsx`._

## Core UI & Component Refinement
- [x] **Task 5: Refine VM Status Badge & Diode System**: Update `src/components/vms/vm-status-badge.tsx` with high-contrast pill styling, glowing animated status diodes (Emerald, Amber, Rose, Cobalt, Slate), and accessible contrast for both dark and light modes. _Modifies: `src/components/vms/vm-status-badge.tsx`._
- [x] **Task 6: Refine Dashboard Header & Embed ThemeToggle**: Update `src/components/vms/vm-dashboard.tsx` to integrate `ThemeToggle`, refine the header branding badge (`vmsan` with Firecracker moniker), and polish button hover/active styles. _Modifies: `src/components/vms/vm-dashboard.tsx`._
- [x] **Task 7: Refine VMCard Surfaces & Metric Wells**: Update `src/components/vms/vm-card.tsx` with tiered obsidian/titanium card surfaces, subtle 1px border highlights, distinct metric wells (vCPUs, RAM, Runtime, Age), and refined action buttons. _Modifies: `src/components/vms/vm-card.tsx`._

## Detail Views & Terminal Console
- [x] **Task 8: Refine VM Detail View & Spec Cards**: Update `src/components/vms/vm-detail-view.tsx`, `vm-overview-card.tsx`, `vm-resources-card.tsx`, and `vm-network-card.tsx` to match the Hypervisor Monolith aesthetic across light and dark modes. _Modifies: `src/components/vms/vm-detail-view.tsx` and sub-cards._
- [x] **Task 9: Polish VM Interactive Terminal Theme**: Ensure `src/components/vms/vm-terminal.tsx` renders a sleek hypervisor console canvas with high-contrast monospace prompt, colored command output streams, and seamless theme integration. _Modifies: `src/components/vms/vm-terminal.tsx`._

## Verification & Polish
- [x] **Task 10: Unit & Integration Verification**: Run test suite (`pnpm test`) and typecheck (`pnpm typecheck`) to ensure all component and lifecycle tests pass without regressions.
- [x] **Task 11: Design Review**: Run `/design-review` with visual inspection and screenshots across light and dark modes.
