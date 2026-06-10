# Design System

This document defines the complete visual design and UI implementation for Schedica. Every screen, component, color, font, layout, and interaction pattern is specified here. All decisions are adopted from the Krova reference implementation and adapted for Schedica's scheduling context.

---

## Design Philosophy

Schedica's visual design follows four principles:

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
| `schedica-float` | 6s ease infinite | Gentle vertical float | Landing page hero illustrations |
| `schedica-blink` | 1.1s step-end infinite | Cursor blink | Landing page animated elements |
| `schedica-reveal` | Scroll-triggered | Opacity + translateY reveal | Landing page sections |
| `schedica-ping` | 2.4s infinite | Pulsing ring on status dot | Connection status indicators |
| `schedica-sheen` | 5s linear infinite | Moving gradient sheen | Landing page feature cards |
| `nav-progress-bar` | Route change | Top bar scaleX progress | Next.js page transitions |

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce` — disable every keyframe animation when the user has set this system preference. This is non-negotiable for accessibility.

In `app/globals.css`, a `@media (prefers-reduced-motion: reduce)` block sets `animation: none` on all five animation classes (`schedica-float`, `schedica-blink`, `schedica-reveal`, `schedica-ping`, `schedica-sheen`). This disables every keyframe animation when the user has set the reduced-motion system preference.

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

## Route Groups & Layouts

Schedica uses **five Next.js App Router route groups**, each with its own layout component:

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
- Logo + "Schedica" wordmark (left)
- Desktop nav links: Features, Pricing *(Post-MVP — Phase 2)*
- Right side: "Log in" (ghost button) + "Sign up" (primary button) when unauthenticated
- Right side: "Go to Dashboard" (primary button) when authenticated
- Mobile: hamburger icon → sheet with nav + auth links

**Footer contents:**
- Left: Logo + tagline + contact email
- Right: Navigation links (Features, Docs), Legal links (Terms, Privacy, Cookie Policy)
- Open source notice: "Schedica is open source"

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
      Logo + "Schedica" wordmark (left)
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

The booking page is invitee-facing and intentionally minimal — no Schedica navigation chrome. The booking page component itself provides the layout:

**Host profile page (`/[username]`):**
- Centered card layout, max-width 640px
- Host photo + name + bio + timezone
- Grid of event type cards below

**Booking page (`/[username]/[eventSlug]`):**
- Two-column layout on md+: left = host info + calendar + slot grid; right = booking form
- Single column on mobile (calendar first, then form)
- Host's brand color applied to: CTA buttons, selected date highlights, active time slot
- "Powered by Schedica" NOT shown (open source)
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

1. **Hero** — Full-viewport-height section. Left: H1 headline ("Schedule smarter, not harder"), subheadline, primary CTA ("Get started free") + secondary link ("See how it works"). Right: animated product screenshot or illustration (`schedica-float` animation).

2. **Social proof** — One-line strip: "Join [X] hosts already using Schedica" + logos or avatar stack.

3. **Features grid** — 3-column grid (1-col mobile, 3-col md+). Each card: icon (Phosphor, 32px), feature name, 1-2 sentence description. Features: Dual-timezone display, PostgreSQL-backed booking engine, Open source + self-host.

4. **How it works** — 3-step numbered list with brief descriptions and screenshots.

5. **Comparison table** — Schedica vs. Calendly vs. Cal.com. Columns for key differentiators. Schedica column highlighted.

6. **CTA banner** — Full-width teal section. "Start scheduling for free" headline + "Sign up" button (white on teal).

7. **Footer** — As described in landing layout.

---

### Sign Up — `/sign-up`

Form fields: Full name, Email, Password (with strength indicator), Confirm password. Primary button: "Create account". Divider "or". "Continue with Google" (outline button with Google logo). Footer link: "Already have an account? Sign in."

Email verification step (shown after signup): "Check your inbox" with animated envelope icon, instruction to click verification link, "Resend email" link.

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
- Full URL displayed in a read-only input-style box: `schedica.com/[username]`
- Three icon buttons to the right of the box: Copy (`CopyIcon`), Open in new tab (`ArrowSquareOutIcon`), Share via email (`EnvelopeIcon`)
- Copy button label changes to "Copied!" for 2 seconds after click

**Card 2 — QR code:**
- QR code image centred in the card, generated from the booking URL
- "Download QR code" ghost button below — saves as `schedica-[username]-qr.png`

**Card 3 — Change username:**
- Label: "Username" with current value shown above the input
- Input field with real-time availability indicator (spinner → green "✓ Available" or red "✗ Already taken")
- Helper text: "schedica.com/[typed-value]" shown live below the input
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

The public booking page is the most-seen UI in Schedica. Design must be polished and distraction-free.

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

### Confirmation Screen

- Green checkmark icon (large, animated)
- "You're scheduled!" headline
- Meeting card: event type name, date/time (both invitee and host timezone), duration, location (join button for video)
- "Add to Calendar" buttons: Google Calendar, iCal/Outlook, Office 365
- "Reschedule" and "Cancel" text links
- Host's custom message (if set) in a `<Card>` below

---

## Email Templates (React Email)

React Email components live in `src/lib/email/`. These are rendered server-side to HTML by Nodemailer.

**All emails share:**
- Header bar in the host's brand color (or default teal `#0d9488` if not set)
- Host logo or profile photo in header
- Consistent footer: host reply-to email, unsubscribe link, no "Powered by Schedica" branding
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
| Use Sonner toasts for operation feedback | Use custom alert divs for transient messages |
| Test every screen in both light and dark mode | Assume light mode only |
| Disable animations for `prefers-reduced-motion` | Add animations without reduced-motion fallbacks |
