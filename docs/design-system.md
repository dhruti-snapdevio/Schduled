# Design System

This document defines the complete visual design and UI implementation for Schduled. Every screen, component, color, font, layout, and interaction pattern is specified here.

---

## Design Philosophy

Schduled's visual design follows four principles:

1. **Sharp and focused** — zero border radius everywhere; boxy, clean edges create a professional tool aesthetic rather than a consumer-soft look
2. **One accent color** — a single teal brand color with semantic reds and ambers; no decorative colors competing for attention
3. **Dark and light mode native** — both modes are designed from the start using OKLCH color tokens; switching is instant with no reflow
4. **Content over chrome** — the booking page and dashboard give maximum space to the user's data; the UI shell stays out of the way

---

## Tech Stack — UI Layer

| Tool | Version | Purpose |
|------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first styling — all layouts, spacing, colors via class names |
| **Shadcn/UI** | Latest (radix-lyra style) | Pre-built accessible component library on top of Radix UI primitives |
| **Radix UI** | 1.4.x | Headless accessible primitives (popover, dialog, dropdown, tabs, etc.) |
| **next-themes** | 0.4.x | Dark/light mode toggle — class-based, persisted to localStorage |
| **Phosphor Icons** | 2.1.x | Icon library — used for all navigation icons, action buttons, status indicators |
| **Geist Sans** | Variable | Primary UI font — all headings, labels, body text |
| **JetBrains Mono** | Variable | Monospace font — booking URLs, tokens, IDs, code-adjacent content |
| **Sonner** | 2.x | Toast notification library |
| **React Hook Form** | 7.x | All form state management |
| **Zod** | Latest | Client-side validation (mirrors server-side schemas) |
| **class-variance-authority** | 0.7.x | Variant management for component styles |
| **tailwind-merge** | 3.x | Safe class merging without conflicts |

**PostCSS config (no tailwind.config.ts):** Tailwind v4 uses PostCSS-only. All theme customization lives in `app/globals.css` via CSS custom properties — no separate config file needed.

**Shadcn setup (`components.json`):**

| Setting | Value |
|---------|-------|
| Style | `radix-lyra` |
| Base color | `neutral` |
| CSS variables | `true` |
| RSC | `true` |
| TSX | `true` |
| Icon library | `phosphor` |
| Utils alias | `@/lib/utils` |
| UI alias | `@/components/ui` |

---

## Color System

### Color Space: OKLCH

All colors use the **OKLCH color space** (`oklch(lightness saturation hue)`). OKLCH is perceptually uniform — the same hue step feels the same at any lightness level, which makes dark mode tokens consistent and predictable. Never hard-code hex values in components; always use CSS custom property tokens.

### Brand Color

| Name | OKLCH | Hex equivalent | Usage |
|------|-------|----------------|-------|
| Teal (primary) | `oklch(0.6 0.104 184.735)` | `#0d9488` | Primary buttons, active states, links, accents |
| Teal dark | `oklch(0.511 0.086 186.423)` | `#0f766e` | Hover state on primary; text on teal backgrounds |
| Teal light (dark mode) | `oklch(0.704 0.123 182.533)` | `#14b8a6` | Primary color in dark mode |

### CSS Custom Properties — Light Mode (`:root`)

All variables are defined in `app/globals.css` under `:root`:

| Variable | OKLCH Value | Description |
|----------|-------------|-------------|
| `--background` | `oklch(1 0 0)` | Page background — white |
| `--foreground` | `oklch(0.145 0 0)` | Default text — near black |
| `--card` | `oklch(1 0 0)` | Card background — white |
| `--card-foreground` | `oklch(0.145 0 0)` | Text on cards |
| `--popover` | `oklch(1 0 0)` | Popover/dropdown background |
| `--popover-foreground` | `oklch(0.145 0 0)` | Text in popovers |
| `--primary` | `oklch(0.6 0.104 184.735)` | Primary brand color — teal |
| `--primary-foreground` | `oklch(0.984 0.014 181.064)` | Text on primary backgrounds |
| `--secondary` | `oklch(0.967 0.001 286.375)` | Secondary surface — light gray |
| `--secondary-foreground` | `oklch(0.21 0.006 285.885)` | Text on secondary |
| `--muted` | `oklch(0.97 0 0)` | Subtle backgrounds — very light gray |
| `--muted-foreground` | `oklch(0.556 0 0)` | Placeholder text, captions |
| `--accent` | `oklch(0.6 0.104 184.735)` | Accent highlights — same as primary |
| `--accent-foreground` | `oklch(0.984 0.014 181.064)` | Text on accent |
| `--destructive` | `oklch(0.58 0.22 27)` | Error/danger — red |
| `--destructive-foreground` | `oklch(0.985 0 0)` | Text on destructive |
| `--border` | `oklch(0.922 0 0)` | All borders — light gray |
| `--input` | `oklch(0.922 0 0)` | Input field borders |
| `--ring` | `oklch(0.708 0 0)` | Focus ring |
| `--sidebar` | `oklch(0.985 0 0)` | Sidebar background — off-white |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | Sidebar text |
| `--sidebar-primary` | `oklch(0.6 0.104 184.735)` | Active sidebar item accent |
| `--sidebar-primary-foreground` | `oklch(0.984 0.014 181.064)` | Text on active sidebar item |
| `--sidebar-accent` | `oklch(0.97 0 0)` | Sidebar hover background |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | Text on sidebar hover |
| `--sidebar-border` | `oklch(0.922 0 0)` | Sidebar separator |
| `--sidebar-ring` | `oklch(0.708 0 0)` | Sidebar focus ring |
| `--radius` | `0` | Global border radius — zero (sharp edges everywhere) |

**Chart colors (for analytics, Phase 2):**

| Variable | OKLCH | Description |
|----------|-------|-------------|
| `--chart-1` | `oklch(0.855 0.125 181.107)` | Lightest teal |
| `--chart-2` | `oklch(0.785 0.133 181.944)` | Light teal |
| `--chart-3` | `oklch(0.704 0.123 182.533)` | Mid teal |
| `--chart-4` | `oklch(0.6 0.104 184.735)` | Primary teal |
| `--chart-5` | `oklch(0.511 0.086 186.423)` | Dark teal |

### CSS Custom Properties — Dark Mode (`.dark`)

Applied when the `<html>` element has class `dark` (toggled by next-themes):

| Variable | OKLCH Value | Description |
|----------|-------------|-------------|
| `--background` | `oklch(0.145 0 0)` | Very dark background |
| `--foreground` | `oklch(0.985 0 0)` | White text |
| `--card` | `oklch(0.205 0 0)` | Dark gray card surface |
| `--card-foreground` | `oklch(0.985 0 0)` | White text on cards |
| `--popover` | `oklch(0.205 0 0)` | Dark gray popovers |
| `--popover-foreground` | `oklch(0.985 0 0)` | White text in popovers |
| `--primary` | `oklch(0.704 0.123 182.533)` | Lighter teal for dark mode contrast |
| `--primary-foreground` | `oklch(0.277 0.045 192.556)` | Dark blue-green text on primary |
| `--secondary` | `oklch(0.274 0.006 286.033)` | Dark secondary surface |
| `--secondary-foreground` | `oklch(0.985 0 0)` | White on secondary |
| `--muted` | `oklch(0.269 0 0)` | Dark muted surface |
| `--muted-foreground` | `oklch(0.708 0 0)` | Medium gray placeholder text |
| `--accent` | `oklch(0.704 0.123 182.533)` | Lighter teal accent |
| `--accent-foreground` | `oklch(0.277 0.045 192.556)` | Dark text on accent |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Lighter red for dark mode |
| `--destructive-foreground` | `oklch(0.985 0 0)` | White on destructive |
| `--border` | `oklch(1 0 0 / 10%)` | White at 10% opacity |
| `--input` | `oklch(1 0 0 / 15%)` | White at 15% opacity |
| `--ring` | `oklch(0.556 0 0)` | Gray focus ring |
| `--sidebar` | `oklch(0.205 0 0)` | Dark sidebar |
| `--sidebar-foreground` | `oklch(0.985 0 0)` | White sidebar text |
| `--sidebar-primary` | `oklch(0.785 0.133 181.944)` | Medium teal active item |
| `--sidebar-primary-foreground` | `oklch(0.386 0.059 188.45)` | Dark text on active item |
| `--sidebar-accent` | `oklch(0.269 0 0)` | Dark hover state |
| `--sidebar-accent-foreground` | `oklch(0.985 0 0)` | White on hover |
| `--sidebar-border` | `oklch(1 0 0 / 10%)` | Subtle border |

### Semantic Color Usage Rules

| Situation | Token to use |
|-----------|-------------|
| Primary action button | `bg-primary text-primary-foreground` |
| Destructive action (delete, ban) | `bg-destructive text-destructive-foreground` |
| Disabled / placeholder text | `text-muted-foreground` |
| Page background | `bg-background` |
| Card surfaces | `bg-card` |
| Subtle section background | `bg-muted` |
| All borders | `border-border` |
| Warning state | Amber: `bg-amber-50 border-amber-200 text-amber-800` (light) / `bg-amber-900/20 border-amber-800 text-amber-200` (dark) |
| Success state | `text-green-600` (light) / `text-green-400` (dark) |
| Impersonation banner | Amber warning bar — same as warning state |

### Booking Page Custom Brand Color

The booking page applies the host's custom brand color as a CSS custom property override injected at the layout level. This replaces `--primary` only on public booking pages — the rest of the app keeps the default teal.

| Variable | Value | Scope |
|----------|-------|-------|
| `--booking-primary` | Host's `brandColor` hex (e.g., `#7c3aed`) | Injected on `app/(booking)/layout.tsx` only |

Applied to: primary CTA buttons ("Book" button), selected date highlight in calendar, active time slot highlight. Implemented as an inline `style` on the booking layout wrapper: `style={{ "--booking-primary": user.brandColor }}` — Tailwind classes on the booking page use `bg-[--booking-primary]` instead of `bg-primary`.

---

### Brand Colors for Email Templates

React Email templates cannot read CSS variables. Use these hardcoded hex values in email components only:

| Name | Hex | Usage |
|------|-----|-------|
| Teal primary | `#0d9488` | CTA buttons, header bar, brand accent |
| Teal dark | `#0f766e` | Hover color on CTA buttons |
| Teal tint background | `#f0fdfa` | Tinted info sections in emails |
| Teal tint border | `#99f6e4` | Border on tinted sections |

---

## Logo & Brand Identity

---

### Design Concept

The Schduled logo mark is a **calendar slot icon** — a square grid with one cell booked. It tells the product story at a glance: you pick a time, it gets confirmed. The design follows the same principles as the entire app:

- **Zero border radius** — every corner is a sharp right angle, no curves anywhere
- **One accent color** — teal `#0d9488` on a white/dark background, nothing else
- **Minimal geometry** — outer frame + header strip + 3×2 grid + one filled cell

```
┌─────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← teal header strip  #0d9488
├──────┬──────┬───┤
│      │      │   │
│      │  ▓▓  │   │  ← booked cell (teal fill)  #0d9488
│      │  ▓▓  │   │
├──────┼──────┼───┤
│      │      │   │
│      │      │   │
└──────┴──────┴───┘

Outer frame:    stroke #0d9488  (teal — frame is brand-colored)
Background:     white #ffffff  (light) / dark #171717  (dark mode)
Header strip:   fill  #0d9488
Grid lines:     stroke #e5e5e5 (light) / rgba(255,255,255,0.12) (dark)
Booked cell:    fill  #0d9488
All corners:    rx="0"  — no rounding anywhere
```

---

### Logo Mark SVG — Full Detail (32 × 32)

Use this as the base SVG. Scale up or down uniformly. Save as `public/logo-mark.svg`.

```svg
<svg width="32" height="32" viewBox="0 0 32 32" fill="none"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Outer frame -->
  <rect x="1" y="1" width="30" height="30"
        fill="white" stroke="#0d9488" stroke-width="1.5"/>

  <!-- Teal header strip -->
  <rect x="1" y="1" width="30" height="8" fill="#0d9488"/>

  <!-- Vertical grid dividers -->
  <line x1="11" y1="9"  x2="11" y2="31" stroke="#e5e5e5" stroke-width="1"/>
  <line x1="21" y1="9"  x2="21" y2="31" stroke="#e5e5e5" stroke-width="1"/>

  <!-- Horizontal grid divider -->
  <line x1="1"  y1="20" x2="31" y2="20" stroke="#e5e5e5" stroke-width="1"/>

  <!-- Booked cell (center-top cell) -->
  <rect x="13" y="11" width="6" height="7" fill="#0d9488"/>

</svg>
```

**Dark mode version** — swap inside `public/logo-mark-dark.svg`:
- `fill="white"` → `fill="#171717"`
- `stroke="#0d9488"` → `stroke="#14b8a6"`
- Header `fill="#0d9488"` → `fill="#14b8a6"`
- Grid stroke `#e5e5e5` → `rgba(255,255,255,0.12)`
- Booked cell `fill="#0d9488"` → `fill="#14b8a6"`

---

### Logo Mark SVG — Favicon (16 × 16)

At 16px the grid lines are too fine. Simplify to a solid teal square with 3 white dots representing slots.
Save as `public/favicon.svg` (and export to `favicon.ico`).

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Solid teal background -->
  <rect width="16" height="16" fill="#0d9488"/>

  <!-- White header line (top separator) -->
  <rect x="0" y="0" width="16" height="4" fill="#0b7a70"/>

  <!-- Three white slot dots -->
  <rect x="2"  y="7" width="3" height="3" fill="white" opacity="0.4"/>
  <rect x="6"  y="7" width="3" height="3" fill="white"/>
  <rect x="11" y="7" width="3" height="3" fill="white" opacity="0.4"/>

</svg>
```

The center dot is fully white (the booked slot). Outer dots are 40% white (available but not selected). This reads clearly at 16–32px.

---

### React Logo Component

File: `src/components/logo.tsx`

```tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizes = {
  sm: { icon: 16, text: 'text-sm'  },
  md: { icon: 20, text: 'text-base' },
  lg: { icon: 32, text: 'text-xl'  },
}

function LogoMark({ px }: { px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30"
            className="fill-background"
            stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="1" width="30" height="8" fill="currentColor"/>
      <line x1="11" y1="9"  x2="11" y2="31"
            className="stroke-border" strokeWidth="1"/>
      <line x1="21" y1="9"  x2="21" y2="31"
            className="stroke-border" strokeWidth="1"/>
      <line x1="1"  y1="20" x2="31" y2="20"
            className="stroke-border" strokeWidth="1"/>
      <rect x="13" y="11" width="6" height="7" fill="currentColor"/>
    </svg>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  href = '/',
  className,
}: LogoProps) {
  const { icon, text } = sizes[size]

  const inner = (
    <span className={cn('flex items-center gap-2 text-primary', className)}>
      {variant !== 'wordmark' && <LogoMark px={icon} />}
      {variant !== 'icon' && (
        <span className={cn(text, 'font-semibold tracking-tight text-foreground')}>
          <span className="text-primary">S</span>chedica
        </span>
      )}
    </span>
  )

  if (!href) return inner
  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {inner}
    </Link>
  )
}
```

**Usage:**

```tsx
<Logo />                              // full lockup, md size — nav bar
<Logo variant="icon" size="sm" />     // icon only, 16px — mobile / favicon context
<Logo variant="full" size="lg" />     // full lockup, large — auth pages
<Logo variant="wordmark" />           // text only — footer inline text
<Logo href={undefined} />             // no link wrapper — inside another <a>
```

The `text-primary` class on `currentColor` means the icon and the "S" automatically switch to `#0d9488` in light mode and `#14b8a6` in dark mode — no extra dark-mode handling needed.

---

### Wordmark Typography

| Property | Value |
|----------|-------|
| Font family | Geist Sans (`--font-sans`) |
| Font weight | 600 — semibold |
| Letter spacing | `tracking-tight` (−0.025 em) |
| Case | Sentence case — `Schduled` (never `SCHEDICA`) |
| First letter "S" | `text-primary` — teal, links it visually to the icon |
| Remaining letters | `text-foreground` — adapts to light/dark automatically |

---

### All Variants at a Glance

```
FULL (md) — dashboard nav, landing nav, admin top bar
┌────────┐
│▓▓▓▓▓▓▓▓│  Schduled
├──┬──┬──┤  ↑ "S" in teal, rest in foreground
│  │▓▓│  │
└──┴──┴──┘
icon: 20px  gap: 8px  text: text-base font-semibold

──────────────────────────────────────────────────

STACKED (lg) — auth pages, email header, onboarding
      ┌──────────┐
      │▓▓▓▓▓▓▓▓▓▓│
      ├───┬───┬──┤
      │   │▓▓▓│  │
      └───┴───┴──┘
         Schduled
  icon: 40px   text: text-xl  centered

──────────────────────────────────────────────────

ICON ONLY (sm) — favicon, collapsed mobile nav
  ┌──────┐
  │▓▓▓▓▓▓│
  ├─┬─┬──┤
  │ │▓│  │
  └─┴─┴──┘
  icon: 16–20px

──────────────────────────────────────────────────

WORDMARK ONLY — footer inline, print
  Schduled
  text-base font-semibold   "S" in teal
```

---

### Color Variants

| Context | Icon stroke + fills | "S" + wordmark |
|---------|---------------------|----------------|
| Light mode (default) | `#0d9488` teal | `#0d9488` + `#111111` |
| Dark mode | `#14b8a6` lighter teal | `#14b8a6` + `#fafafa` |
| On teal CTA banner | White (`#ffffff`) | White + white |
| Monochrome black (print) | `#111111` | `#111111` + `#111111` |
| Monochrome white (dark print) | `#ffffff` | `#ffffff` + `#ffffff` |

The React component handles light/dark automatically via `text-primary` and `text-foreground` CSS variables — no manual dark mode override needed.

---

### Favicon & App Icon Files

| File | Size | Notes |
|------|------|-------|
| `public/favicon.svg` | vector | Simplified 3-dot version (see SVG above) |
| `public/favicon.ico` | 16 + 32px | Export from `favicon.svg` |
| `public/apple-touch-icon.png` | 180 × 180px | Full mark on `#ffffff` background, 24px padding |
| `public/icon-192.png` | 192 × 192px | Full mark on `#0d9488` background, white icon fills |
| `public/icon-512.png` | 512 × 512px | Same as 192, high-res |

**`app/layout.tsx` metadata:**

```tsx
export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}
```

**`public/site.webmanifest`:**

```json
{
  "name": "Schduled",
  "short_name": "Schduled",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0d9488",
  "background_color": "#0d9488",
  "display": "standalone"
}
```

---

### Where Each Variant Is Used in the App

| Location | Variant | Size prop |
|----------|---------|-----------|
| Landing page nav (sticky header) | `full` | `md` |
| Dashboard top nav | `full` | `md` |
| Admin top bar | `full` | `md` |
| Auth page (above sign-in card) | `full` | `lg` stacked |
| Onboarding wizard card header | `full` | `lg` stacked |
| Mobile nav sheet (top) | `full` | `md` |
| Footer (left column) | `full` | `sm` |
| Email template header | `full` stacked, hardcoded SVG | — |
| Browser tab / favicon | `icon` simplified | 16px |
| `<title>` tag | wordmark text only | — |

---

### Minimum Sizes & Clear Space

| Variant | Minimum size |
|---------|-------------|
| Full horizontal lockup | Icon 16px — total ~110px wide |
| Icon only | 16px (UI) / 12px (favicon only) |
| Wordmark only | `text-sm` 14px — never smaller |

**Clear space:** Keep a margin equal to the icon height on all four sides. No text, border, or UI element inside that zone.

---

### Logo Rules — Never Do This

| Rule | What to avoid |
|------|--------------|
| No rounding | Never add `border-radius` or `rx` to any logo shape |
| No recoloring | Never use purple, blue, red, or any off-brand color |
| No gradient | The header fill is solid `#0d9488` — never a gradient |
| No drop shadow | No `filter: drop-shadow(...)` or `box-shadow` on the logo |
| No stretching | Always scale uniformly — never distort width or height independently |
| No outlined-only version | The mark is filled, not just a stroke outline |
| No all-caps wordmark | Always `Schduled`, never `SCHEDICA` |
| No font change | Wordmark is always Geist Sans 600 — never swap to another font |

---

## Typography

### Fonts

**Primary font — Geist Sans Variable**
- Package: `geist`
- CSS variable: `--font-sans`
- Weights available: 100–900
- Display: `swap`
- Use for: all headings, body text, labels, buttons, navigation, form fields
- Applied via class on `<html>`: `{fontSans.variable}`

**Monospace font — JetBrains Mono Variable**
- Package: `@fontsource-variable/jetbrains-mono`
- CSS variable: `--font-mono`
- Weights available: 100–800
- Display: `swap`
- Use for: booking page URLs, booking IDs, tokens, confirmation codes, any machine-readable string
- Applied via class on `<html>`: `{jetbrainsMono.variable} font-mono` (global base)

**Font loading in `app/layout.tsx`:** Both fonts loaded as Next.js local variable fonts. Applied to `<html>` element alongside `antialiased` class.

### Type Scale

All type uses Tailwind's default scale. Stick to these sizes for consistency:

| Use | Class | Size |
|-----|-------|------|
| Page title (h1) | `text-2xl font-bold tracking-tight` | 24px |
| Section heading (h2) | `text-xl font-semibold` | 20px |
| Card heading (h3) | `text-base font-semibold` | 16px |
| Body / default | `text-sm` | 14px |
| Caption / helper | `text-xs text-muted-foreground` | 12px |
| Stat number (large) | `text-3xl font-bold` | 30px |
| Navigation label | `text-sm font-medium` | 14px |
| Badge / tag | `text-xs font-medium` | 12px |

### Tracking

- Headings: `tracking-tight` — tightened letter spacing for display text
- Body: default tracking
- Uppercase labels: `tracking-wide` — slightly widened for readability

---

## Border Radius

**Global border radius: `0`** — all components have sharp, square corners.

`--radius: 0` in CSS. All Shadcn radius variants resolve to zero:
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` — all `0`

**Rule:** Never add `rounded-*` classes to any component. The only exception is avatar images which may use `rounded-full` for circular profile photos.

---

## Spacing & Layout

Use Tailwind's default spacing scale (multiples of 4px). Standard padding patterns:

| Container type | Padding |
|----------------|---------|
| Page outer | `px-4 sm:px-6 lg:px-8` |
| Card inner | `p-4` or `p-6` |
| Section gap | `gap-6` or `space-y-6` |
| Form field gap | `space-y-4` |
| Button icon gap | `gap-2` |
| Table cell | `px-4 py-3` |
| Nav item | `px-3 py-2` |

### Max Widths

| Area | Max width class |
|------|----------------|
| Landing page content | `max-w-6xl mx-auto` |
| Auth form | `max-w-md` |
| Dashboard content | Full width within layout shell |
| Admin content | Full width within sidebar layout |
| Booking page | `max-w-3xl mx-auto` |
| Settings form | `max-w-2xl` |

---

## Shadows & Elevation

Tailwind default shadows are used sparingly:

| Use | Class |
|-----|-------|
| Dropdown / popover | `shadow-md` |
| Dialog / modal | `shadow-xl` |
| Card (if elevated) | `shadow-sm` |
| Top nav (scroll) | `shadow-sm` |
| Default cards | No shadow (use border only) |

Cards primarily use border (`border border-border`) rather than shadow for separation — consistent with the sharp, flat aesthetic.

---

## Gradient System

Gradients are used **only on the landing page** for depth and visual polish. Never use gradients in the dashboard, admin panel, booking form, or settings pages — those use flat solid colors exclusively.

### Landing Page Gradients

| Name | CSS value | Where used |
|------|-----------|-----------|
| Hero radial glow | `radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.6 0.104 184.735 / 20%), transparent)` | `::before` pseudo-element on the hero section — subtle teal glow behind the hero illustration |
| Feature card sheen | `linear-gradient(135deg, transparent 40%, oklch(0.6 0.104 184.735 / 8%) 100%)` | Overlay on feature cards; drives the `schduled-sheen` animation |
| Section fade divider | `linear-gradient(to bottom, transparent, oklch(0.97 0 0 / 60%), transparent)` | Subtle vertical separator between landing page sections (light mode only) |

### Dark Mode Gradient Adjustments

In dark mode the hero glow and card sheen increase opacity to stay visible against the dark background:

| Gradient | Light mode opacity | Dark mode opacity |
|----------|--------------------|-------------------|
| Hero radial glow | `20%` | `35%` |
| Feature card sheen | `8%` | `14%` |

### CTA Banner — No Gradient

The full-width CTA section at the bottom of the landing page uses `bg-primary` solid teal — **no gradient**. The hard solid block is intentional and creates a strong visual stop.

### Email Header — No Gradient

Email template headers use a flat `#0d9488` background — no gradient. Email client support for CSS gradients is unreliable.

### Rules

- Never apply gradients to buttons, cards, inputs, or any component inside the app shell.
- Never use `bg-gradient-to-*` Tailwind classes outside of `app/(landing)/` files.
- Only apply gradients as decorative background layers (`::before`, `::after`, or a dedicated `<div aria-hidden>` overlay) — never as the primary background of an interactive element.

---

## Icons

**Library: Phosphor Icons** — `@phosphor-icons/react`

**Import for server components:** `@phosphor-icons/react/dist/ssr`
**Import for client components:** `@phosphor-icons/react`

**Default icon size:** 16px (`size={16}`) inline, 20px (`size={20}`) standalone
**Weight:** `regular` by default; `bold` for emphasis

### Icon Usage by Context

| Context | Icon | Phosphor name |
|---------|------|---------------|
| Dashboard / Home | Gauge | `GaugeIcon` |
| Event types | Calendar | `CalendarIcon` |
| Availability | Clock | `ClockIcon` |
| Bookings / Meetings | Handshake | `HandshakeIcon` |
| Booking page customization | Palette | `PaletteIcon` |
| Custom questions | Question | `QuestionIcon` |
| Calendar integrations | Plugs | `PlugsConnectedIcon` |
| Video conferencing | Video camera | `VideoCameraIcon` |
| Notifications | Bell | `BellIcon` |
| User profile | User | `UserIcon` |
| Settings | Gear | `GearIcon` |
| Sign out | Sign out | `SignOutIcon` |
| Admin panel | Shield | `ShieldIcon` |
| Audit log | Clock counter | `ClockCounterClockwiseIcon` |
| Users (admin) | Users | `UsersIcon` |
| Job queue | Queue | `QueueIcon` |
| Platform settings | Sliders | `SlidersIcon` |
| Zoom | Video camera | `VideoCameraIcon` |
| Google Meet | Video camera | `VideoCameraIcon` |
| Google Calendar | Google logo | `GoogleLogoIcon` |
| Outlook | Microsoft icon | `MicrosoftOutlookLogoIcon` |
| Copy to clipboard | Copy | `CopyIcon` |
| Open in new tab | ArrowSquareOut | `ArrowSquareOutIcon` |
| Email / send via email | Envelope | `EnvelopeIcon` |
| QR code | QrCode | `QrCodeIcon` |
| Delete / trash | Trash | `TrashIcon` |
| Edit / pencil | PencilSimple | `PencilSimpleIcon` |
| Add / plus | Plus | `PlusIcon` |
| Cancel / close | X | `XIcon` |
| Check / success | Check | `CheckIcon` |
| Warning | Warning | `WarningIcon` |
| Error | X circle | `XCircleIcon` |
| Info | Info | `InfoIcon` |
| Drag handle (reorder) | DotsSixVertical | `DotsSixVerticalIcon` |
| Booking link / share | Link | `LinkIcon` |
| Lock (cancelled policy) | Lock | `LockIcon` |
| Impersonate | Mask | `MaskIcon` |
| Ban user | Prohibit | `ProhibitIcon` |

---

## Interactive States

Every interactive element must have clearly styled hover, focus, active, and disabled states. These are defined here so all components behave consistently across the app.

### Button States

| State | Classes / behaviour |
|-------|-------------------|
| Default | `bg-primary text-primary-foreground` |
| Hover | `bg-primary/90` — 10% opacity reduction |
| Active (pressed) | `bg-primary/80 scale-[0.98]` — micro-press shrink |
| Focus | `ring-2 ring-ring ring-offset-2` — visible keyboard ring |
| Disabled | `opacity-50 cursor-not-allowed pointer-events-none` |
| Loading | Spinner (`size={14}`) left of text; button width unchanged |

The same pattern applies to destructive, outline, ghost, and secondary variants — only the base color differs.

### Input States

| State | Classes |
|-------|---------|
| Default | `border-input` |
| Focus | `border-primary ring-1 ring-primary/30` — teal border + soft ring |
| Error | `border-destructive ring-1 ring-destructive/30` — red border + ring |
| Success / Available | `border-green-500 ring-1 ring-green-500/30` — green border + ring |
| Disabled | `bg-muted opacity-60 cursor-not-allowed` |
| Read-only | `bg-muted cursor-default` — no ring on focus |
| Async checking (spinner) | `<Spinner size={14} />` absolutely positioned inside the right edge of the input |

### Card & List Row States

| Context | Hover / active state |
|---------|---------------------|
| Event type card | `hover:border-primary/40 hover:bg-accent/50` |
| Booking table row | `hover:bg-muted/50` |
| Admin table row | `hover:bg-muted/50 cursor-pointer` |
| Settings sidebar item | `hover:bg-accent hover:text-accent-foreground` |
| Settings sidebar active | `bg-accent text-accent-foreground border-l-2 border-primary` |
| Admin sidebar item | `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground` |
| Admin sidebar active | `bg-sidebar-primary text-sidebar-primary-foreground` |
| Dashboard top nav link | Active: `text-foreground font-medium`; Inactive: `text-muted-foreground hover:text-foreground` |

### Switch / Toggle States

| State | Track color |
|-------|------------|
| Off | `bg-input` — neutral gray |
| On | `bg-primary` — teal |
| On + hover | `bg-primary/90` |
| Disabled | `opacity-50 cursor-not-allowed` |

### Select / Dropdown States

| State | Classes |
|-------|---------|
| Trigger closed | Same as Input default |
| Trigger open | `border-primary ring-1 ring-primary/30` |
| Option hover | `bg-accent text-accent-foreground` |
| Option selected | `bg-primary/10 text-primary font-medium` |

### Time Slot States (Booking Page)

| State | Classes |
|-------|---------|
| Available | `border border-border bg-card hover:border-[--booking-primary] hover:bg-[--booking-primary]/10` |
| Selected | `bg-[--booking-primary] text-white border-[--booking-primary]` |
| Unavailable | `opacity-40 cursor-not-allowed bg-muted` |
| Loading | Replaced by `<Skeleton>` grid (6 items) |

### Calendar Date States (Booking Page)

| State | Classes |
|-------|---------|
| Available | `hover:bg-[--booking-primary]/15 cursor-pointer rounded-none` |
| Selected | `bg-[--booking-primary] text-white` |
| Today (unselected) | `ring-1 ring-[--booking-primary]/50` |
| Unavailable | `text-muted-foreground opacity-40 cursor-not-allowed` |
| Outside current month | `text-muted-foreground opacity-20` |

### Copy Button Feedback

The "Copy link" / "Copy booking URL" button shows a 2-second confirmation:

```
Default:   [CopyIcon]  Copy link
After click (2 s):   [CheckIcon text-green-600]  Copied!
Reverts automatically after 2 000 ms
```

---

## Dark Mode

### Implementation

- Package: `next-themes` v0.4.x
- Mode: class-based — adds/removes `.dark` class on `<html>` element
- Default theme: `light`
- System preference detection: **disabled** (`enableSystem: false`) — user explicitly chooses
- Transition on change: **disabled** (`disableTransitionOnChange: true`) — instant switch, no CSS transitions
- Storage: `next-themes` persists to `localStorage` automatically
- Keyboard shortcut: Press `D` to toggle between light and dark mode

### ThemeProvider Setup

`src/components/theme-provider.tsx` wraps `next-themes` ThemeProvider. Placed in the root layout wrapping all children. Applies `suppressHydrationWarning` to `<html>` to prevent SSR mismatch.

### Theme Toggle UI

A toggle button in the dashboard top navigation bar (and in the admin panel sidebar). Uses the sun icon for light mode, moon icon for dark mode. Shows current mode; clicking switches.

### Viewport Meta Theme Color

| Mode | Color |
|------|-------|
| Light | `#ffffff` |
| Dark | `#0a0a0a` |

These ensure the browser chrome (status bar on mobile, title bar on desktop) matches the app theme.

---

## Base Layer Styles (`app/globals.css`)

In `app/globals.css`, the `@layer base` block applies three rules globally: the `*` selector sets `border-border` and `outline-ring/50` so every element inherits the correct border color and focus ring by default; the `body` selector applies `bg-background text-foreground` so the themed background and text colors are always active; and the `html` element gets `font-mono` so JetBrains Mono is the root font globally — Geist Sans is applied to headings and UI text via component-level classes.

---

## Animation & Motion

### Custom Animations (CSS keyframes in `globals.css`)

| Class | Duration | Purpose | Used on |
|-------|----------|---------|---------|
| `schduled-float` | 6s ease infinite | Gentle vertical float | Landing page hero illustrations |
| `schduled-blink` | 1.1s step-end infinite | Cursor blink | Landing page animated elements |
| `schduled-reveal` | Scroll-triggered | Opacity + translateY reveal | Landing page sections |
| `schduled-ping` | 2.4s infinite | Pulsing ring on status dot | Connection status indicators |
| `schduled-sheen` | 5s linear infinite | Moving gradient sheen | Landing page feature cards |
| `nav-progress-bar` | Route change | Top bar scaleX progress | Next.js page transitions |

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce` — disable every keyframe animation when the user has set this system preference. This is non-negotiable for accessibility.

In `app/globals.css`, a `@media (prefers-reduced-motion: reduce)` block sets `animation: none` on all five animation classes (`schduled-float`, `schduled-blink`, `schduled-reveal`, `schduled-ping`, `schduled-sheen`). This disables every keyframe animation when the user has set the reduced-motion system preference.

### Transition Durations (App Shell)

Short, snappy transitions keep the app feeling responsive. These apply only to interactive state changes — not to page content.

| Element | Transition |
|---------|-----------|
| Button hover / active | `transition-colors duration-150` |
| Input focus ring | `transition-shadow duration-150` |
| Card hover border | `transition-colors duration-150` |
| Sidebar collapse expand | `transition-width duration-200 ease-in-out` |
| Sheet / drawer open | Radix default — slide-in 200ms ease |
| Dialog open | Radix default — fade + scale 150ms |
| Nav link active underline | `transition-colors duration-100` |
| Cookie banner enter | `transition-transform duration-400 ease-out` slide up from bottom |
| Toast enter/exit | Sonner built-in — slide + fade |
| Theme switch | **No transition** (`disableTransitionOnChange: true`) — instant |

---

## Loading States

### Page-Level Skeleton Rule

Never show a blank white/dark screen while data loads. Always render the page shell (header, nav, page title) immediately, then show skeletons where content will appear.

### Skeleton Patterns per Screen

| Screen | Skeleton layout |
|--------|----------------|
| Dashboard — stats row | 3 × `h-24 w-full` card skeletons side by side |
| Dashboard — bookings table | 5 × `h-14 w-full` row skeletons |
| Event types list | 3 × `h-20 w-full` card skeletons |
| Settings — profile | `h-16 w-16 rounded-full` avatar + 4 × `h-9 w-full` field skeletons |
| Booking page — calendar | `h-64 w-full` single calendar skeleton |
| Booking page — time slots | 6 × `h-10 w-full` slot skeletons in a 2-col grid |
| Admin users table | 10 × `h-12 w-full` row skeletons |
| Admin audit log | 8 × `h-12 w-full` row skeletons |

Skeleton base class: `<Skeleton className="..." />` renders `bg-muted animate-pulse` — no extra Tailwind needed.

### Spinner Usage Contexts

`<Spinner />` (inline animated circle) is used for:

| Context | Placement | Size |
|---------|-----------|------|
| Button loading state | Inside button, left of text label | 14px |
| Username availability check | Absolutely inside the right edge of the input | 14px |
| Page-level async fetch (no skeleton available) | Centered in the content area | 24px |
| Video link generating (booking confirmation) | Next to "Generating video link…" text | 16px |

### Nav Progress Bar

`<NavProgress />` renders a fixed 2px teal bar at the very top of the viewport during Next.js route transitions:
- Color: `bg-primary`
- Animates: `scaleX` from `0` → `1`, `transform-origin: left`
- Fades out on completion
- Always present in `(app)` and `(admin)` layouts, above the sticky header

---

## Form Validation States

All forms use **React Hook Form + Zod**. Validation messages render below the relevant input, linked via `aria-describedby`.

### Error State

```
Email address
┌──────────────────────────────────────┐  ← border-destructive ring-1 ring-destructive/30
│ user@                                │
└──────────────────────────────────────┘
✕  Please enter a valid email address    ← text-destructive text-xs mt-1
```

### Available / Success State (e.g. username check)

```
Username
┌────────────────────────────────── ✓ ─┐  ← border-green-500 ring-1 ring-green-500/30
│ john-smith                           │     CheckIcon inside input (right edge)
└──────────────────────────────────────┘
✓  Available                             ← text-green-600 text-xs mt-1
```

### Checking State (async validation debounced 400ms)

```
Username
┌────────────────────────────────── ⟳ ─┐  ← border-input (neutral — not yet resolved)
│ john-smith                           │     Spinner inside input (right edge)
└──────────────────────────────────────┘
   Checking availability…               ← text-muted-foreground text-xs mt-1
```

### Warning Block (username change / destructive notice)

```
┌──────────────────────────────────────────────────┐
│ ⚠  Changing your username will break any links   │  bg-amber-50 border border-amber-200
│    you have already shared. A redirect from      │  text-amber-800 text-xs p-3 mt-2
│    your old URL stays active for 30 days.        │
└──────────────────────────────────────────────────┘
```

### Password Strength Indicator (Sign Up)

Four-segment bar rendered directly below the password input:

```
[████░░░░]  text-destructive  → Weak
[████████░░░░]  text-amber-500  → Fair
[████████████░░░░]  text-yellow-500  → Good
[████████████████]  text-green-600  → Strong
```

Each segment: `h-1 flex-1 rounded-none`. Filled segments colored, empty segments `bg-muted`. Label appears right-aligned below the bar as `text-xs`.

---

## Accessibility

| Rule | Implementation |
|------|---------------|
| Focus rings | `outline-ring/50` on all interactive elements via base layer |
| Keyboard nav | All Radix UI primitives support full keyboard navigation |
| Screen readers | `aria-label`, `aria-describedby`, `sr-only` on all icon-only buttons |
| Color contrast | OKLCH tokens chosen for WCAG AA contrast in both light and dark |
| Reduced motion | All animations disabled via media query |
| Touch targets | Minimum 44×44px on mobile for all interactive elements |
| Error messages | Form errors associated to inputs via `aria-describedby` |
| Semantic HTML | `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>` used correctly |
| Dialogs | Radix `Dialog` and `AlertDialog` — focus trap, `Escape` to close, scroll lock |

---

## Responsive Breakpoints

Tailwind default breakpoints:

| Breakpoint | Min width | Usage |
|-----------|-----------|-------|
| `sm` | 640px | Small tablets, large phones |
| `md` | 768px | Tablets, where desktop nav appears |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Standard desktops |
| `2xl` | 1536px | Wide screens |

**Key responsive rules:**
- Desktop navigation: `hidden md:flex` (hidden on mobile, flex on md+)
- Mobile navigation: `flex md:hidden` (shown on mobile, hidden on md+)
- Sidebar (admin): collapsible on desktop, hidden on mobile (sheet triggered by hamburger)
- Booking page: single-column on mobile, two-column (calendar + form) on md+
- Dashboard cards: single-column on mobile, grid on sm+

---

## Empty State Designs

All empty states use the `<Empty>` component. Layout: `flex flex-col items-center gap-3 py-16 text-center`. Structure: large icon (Phosphor, 48px, `text-muted-foreground/50`) → heading → description → optional CTA.

```
                    [Icon 48px]
              text-muted-foreground/50

           No event types yet
           text-base font-semibold

   Create your first event type to start
   accepting bookings.
   text-sm text-muted-foreground max-w-xs

          [ New event type ]
          primary button mt-4
```

### Empty State Specs per Screen

| Screen | Icon | Heading | Description | CTA |
|--------|------|---------|-------------|-----|
| Event types | `CalendarIcon` | "No event types yet" | "Create your first event type to start accepting bookings." | "New event type" (primary) |
| Bookings — Upcoming | `HandshakeIcon` | "No upcoming bookings" | "Share your booking link to start accepting meetings." | "Copy booking link" (outline) |
| Bookings — Past | `ClockIcon` | "No past bookings" | "Completed meetings will appear here." | — |
| Bookings — Cancelled | `XCircleIcon` | "No cancelled bookings" | — | — |
| Availability overrides | `CalendarPlusIcon` | "No date overrides" | "Block specific days or set custom hours for exceptions." | "Add override" (outline) |
| Admin users (filtered, 0 results) | `UsersIcon` | "No users found" | "Try a different search term or clear the filter." | — |
| Admin jobs (empty) | `QueueIcon` | "No jobs in queue" | "All background tasks have completed successfully." | — |
| Admin audit log (filtered, 0 results) | `ClockCounterClockwiseIcon` | "No audit events" | "Events matching your filters will appear here." | — |
| Contacts list (Phase 2) | `AddressBookIcon` | "No contacts yet" | "Invitees who book with you will appear here." | — |

---

## Toast Notification Patterns

All transient feedback uses **Sonner** toasts via `import { toast } from 'sonner'`. Never use `alert()`, inline status `<div>`s, or custom notification components for transient messages.

### Sonner Configuration (`app/layout.tsx`)

```tsx
<Toaster
  position="bottom-right"
  toastOptions={{
    classNames: {
      toast: 'rounded-none border border-border bg-background text-foreground shadow-md',
      title: 'text-sm font-medium',
      description: 'text-xs text-muted-foreground',
      actionButton: 'bg-primary text-primary-foreground text-xs',
      cancelButton: 'bg-muted text-muted-foreground text-xs',
    },
  }}
  richColors
/>
```

`rounded-none` enforces the global zero-radius rule. `richColors` provides semantic color coding automatically.

### Toast Copy Patterns

| Trigger | Type | Title | Description |
|---------|------|-------|-------------|
| Settings saved | success | "Changes saved" | — |
| Link copied | success | "Copied to clipboard" | — |
| Calendar connected | success | "Calendar connected" | "Google Calendar is now synced." |
| Calendar disconnected | success | "Calendar disconnected" | — |
| API / server error | error | "Something went wrong" | "Please try again. If this continues, contact support." |
| Validation error (form) | error | Field-specific message | — |
| Booking cancelled | success | "Booking cancelled" | "A confirmation has been sent to the invitee." |
| Email sent | success | "Email sent" | — |
| Username taken | error | "Username unavailable" | "Please choose a different username." |
| Video link failed | error | "Video link failed" | "We'll retry automatically. You'll be notified if it fails permanently." |

### Duration Rules

| Type | Duration |
|------|----------|
| Success | 3 000 ms |
| Error | 5 000 ms — longer so the user can read it |
| Info | 3 000 ms |
| Promise toast | Dismisses on resolve / reject |

### Promise Toast Pattern (async actions)

```tsx
toast.promise(saveSettings(), {
  loading: 'Saving…',
  success: 'Settings saved',
  error: 'Failed to save. Please try again.',
})
```

Use `toast.promise` for: saving settings, connecting calendar, uploading avatar, generating QR code, revoking sessions.

---

## Route Groups & Layouts

Schduled uses **five Next.js App Router route groups**, each with its own layout component:

### 1. Landing Layout — `(landing)`

**Routes:** `/`, `/pricing` *(Post-MVP — Phase 2)*, `/features` *(Post-MVP — Phase 2)*

**Structure:**
```
<div className="flex min-h-svh flex-col">
  <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
    <!-- Logo + nav links + auth buttons -->
  </header>
  <main className="flex-1">
    {children}
  </main>
  <footer className="border-t bg-muted/40">
    <!-- Brand, links, legal -->
  </footer>
</div>
```

**Header contents:**
- Logo + "Schduled" wordmark (left)
- Desktop nav links: Features, Pricing *(Post-MVP — Phase 2)*
- Right side: "Log in" (ghost button) + "Sign up" (primary button) when unauthenticated
- Right side: "Go to Dashboard" (primary button) when authenticated
- Mobile: hamburger icon → sheet with nav + auth links

**Footer contents:**
- Left: Logo + tagline + contact email
- Right: Navigation links (Features, Docs), Legal links (Terms, Privacy, Cookie Policy)
- Open source notice: "Schduled is open source"

**Backdrop blur on header:** `bg-background/95 backdrop-blur` — the header is 95% opaque with a blur so content scrolling behind it looks clean.

---

### 2. Auth Layout — `(auth)`

**Routes:** `/sign-in`, `/sign-up`, `/forgot-password`, `/verify-email`, `/reset-password`

**Structure:**
```
<div className="flex min-h-svh items-center justify-center bg-background p-4">
  <div className="w-full max-w-md space-y-6">
    <div className="text-center">
      <Logo image (centered)>
      <h1 className="text-2xl font-bold tracking-tight">
      <p className="text-sm text-muted-foreground">Tagline or instruction</p>
    </div>
    {children}  <!-- The actual form card -->
  </div>
</div>
```

**Key traits:**
- Fully centered — both vertically and horizontally
- Max width 448px (max-w-md)
- No header, no footer, no sidebar
- Logo above the form for brand presence
- `robots: { index: false }` — auth pages excluded from search indexing

**Auth form card (`<Card>`):**
- `p-6 space-y-4`
- Inputs: email, password, confirm password
- Primary "Sign in" / "Sign up" button (full width)
- Divider with "or" for OAuth
- "Continue with Google" button (outline, full width)
- Footer link: "Don't have an account? Sign up" / "Already have an account? Log in"

---

### 3. Dashboard Layout — `(app)`

**Routes:** `/dashboard`, `/dashboard/event-types`, `/dashboard/availability`, `/dashboard/integrations`, `/dashboard/bookings`, `/dashboard/settings`, etc.

**Structure:**
```
<div className="min-h-screen bg-background">
  <NavProgress />                       {/* Top progress bar on page transitions */}
  <header className="sticky top-0 z-40 border-b bg-background">
    <div className="h-14 flex items-center px-4 gap-4">
      Logo + "Schduled" wordmark (left)
      <Desktop Nav links> (hidden on mobile)
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle>
        <UserMenu>
      </div>
      <MobileMenuButton> (md:hidden)
    </div>
  </header>
  <Sheet>  {/* Mobile nav drawer */}
    User info + nav items + sign out
  </Sheet>
  <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
    {children}
  </main>
</div>
```

**Desktop navigation items (in header, horizontal):**

| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/dashboard` | `GaugeIcon` |
| Event Types | `/dashboard/event-types` | `CalendarIcon` |
| Availability | `/dashboard/availability` | `ClockIcon` |
| Bookings | `/dashboard/bookings` | `HandshakeIcon` |
| Settings | `/dashboard/settings` | `GearIcon` |

**User menu (dropdown):**
- User's name + email (header row, non-clickable)
- Profile (link to `/dashboard/settings/profile`)
- Integrations (link to `/dashboard/settings/integrations`)
- Separator
- Theme toggle (light/dark switch inline in menu)
- Sign out button

**Impersonation warning bar:** When an admin is impersonating a user, a full-width amber banner appears between the header and main content:
- "You are impersonating [name] — [Stop impersonating]" link
- `bg-amber-50 border-b border-amber-200 text-amber-800` (light) / dark equivalent
- Always visible, non-dismissible while impersonating

---

### 4. Public Booking Layout — `(booking)`

**Routes:** `/[username]`, `/[username]/[eventSlug]`, `/booking/[token]/reschedule`, `/booking/[token]/cancel`

**Structure:**
```
<div className="min-h-screen bg-muted/30">
  {children}  <!-- No header or footer by default on booking pages -->
</div>
```

The booking page is invitee-facing and intentionally minimal — no Schduled navigation chrome. The booking page component itself provides the layout:

**Host profile page (`/[username]`):**
- Centered card layout, max-width 640px
- Host photo + name + bio + timezone
- Grid of event type cards below

**Booking page (`/[username]/[eventSlug]`):**
- Two-column layout on md+: left = host info + calendar + slot grid; right = booking form
- Single column on mobile (calendar first, then form)
- Host's brand color applied to: CTA buttons, selected date highlights, active time slot
- "Powered by Schduled" NOT shown (open source)
- Minimal footer: host's booking link only

**Confirmation screen (post-booking):**
- Replaces booking form area with confirmation content
- Large green checkmark icon (animated)
- Meeting summary (both timezones)
- Add to Calendar buttons (Google Calendar, iCal/Outlook, Office 365)
- Reschedule + Cancel links (text links, muted style)
- Custom message from host (if set)

---

### 5. Admin Layout — `(admin)`

**Routes:** `/admin`, `/admin/audit-log`, `/admin/users`, `/admin/users/[id]`, `/admin/jobs`, `/admin/settings`

**Structure:**
```
<SidebarProvider>
  <div className="flex h-screen">
    <AdminSidebar />         {/* Left sidebar — collapsible */}
    <div className="flex-1 flex flex-col overflow-hidden">
      <AdminTopBar />         {/* Slim top bar with user info + theme toggle */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  </div>
</SidebarProvider>
```

**Admin sidebar navigation:**

| Section | Label | Route | Icon |
|---------|-------|-------|------|
| Main | Dashboard | `/admin` | `GaugeIcon` |
| Main | Audit Log | `/admin/audit-log` | `ClockCounterClockwiseIcon` |
| Main | Users | `/admin/users` | `UsersIcon` |
| Main | Jobs | `/admin/jobs` | `QueueIcon` |
| Main | Settings | `/admin/settings` | `SlidersIcon` |

**Sidebar features:**
- Width: 16rem (full) / 3rem (icon-only collapsed)
- Keyboard shortcut: `Ctrl+B` to toggle collapse
- Collapsed state persists via localStorage
- Active route highlighted with `bg-sidebar-primary text-sidebar-primary-foreground`
- Icon + label when expanded; icon only when collapsed (with tooltip showing label)

**Admin top bar:**
- "Logged in as [admin name]" (left)
- Theme toggle + Sign out button (right)

---

## UI Components Reference

All components live in `src/components/ui/`. Use Shadcn CLI to add new components. Never edit primitive files unless customizing the design token behavior.

### Core Component List

| Component | File | Primary Usage |
|-----------|------|--------------|
| `Button` | `button.tsx` | All actions — primary, outline, ghost, destructive variants |
| `Input` | `input.tsx` | All text inputs — height 8 (32px), border-radius 0 |
| `Textarea` | `textarea.tsx` | Multi-line inputs |
| `Label` | `label.tsx` | All form labels |
| `Form` | `form.tsx` | React Hook Form integration with validation messages |
| `Select` | `select.tsx` | Dropdown select (Radix) |
| `Combobox` | `combobox.tsx` | Searchable dropdown |
| `Checkbox` | `checkbox.tsx` | Boolean toggles in forms |
| `Switch` | `switch.tsx` | On/off toggles (event type active, availability override) |
| `RadioGroup` | `radio-group.tsx` | Single-choice groups |
| `Tabs` | `tabs.tsx` | Tabbed content (event type builder panels) |
| `Card` | `card.tsx` | All content cards — no radius, border only |
| `Dialog` | `dialog.tsx` | Modal dialogs (confirmation, form overlays) |
| `AlertDialog` | `alert-dialog.tsx` | Destructive confirmations (delete, ban) |
| `Sheet` | `sheet.tsx` | Side sheet (mobile nav, booking detail) |
| `Popover` | `popover.tsx` | Date picker overlay, small context menus |
| `DropdownMenu` | `dropdown-menu.tsx` | User menu, action menus on table rows |
| `Tooltip` | `tooltip.tsx` | Hover hints on icon buttons |
| `Badge` | `badge.tsx` | Status labels (active, inactive, pending, failed) |
| `Avatar` | `avatar.tsx` | User profile photos with fallback initials |
| `Table` | `table.tsx` | Data tables (bookings list, users list, jobs list) |
| `DataTable` | `data-table.tsx` | Sortable/filterable data tables |
| `Pagination` | `pagination.tsx` | Table pagination controls |
| `Separator` | `separator.tsx` | Dividers between sections |
| `Skeleton` | `skeleton.tsx` | Loading placeholders |
| `Spinner` | `spinner.tsx` | Inline loading indicator |
| `Progress` | `progress.tsx` | Upload/step progress bars |
| `Sonner (Toaster)` | `sonner.tsx` | Toast notifications |
| `ScrollArea` | `scroll-area.tsx` | Custom scrollable containers |
| `Breadcrumb` | `breadcrumb.tsx` | Admin sub-page breadcrumbs |
| `PageHeader` | `page-header.tsx` | Page title + description header |
| `Stat` | `stat.tsx` | Dashboard stat cards (users, bookings, jobs) |
| `Empty` | `empty.tsx` | Empty state with icon + message + CTA |
| `Sidebar` | `sidebar.tsx` | Admin panel sidebar (collapsible, icon mode) |
| `Kbd` | `kbd.tsx` | Keyboard shortcut display (e.g., "Ctrl+B") |
| `InputOTP` | `input-otp.tsx` | Email verification code input |

### Button Variants

| Variant | Class | Usage |
|---------|-------|-------|
| `default` | Teal background + white text | Primary actions (Save, Book, Connect) |
| `destructive` | Red background + white text | Delete, Ban, Cancel booking |
| `outline` | White background + border | Secondary actions (Cancel dialog, Edit) |
| `secondary` | Muted background | Tertiary actions |
| `ghost` | No background | Icon buttons, nav items |
| `link` | No background + underline | In-text links |

### Button Sizes

| Size | Usage |
|------|-------|
| `default` | Standard form buttons, CTAs |
| `sm` | Compact actions in table rows |
| `lg` | Hero CTAs on landing page |
| `icon` | Square icon-only buttons (24×24) |
| `icon-sm` | Small icon buttons in data tables |

### Badge Variants (for booking/job status)

| Status | Variant | Color meaning |
|--------|---------|--------------|
| Active / Confirmed | `default` | Teal |
| Inactive / Cancelled | `secondary` | Gray |
| Failed / Error | `destructive` | Red |
| Pending / Queued | `outline` | Bordered |

---

## Screen-by-Screen UI Spec

### Landing Page — `/`

**Sections (top to bottom):**

1. **Hero** — Full-viewport-height section. Left: H1 headline ("Schedule smarter, not harder"), subheadline, primary CTA ("Get started free") + secondary link ("See how it works"). Right: animated product screenshot or illustration (`schduled-float` animation).

2. **Social proof** — One-line strip: "Join [X] hosts already using Schduled" + logos or avatar stack.

3. **Features grid** — 3-column grid (1-col mobile, 3-col md+). Each card: icon (Phosphor, 32px), feature name, 1-2 sentence description. Features: Dual-timezone display, PostgreSQL-backed booking engine, Open source + self-host.

4. **How it works** — 3-step numbered list with brief descriptions and screenshots.

5. **Comparison table** — Schduled vs. Calendly vs. Cal.com. Columns for key differentiators. Schduled column highlighted.

6. **CTA banner** — Full-width teal section. "Start scheduling for free" headline + "Sign up" button (white on teal).

7. **Footer** — As described in landing layout.

---

### Sign Up — `/sign-up`

Form fields: Full name, Email, Password (with strength indicator), Confirm password. Primary button: "Create account". Divider "or". "Continue with Google" (outline button with Google logo). Footer link: "Already have an account? Sign in."

Email verification step (shown after signup): "Check your inbox" with animated envelope icon, instruction to click verification link, "Resend email" link.

---

### Onboarding Wizard — `/onboarding`

Shown once to every new user after email verification is complete. Cannot be fully skipped — Step 2 (Calendar) has a "Skip for now" option; all other steps are required.

**Page wrapper:**
```
min-h-screen bg-muted/30 flex items-center justify-center p-4
```

**Card layout:**
```
<Card className="w-full max-w-lg p-8 space-y-6">
  <StepIndicator />          ← step dots + progress bar
  <div>
    <h2>Step heading</h2>
    <p className="text-sm text-muted-foreground">Instruction text</p>
  </div>
  {/* Step content area */}
  <div className="flex justify-between pt-4 border-t border-border">
    <Button variant="ghost">← Back</Button>
    <div className="flex gap-2">
      {canSkip && <Button variant="outline">Skip for now</Button>}
      <Button>Continue →</Button>
    </div>
  </div>
</Card>
```

**Step indicator (top of card):**

```
Step 2 of 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← bg-primary progress bar (40% filled)

[●]──────[●]──────[ ]──────[ ]──────[ ]
Profile  Calendar Timezone  Event   Share
```

| Dot state | Classes |
|-----------|---------|
| Completed | `bg-primary` filled circle + `bg-primary` connecting line |
| Current | `bg-background ring-2 ring-primary ring-offset-2` — white fill, teal ring |
| Upcoming | `bg-muted border-2 border-muted-foreground/20` |

**Step specs:**

| Step | Heading | Key content |
|------|---------|-------------|
| 1 — Profile | "Set up your profile" | Full name input, avatar upload (click circle to upload), username / booking URL slug with real-time availability check |
| 2 — Calendar | "Connect your calendar" | Google Calendar card + Outlook card (each: logo, label, "Connect" outline button). "Skip for now" link below cards. |
| 3 — Timezone | "Confirm your timezone" | Auto-detected timezone shown in a `<Select>` with a `GlobeIcon`. "We auto-detected this from your browser — change it if needed." |
| 4 — Event type | "Create your first event type" | Name input, duration selector (15 / 30 / 60 min), location type selector. Minimal — full builder is in dashboard. |
| 5 — Share | "You're all set!" | Animated large `CheckCircleIcon` with `schduled-ping` ring in teal. Booking URL in read-only monospace box. Copy button + Open button. "Go to dashboard" primary button. |

**Step 5 — Completion screen detail:**

```
            ◎  (CheckCircleIcon 64px, text-primary, schduled-ping ring)

         You're all set!
    text-2xl font-bold tracking-tight

  Your booking page is live at:
┌──────────────────────────────────────────┐
│ schduled.com/your-username     [Copy] [↗]│   font-mono text-sm bg-muted
└──────────────────────────────────────────┘

          [Go to dashboard →]
             primary button
```

---

### Dashboard Home — `/dashboard`

**Page header:** "Good morning, [name]" + current date

**Stats row (3 cards):**
- Total bookings this month (with vs. last month delta)
- Upcoming bookings (next 7 days count)
- Event types active

**Upcoming bookings table:** Next 5 bookings — date/time, invitee name, event type, video link button. "View all bookings" link to `/dashboard/bookings`.

**Quick links row:** "Create event type" button + "Share booking page" button (copies URL).

---

### Event Types — `/dashboard/event-types`

**Page header:** "Event Types" + "New event type" primary button (top right)

**Event type list:** Cards (or list rows), each showing:
- Color swatch + event type name
- Duration (e.g., "30 min")
- Booking URL (monospace font, truncated)
- Active/Inactive badge
- Actions: Edit (pencil icon), Copy link (link icon), Toggle active (switch), More (dropdown with Clone, Delete)

**Empty state:** `<Empty>` component — calendar icon, "No event types yet", "Create your first event type" CTA button.

---

### Event Type Builder — `/dashboard/event-types/new` and `/dashboard/event-types/[id]/edit`

**Tabbed layout** — Shadcn `<Tabs>` with these tabs:
1. **General** — Name, Description, Duration (select or custom), URL slug, Color picker, Status toggle
2. **Availability** — Availability schedule assignment, booking window, min notice, buffer before/after, daily limit, start time increment
3. **Location** — Location type selector (Zoom, Google Meet, Phone, In-person, Custom). Provider-specific sub-fields shown based on selection.
4. **Questions** — Drag-and-drop list of custom questions. "Add question" button.
5. **Notifications** — Toggle: send confirmation to invitee, send notification to host. Custom confirmation message field.
6. **Cancellation** — Policy text field. Enforce within X hours toggle.

**Save bar:** Sticky bottom bar with "Save changes" (primary) + "Discard" (ghost) buttons — only visible when there are unsaved changes.

---

### Availability Management — `/dashboard/availability`

**Weekly schedule grid:** 7 rows (Mon–Sun), each row: day label + toggle switch + time range inputs (start / end) + "Add interval" for multiple windows. Times shown in host's timezone.

**Date overrides section:** "Add date override" button opens a popover with a date picker. Override list shows each override date, custom hours or "unavailable" badge, remove button.

**Schedule name:** Editable at top of page (for multi-schedule Phase 2).

---

### Calendar Integrations — `/dashboard/settings/integrations`

**Two cards (Google, Outlook):** Each card shows provider logo, connection status (connected / not connected badge), "Connect" or "Disconnect" button, connected account email (when connected).

**Primary calendar selector:** Dropdown to choose which connected calendar to write new bookings to.

**Calendar list (when connected):** Which calendars from the provider to check for availability conflicts (checkboxes per calendar).

---

### Meetings Dashboard — `/dashboard/bookings`

**Tabs:** Upcoming | Past | Cancelled

**Booking list table:** Date/time, Invitee name + email, Event type, Location (video link icon), Status badge, Actions (View, Cancel/Reschedule).

**Booking detail view (sheet or modal):** Full booking details — invitee info, form answers, video link, calendar event link, audit trail (created/rescheduled/cancelled events).

---

### Settings — `/dashboard/settings`

**Layout:** Persistent left sidebar (same `<DashboardLayout>` shell) with 8 sections listed below. Clicking a section replaces the right-hand content area; the selected item gets the active sidebar state (teal left border, `bg-accent` background).

**Settings sidebar sections:**

| Section | Route |
|---------|-------|
| Profile | `/dashboard/settings/profile` |
| Branding | `/dashboard/settings/branding` |
| My Link | `/dashboard/settings/my-link` |
| Communication | `/dashboard/settings/communication` |
| Login preferences | `/dashboard/settings/login` |
| Contacts settings | `/dashboard/settings/contacts` |
| Security | `/dashboard/settings/security` |
| Cookie settings | `/dashboard/settings/cookies` |

Danger Zone (account deletion) sits at the bottom of the Security page, separated by a red-tinted `<Card>` with a red destructive button.

---

**Profile — `/dashboard/settings/profile`**

`max-w-2xl` form: avatar upload (click to replace, circular crop), display name, job title, company, bio *(Post-MVP — Phase 2)*, website *(Post-MVP — Phase 2)*, timezone selector. Single "Save changes" primary button at bottom.

---

**Branding — `/dashboard/settings/branding`**

Logo upload (square, max 2 MB), brand colour picker (colour swatch + hex input), custom confirmation message textarea. Changes reflected live in a small booking-page preview card on the right. "Save changes" primary button.

---

**My Link — `/dashboard/settings/my-link`**

Three stacked `<Card>` components:

**Card 1 — Your booking URL:**
- Full URL displayed in a read-only input-style box: `schduled.com/[username]`
- Three icon buttons to the right of the box: Copy (`CopyIcon`), Open in new tab (`ArrowSquareOutIcon`), Share via email (`EnvelopeIcon`)
- Copy button label changes to "Copied!" for 2 seconds after click

**Card 2 — QR code:**
- QR code image centred in the card, generated from the booking URL
- "Download QR code" ghost button below — saves as `schduled-[username]-qr.png`

**Card 3 — Change username:**
- Label: "Username" with current value shown above the input
- Input field with real-time availability indicator (spinner → green "✓ Available" or red "✗ Already taken")
- Helper text: "schduled.com/[typed-value]" shown live below the input
- Warning text block (amber, `WarningIcon`): "Changing your username will break any links you have already shared. A redirect from your old URL will stay active for 30 days."
- "Save username" primary button — disabled until a valid, available, changed username is entered

---

**Communication — `/dashboard/settings/communication`**

Toggle list: one row per notification event (New booking, Cancellation, Reschedule, Reminder confirmation). Each row: label + description + `<Switch>`. "Save preferences" button at bottom.

---

**Login preferences — `/dashboard/settings/login`**

Connected methods table: one row per auth method (Google OAuth, Email + password, Magic link). Each row shows the method name, email or "always available" note, and a Connect/Disconnect button where applicable. Magic link row has no action button. "Add password" flow for OAuth-only accounts shows an inline form with new password + confirm fields.

---

**Contacts settings — `/dashboard/settings/contacts`**

Auto-save toggle: `<Switch>` with label "Automatically save new contacts when someone books with me" (default on). Below: excluded domains input (tag-style multi-value input for domain entries). "Save" button. *(Phase 2 contacts list view at `/dashboard/contacts`.)*

---

**Security — `/dashboard/settings/security`**

Password change form (current password, new password, confirm). Active sessions list (device, IP, last active, Revoke button per row). 2FA section *(Post-MVP — Phase 2)*. Danger Zone card at the very bottom (red `<Card>` border): "Delete account" destructive button opens a confirmation dialog.

---

**Cookie settings — `/dashboard/settings/cookies`**

Three toggle rows: Necessary (always on, toggle disabled), Analytics, Marketing. Description under each explains what it controls. "Save preferences" button. Preferences stored in `localStorage` under `cookie-consent`.

---

### Admin Dashboard — `/admin`

**3 stat cards (full-width row):**
- Total users (count from users table)
- Active bookings (confirmed, future start time)
- Failed jobs — last 24h (count from pgboss.job)

Each stat card uses the `<Stat>` component: large number, label, optional delta or sub-label.

---

### Admin Audit Log — `/admin/audit-log`

**Filters row:** Action type dropdown + Actor type (Admin/User) + Date range picker + Search input (actor email or entity ID). "Reset filters" ghost button.

**Table:** Actor (email + role badge), Action (monospace badge), Target (entity ID, truncated), IP address, Timestamp (relative + absolute on hover).

**Row detail:** Clicking any row opens a sheet showing full JSON payload with before/after values (syntax-highlighted using `bg-muted` pre block with `font-mono`).

**Pagination:** 50 rows per page, `<Pagination>` component at bottom.

---

### Admin Users — `/admin/users`

**Search + filter bar:** Text input (search by name or email) + status filter (All / Active / Banned).

**Users table:** Name + avatar, Email, Created at, Status badge (Active / Banned), Bookings count, Actions (View button).

**User detail — `/admin/users/[id]`:**

Sections using `<Card>` components stacked vertically:
- Profile (name, email, username, timezone, created date)
- Account status (active/banned badge, email verified badge)
- Active sessions (device, IP, last active, Revoke button per row)
- Connected calendars (provider + account email per row)
- Email history (last 10 emails — type, status, sent at timestamp)
- Actions (Ban/Unban button, Revoke all sessions, Send password reset, Impersonate)

---

### Admin Job Queue — `/admin/jobs`

**3 stat cards (top row):** Pending jobs, Active jobs, Failed jobs (last 24h).

**Job table:** Job name (monospace badge), State badge (pending/running/failed), Created at, Started at, Completed/Failed at, Retry count. Filters: State + Date range.

**Failed job detail (sheet on row click):** Error message, original payload JSON (`font-mono` pre block), retry count, last attempted at.

---

### Admin Platform Settings — `/admin/settings`

**Single form with 4 settings:**
- Allow new signups — `<Switch>` toggle
- Email sender name — `<Input>` text field
- Max bookings per invitee per day — `<Input>` number field
- Platform maintenance message — `<Textarea>` (shown as banner when set)

"Save settings" primary button. Shows a success toast on save.

---

## Booking Page Design (Public — Invitee Facing)

The public booking page is the most-seen UI in Schduled. Design must be polished and distraction-free.

### Brand Color Application

The host's brand color (`user.brandColor`, hex) replaces the default teal on booking pages:
- CTA buttons ("Book" button, "Confirm booking" button)
- Selected date highlight in the calendar
- Active time slot highlight
- Progress indicator (if multi-step form)
- The color is applied via a CSS custom property injected server-side: `--booking-primary: {host.brandColor}`

### Calendar Component

- Month/week grid showing available dates (full color) vs. unavailable (muted/strikethrough)
- Today's date highlighted with a subtle ring
- Selected date highlighted with `bg-[--booking-primary]`
- Month navigation with left/right chevron buttons
- Timezone label shown below calendar (host's timezone)

### Time Slot Grid

- Grid of available time slots for the selected date
- Each slot: `HH:MM AM/PM TIMEZONE` label
- Selected slot: `bg-[--booking-primary] text-white`
- Unselected slot: `border border-border hover:border-primary`
- "No available times" empty state if no slots on selected day

### Booking Form

- Invitee name (required)
- Invitee email (required)
- Custom questions (if any) — rendered dynamically from event type config
- "Add guests" collapsible section (if host enabled it)
- "Book" primary button (uses brand color)
- Cancellation policy notice (if set) shown as small text above the button

### Multi-step Booking Flow

If the event type has multiple durations, the flow adds a duration-picker step before the calendar. The URL stays at `/{username}/{eventSlug}` throughout — steps are client-side state, not separate routes.

**Step progression:**

```
Step 1 (multi-duration only):   Duration picker
         ↓
Step 2:  Calendar date selection + timezone selector
         ↓
Step 3:  Time slot selection (for selected date)
         ↓
Step 4:  Booking form (name, email, custom questions)
         ↓
Step 5:  Confirmation screen (replaces the form area)
```

**Step 1 — Duration picker (multi-duration only):**

```
┌─────────────────────────────────────────────┐
│  How long do you need?                       │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  15 minutes  │  │  30 minutes  │  ...    │
│  │  Quick sync  │  │  Standard    │         │
│  └──────────────┘  └──────────────┘         │
│  Each option: border card, hover teal ring  │
│  Selected: bg-[--booking-primary] text-white│
└─────────────────────────────────────────────┘
```

**Back navigation:** Every step shows a `←` icon button (ghost, no label) in the top-left of the booking card to go back one step. Step 1 / single-duration: no back button.

**Step indicator (optional — only when multi-duration is active):**

A minimal `1 · 2 · 3` dot row at the top of the card. Current step dot is `bg-[--booking-primary]`; completed steps are `bg-[--booking-primary]/30`; future steps are `bg-muted`.

### Confirmation Screen

```
         ✓  (CheckCircleIcon 56px, text-green-500, animate schduled-ping ring)

        You're scheduled!
        text-2xl font-bold

┌──────────────────────────────────────────────┐
│  Event type name                             │  Card with border, no shadow
│  ──────────────────                          │
│  📅  Thu, 15 Jan 2026 · 3:00 PM IST          │  invitee timezone
│      (10:00 AM EST — host's time)            │  text-muted-foreground text-sm
│  ⏱   30 minutes                              │
│  📹  [Join Zoom meeting →]                   │  outline button, brand color border
└──────────────────────────────────────────────┘

  [ + Google Calendar ]  [ + iCal/Outlook ]  [ + Office 365 ]
    outline sm buttons, gap-2

  Reschedule · Cancel     ← ghost text links, text-muted-foreground text-sm

┌──────────────────────────────────────────────┐
│  Looking forward to meeting you!             │  Host's custom message card
│  — Host name                                 │  bg-muted p-4 text-sm
└──────────────────────────────────────────────┘
```

---

## Cookie Consent Banner

Shown on first visit to any public page (landing, booking page). Stored in `localStorage` under `cookie-consent`. Not shown in the dashboard or admin — consent is managed under Settings → Cookie settings for authenticated users.

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│  We use cookies to improve your experience.  [Learn more]  │  fixed bottom-0 full-width
│                                    [Manage]  [Accept All]  │  bg-background border-t
│                                                             │  border-border shadow-md z-50
└────────────────────────────────────────────────────────────┘
```

**Classes:** `fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border shadow-md`

**Inner layout:** `max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`

**Buttons:**
- "Accept All" — `<Button size="sm">` (primary teal)
- "Manage" — `<Button variant="outline" size="sm">` (opens `/dashboard/settings/cookies` or a cookie modal if unauthenticated)
- "Learn more" — `<Button variant="link" size="sm">` (links to `/cookies`)

**Entrance animation:** slides up from `translateY(100%)` to `translateY(0)` over 400ms with `ease-out`, after a 600ms delay on first load. Respects `prefers-reduced-motion`.

---

## Error Pages

### 404 — Not Found (`app/not-found.tsx`)

```
min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4

  404
  text-8xl font-bold text-muted-foreground/20 select-none

  Page not found
  text-2xl font-bold tracking-tight

  The page you're looking for doesn't exist or has been moved.
  text-sm text-muted-foreground max-w-sm

  [ ← Go back ]   [ Go home ]
  outline button   primary button
  flex gap-3
```

### 500 — Server Error (`app/error.tsx`)

Same layout as 404 but:
- Large text: `"500"`
- Heading: `"Something went wrong"`
- Description: `"Try refreshing the page. If the problem continues, contact support."`
- Single primary button: `"Refresh page"` — `onClick={() => window.location.reload()}`

### Maintenance Banner

When `platform_settings.maintenanceMessage` is non-empty, a full-width amber bar renders above the sticky header on every page (`z-60`):

```
┌────────────────────────────────────────────────────────────┐
│ ⚠  Scheduled maintenance — service may be interrupted.    │  bg-amber-50 border-b
│    Expected downtime: 2:00–4:00 AM UTC.  [Learn more →]   │  border-amber-200 text-amber-800
└────────────────────────────────────────────────────────────┘
px-4 py-2 text-sm text-center
```

### Booking — Host Not Found (`/[username]` — unknown username)

```
Centered card max-w-sm:

  [UserIcon 48px text-muted-foreground/50]

  This booking page doesn't exist
  text-base font-semibold

  The link may be incorrect or this account has been removed.
  text-sm text-muted-foreground

  [ Back to Schduled ]  ← link button → /
```

---

## Email Templates (React Email)

React Email components live in `src/lib/email/`. These are rendered server-side to HTML by Nodemailer.

**All emails share:**
- Header bar in the host's brand color (or default teal `#0d9488` if not set)
- Host logo or profile photo in header
- Consistent footer: host reply-to email, unsubscribe link, no "Powered by Schduled" branding
- Both timezones shown in every meeting time display (invitee time + host time)

**Email types and template files:**

| Template | Trigger |
|----------|---------|
| `booking-confirmed-invitee.tsx` | New booking — sent to invitee |
| `booking-confirmed-host.tsx` | New booking — sent to host |
| `booking-reminder.tsx` | 24h and 1h reminders (same template, parameterized) |
| `booking-cancelled-invitee.tsx` | Booking cancelled — sent to invitee |
| `booking-cancelled-host.tsx` | Booking cancelled — sent to host |
| `booking-rescheduled-invitee.tsx` | Rescheduling — sent to invitee |
| `booking-rescheduled-host.tsx` | Rescheduling — sent to host |
| `magic-link.tsx` | Email sign-in magic link |
| `password-reset.tsx` | Password reset link |
| `email-verification.tsx` | Email verification on signup |

**Email design tokens (hardcoded hex — no CSS variables in email):**

| Token | Value | Usage |
|-------|-------|-------|
| Primary / brand | `#0d9488` | CTA button background, header bar |
| Primary hover | `#0f766e` | Button hover state |
| Tint background | `#f0fdfa` | Info section background |
| Tint border | `#99f6e4` | Border on info sections |
| Body text | `#111827` | Main text color |
| Muted text | `#6b7280` | Secondary text, captions |
| Background | `#ffffff` | Email background |
| Card background | `#f9fafb` | Section card background |
| Border | `#e5e7eb` | Dividers, borders |

---

## Utility Function

`src/lib/utils.ts` — always import the `cn()` helper for merging Tailwind classes:

- `cn(...classNames)` — combines `clsx` + `tailwind-merge` to safely merge class lists without conflicts
- Used in every component to handle conditional class names
- Never use string concatenation for Tailwind classes — always use `cn()`

---

## File Locations

| Item | Path |
|------|------|
| Global CSS + tokens | `app/globals.css` |
| Theme provider | `src/components/theme-provider.tsx` |
| Shadcn UI components | `src/components/ui/` |
| App-level components | `src/components/` |
| Email templates | `src/lib/email/` |
| Utility (cn helper) | `src/lib/utils.ts` |
| Landing layout | `app/(landing)/layout.tsx` |
| Auth layout | `app/(auth)/layout.tsx` |
| Dashboard layout | `app/(app)/layout.tsx` |
| Booking layout | `app/(booking)/layout.tsx` |
| Admin layout | `app/(admin)/layout.tsx` |
| Dashboard shell component | `src/components/layouts/dashboard-layout.tsx` |
| Admin shell component | `src/components/layouts/admin-layout.tsx` |

---

## Do / Do Not

| Do | Do Not |
|----|--------|
| Use `cn()` for all class merging | Concatenate Tailwind strings with `+` |
| Use CSS tokens (`bg-primary`, `text-muted-foreground`) | Hard-code `bg-[#0d9488]` in components (email templates are the only exception) |
| Use `rounded-none` or omit radius classes | Add `rounded-*` to any component except `Avatar` |
| Use Phosphor icons from `@phosphor-icons/react/dist/ssr` in server components | Mix icon libraries (no Heroicons, Lucide, etc.) |
| Use `<AlertDialog>` for destructive confirmations | Use `confirm()` or inline warnings for delete/ban actions |
| Use Sonner `toast.promise()` for async operations | Use custom alert divs or inline status for transient messages |
| Always render the page shell + skeletons while data loads | Show a blank white / dark screen during loading |
| Use `<Empty>` component for zero-state screens | Render `null` or nothing when a list is empty |
| Apply `transition-colors duration-150` on all hover state changes | Leave interactive elements with no hover feedback |
| Use `schduled-ping` animation only on status indicator dots | Apply pulsing rings to buttons or cards |
| Use gradients **only** inside `app/(landing)/` files | Apply gradients to dashboard, admin, or booking form elements |
| Use `toast.promise` for save / connect / upload actions | Leave async actions with no loading feedback |
| Add `aria-label` to every icon-only button | Ship icon-only buttons without a screen reader label |
| Show both timezones (invitee + host) on every booking time display | Show only one timezone anywhere in the booking flow |
| Use `bg-[--booking-primary]` on booking page CTA and selected states | Use `bg-primary` on the public booking page (it ignores the host's brand color) |
| Test every screen in both light and dark mode | Assume light mode only |
| Disable animations for `prefers-reduced-motion` | Add animations without reduced-motion fallbacks |
| Verify WCAG AA contrast for any custom brand color on booking pages | Trust that any brand color the host picks will be readable |
