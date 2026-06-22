# Schduled — Project Rules

## Tech Stack
- Next.js 15 App Router + Turbopack
- Better Auth v1.6.18 (magic link, admin plugin)
- Drizzle ORM + PostgreSQL
- Tailwind CSS v4
- pg-boss background worker

## Design Rules (STRICT — never break these)

### No Shadows
**Never add shadows anywhere in the project.** This includes:
- `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`
- Custom shadows: `shadow-[...]`
- Inline `boxShadow` style props
- `drop-shadow-[...]`
- `hover:shadow-*`

The only shadow-related classes allowed are `shadow-none` (to explicitly reset) and `ring-1 ring-foreground/10` for floating UI elements (dialogs, dropdowns, popovers).

### No Border Radius
Zero border radius everywhere. Never use `rounded-*` classes.
Exception: `rounded-full` for circular avatar/icon elements only.

### Colors
- Primary: teal (`--primary` CSS var)
- All icons, buttons, active states use teal
- No other accent colors for UI chrome

### Icons
**Phosphor Icons only.** Never use Lucide or any other icon library.
```tsx
import { IconName } from "@phosphor-icons/react"
// or for SSR:
import { IconName } from "@phosphor-icons/react/dist/ssr"
```

### Typography
- Body text / descriptions: minimum `text-sm` (never `text-xs` for readable content)
- `text-xs` is only for badges, navigation labels, pagination counters, small status chips
- No `text-[10px]` or `text-[11px]` outside of tightly constrained badge-like elements

## Database Rules
- DB: `postgresql://schedica:Schedica123@localhost:5432/schedica`
- Keep `db/` path for schema files
- Singular table names (Better Auth default): `user`, `session`, `verification`, etc.
- Never rename DB tables or change naming conventions

## Code Rules
- `tsc --noEmit` must pass clean after every change
- No S3 uploads (feature skipped)
- Only one admin in the system — no "Make Admin / Remove Admin" UI
- Booking emails: teal-only color scheme

## Auth
- Admin email: `dhruti.hirapara@snapdevio.com`
- Users log in via magic link only (no Google OAuth for admin)
- Use `requireAdmin()` for orbit (admin panel) routes
- Use `requireSession()` for app routes

## Project Structure
- `app/(app)/` — authenticated user app
- `app/(orbit)/` — admin panel
- `app/(booking)/` — public booking flow
- `app/(landing)/` — public marketing pages
- `app/(orbit-public)/` — admin login
- `components/ui/` — shadcn/ui primitives (customized, no radius, no shadow)
- `components/orbit/` — admin panel components
- `components/scaffold/` — app shell (sidebar, header)
