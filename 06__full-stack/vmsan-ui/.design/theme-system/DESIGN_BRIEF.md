# Design Brief: Hypervisor Monolith (Dark & Light Themes)

## Problem

Cloud engineers, DevOps practitioners, and systems administrators managing microVMs often face either generic, washed-out SaaS dashboards with flat, uninspired gray palettes or overly complex, clunky legacy interfaces. They need an interface that gives them immediate situational awareness, rich telemetry clarity, and effortless visual hierarchy across both low-light terminal/NOC environments and bright daytime workspaces—without feeling like a direct clone of AWS, DigitalOcean, or Incus.

## Solution

The "Hypervisor Monolith" design system introduces a tailored dual-theme architecture for `vmsan-ui`:
- **Dark Theme (Tiered Obsidian & Cobalt)**: An ultra-clean, layered obsidian slate environment (`#090d16` base, `#111827` cards) with precision 1px borders, subtle luminance elevation, deep contrast, vibrant cobalt action points, and jewel-toned status indicators that feel like modern server telemetry.
- **Light Theme (Refined Cool Titanium & Ink)**: A crisp, distraction-free daylight environment (`#f8fafc` backdrop, `#ffffff` card surfaces, `#e2e8f0` structural borders) with high-contrast slate-ink typography, razor-sharp data tables, and electric cobalt primary accents.
- Seamless, zero-flicker theme switching with system preference detection and keyboard-accessible toggle controls.

## Experience Principles

1. **Telemetry Clarity over Decorative Noise** — Status, uptime, vCPUs, RAM, and terminal streams must be instantly legible through high-contrast typography, monospace metric values, and distinct diode glows.
2. **Layered Elevation over Harsh Flatness** — Surfaces communicate hierarchy through subtle background stepping and translucent borders (10% alpha in dark, clean slate in light) rather than heavy drop shadows.
3. **Engineered Precision over Generic Polish** — Evoke the speed and bare-metal reliability of Firecracker microVMs with technical geometry, crisp pill badges, and predictable interactive states.

## Aesthetic Direction

- **Philosophy**: *Hypervisor Monolith* — A synthesis of bare-metal hypervisor precision (Incus/Proxmox telemetry), modern developer platform polish (Fly.io/Linear depth), and cloud console clarity (DigitalOcean/AWS).
- **Tone**: Technical, authoritative, responsive, high-density, confident.
- **Reference points**:
  - Fly.io & Linear (deep layered dark backgrounds, crisp borders, illuminated status accents)
  - DigitalOcean & AWS Console (structured cloud resource cards, clear action buttons, accessible high-contrast light mode)
  - Incus / Proxmox (bare-metal metric clarity, monospace data alignment)
- **Anti-references**:
  - Generic template bootstrap dashboards
  - Pure `#000000` pitch-black dark modes that cause halation and eye strain
  - Blinding pure `#ffffff` flat light modes with zero structural borders
  - Direct 1:1 carbon copies of AWS or DigitalOcean palettes

## Existing Patterns

- **Typography**: `Geist Sans` for structural UI / headings, `Geist Mono` for VM IDs, resource metrics, memory, and terminal logs.
- **Color System**: Tailwind CSS v4 `@theme inline` with CSS variables in OKLCH color space (`src/app/globals.css`).
- **Icons**: `lucide-react` icons sized consistently (3.5 / 4 / 5 scale).
- **Base Components**: Base UI / shadcn style primitives (`button`, `card`, `badge`, `dialog`, `input`).

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| `globals.css` (Tokens) | Modify | Define rich OKLCH palettes for both `:root` (Light) and `.dark` (Dark) with semantic color tokens. |
| `theme-provider.tsx` | New | Client provider managing theme state (`light`, `dark`, `system`), syncing with `localStorage` and `html` class without SSR flash. |
| `theme-toggle.tsx` | New | Accessible button / dropdown switch in header with Sun, Moon, and System icons. |
| `src/app/layout.tsx` | Modify | Wrap root in `ThemeProvider` and support suppressHydrationWarning / dark class bootstrap. |
| `vm-dashboard.tsx` | Modify | Header layout updated to accommodate theme toggle and refined top bar hierarchy. |
| `vm-status-badge.tsx` | Modify | Refined jewel-toned LED diodes and high-contrast pill styling across both themes. |
| `vm-card.tsx` | Modify | Subtle tiered card backgrounds, metric pill styling, and hover/active states. |
| `vm-detail-view.tsx` | Modify | Consistent theme tokens applied to spec cards, metadata, and detail actions. |
| `vm-terminal.tsx` | Modify | Integrated dark/light terminal canvas adhering to hypervisor color tokens. |

## Key Interactions

1. **Theme Switching**:
   - User clicks the theme switcher in the top navigation.
   - Smooth, instant transition without layout shift or transition flashes.
   - Preference is persisted in `localStorage` (`theme` key: `dark` | `light` | `system`).
   - Default setting respects OS `prefers-color-scheme`.
2. **Card Hover & Focus**:
   - Subtle border highlight (`border-primary/40` or `border-foreground/20`) and slight surface tint change.
3. **Status Pulse**:
   - "Running" VM badge features a subtle animated emerald glow dot; "Starting"/"Stopping" pulses in amber/blue; "Error" indicates crisp rose.
4. **Action Triggers (Start / Stop / Delete)**:
   - Destructive actions retain clear rose/red warning accents; primary actions maintain high-contrast cobalt styling.

## Responsive Behavior

- **Desktop (1024px+)**: Full multi-column grid for VM cards, spacious header with breadcrumbs, actions, and theme toggle.
- **Tablet (768px - 1023px)**: 2-column VM card layout, compact header controls.
- **Mobile (< 768px)**: 1-column stacked VM cards, full-width action buttons in card footers, compact theme icon in header.

## Accessibility Requirements

- **Contrast Ratios**: WCAG AA compliance (4.5:1 for normal text, 3:1 for large text and UI components) across all light and dark tokens.
- **Focus Rings**: High-visibility focus indicators (`ring-2 ring-ring/80 ring-offset-2 ring-offset-background`) for keyboard navigation.
- **Reduced Motion**: Respect `prefers-reduced-motion` by disabling pulse animations on status diodes.
- **Screen Readers**: Theme toggle properly labeled with `aria-label="Toggle theme"` and dynamic `aria-expanded` / `aria-checked` states.

## Out of Scope

- User authentication / multi-tenant profile settings.
- Custom user-defined color themes (only Dark, Light, and System are supported).
- Re-architecting VM lifecycle APIs or backend communication protocols.
