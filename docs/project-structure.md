# Schedica — Project Structure

Complete folder and file structure with explanations for every directory. A new developer should be able to read this document and know exactly where to find any piece of code and where to add new code.

> **Structure:** Next.js App Router, lib/ for business logic, db/ for data layer, worker/ for background jobs.

---

## Root Structure

```
schedica/
├── app/                    ← Next.js App Router (pages, API routes, layouts)
├── src/
│   ├── components/         ← React UI components
│   ├── lib/                ← Business logic, services, utilities
│   │   ├── auth.ts         ← Better Auth configuration
│   │   ├── db/             ← Database (Drizzle schema + query helpers)
│   │   ├── worker/         ← pg-boss background job worker
│   │   ├── email/          ← Email templates (React Email)
│   │   ├── calendar/       ← Google/Microsoft calendar integration
│   │   ├── video/          ← Zoom / Teams integration
│   │   ├── storage/        ← File upload abstraction (local disk or S3/R2)
│   │   ├── encrypt.ts      ← AES-256-GCM encryption helper
│   │   └── env.ts          ← Zod-validated environment variables
│   └── hooks/              ← React custom hooks (client components only)
├── drizzle/                ← Auto-generated SQL migrations
├── public/                 ← Static assets (favicon, OG images)
├── app/                    ← Next.js App Router
├── biome.jsonc             ← Linter + formatter config
├── drizzle.config.ts       ← Drizzle ORM config
├── next.config.mjs         ← Next.js config
├── tsconfig.json           ← TypeScript config (strict mode)
├── package.json
└── .env.local              ← Environment variables (never committed)
```

---

## `app/` — Next.js App Router

All pages, layouts, and API routes.

```
app/
├── (auth)/                         ← Route group: public auth pages (no layout chrome)
│   ├── sign-in/
│   │   └── page.tsx                ← Sign-in page (email/password, Google, magic link)
│   ├── sign-up/
│   │   └── page.tsx                ← Sign-up page (email/password, Google)
│   ├── verify-email/
│   │   └── page.tsx                ← Email verification code entry
│   ├── forgot-password/
│   │   └── page.tsx                ← Request password reset
│   └── reset-password/
│       └── page.tsx                ← Set new password (from email link)
│
├── (onboarding)/                   ← Route group: 5-step onboarding wizard
│   └── onboarding/
│       ├── layout.tsx              ← Progress bar, step indicator
│       ├── [step]/
│       │   └── page.tsx            ← Step 1-5 (calendar, timezone, event type, preview, share)
│       └── complete/
│           └── page.tsx            ← "You're all set!" confirmation
│
├── (app)/                          ← Route group: authenticated host dashboard
│   ├── layout.tsx                  ← Dashboard shell (sidebar, nav, session check)
│   ├── dashboard/
│   │   └── page.tsx                ← Meetings dashboard (upcoming, past, cancelled)
│   ├── event-types/
│   │   ├── page.tsx                ← Event types list
│   │   ├── new/
│   │   │   └── page.tsx            ← Create event type wizard
│   │   └── [id]/
│   │       └── page.tsx            ← Edit event type
│   ├── availability/
│   │   └── page.tsx                ← Availability schedule + date overrides
│   ├── integrations/
│   │   ├── page.tsx                ← Calendar + video integrations overview
│   │   ├── google/
│   │   │   └── callback/
│   │   │       └── route.ts        ← Google Calendar OAuth callback
│   │   ├── microsoft/
│   │   │   └── callback/
│   │   │       └── route.ts        ← Microsoft Graph OAuth callback
│   │   └── zoom/
│   │       └── callback/
│   │           └── route.ts        ← Zoom OAuth callback
│   ├── settings/
│   │   ├── page.tsx                ← Profile, appearance, account settings
│   │   ├── notifications/
│   │   │   └── page.tsx            ← Notification preferences
│   │   └── danger-zone/
│   │       └── page.tsx            ← Account deletion (Phase 2)
│   └── post-auth/
│       └── page.tsx                ← Redirect after OAuth (to onboarding or dashboard)
│
├── (admin)/                        ← Route group: admin panel (requires platform_admin role)
│   ├── layout.tsx                  ← Admin shell (admin sidebar, session + role check)
│   ├── admin/
│   │   ├── page.tsx                ← Admin dashboard (stats cards)
│   │   ├── audit-log/
│   │   │   ├── page.tsx            ← Audit log table
│   │   │   └── [id]/
│   │   │       └── page.tsx        ← Audit event detail (before/after JSON)
│   │   ├── users/
│   │   │   ├── page.tsx            ← User list with search
│   │   │   └── [id]/
│   │   │       └── page.tsx        ← User detail (ban, impersonate, sessions, emails)
│   │   ├── jobs/
│   │   │   ├── page.tsx            ← Job queue table (pgboss.job)
│   │   │   └── [id]/
│   │   │       └── page.tsx        ← Job detail (error, payload, retry count)
│   │   └── settings/
│   │       └── page.tsx            ← Platform settings (allow signups, email name, etc.)
│
├── (booking)/                      ← Route group: public booking pages (no auth)
│   └── [username]/
│       ├── page.tsx                ← Host profile overview (all event types)
│       └── [eventSlug]/
│           ├── page.tsx            ← Booking calendar + form
│           ├── confirmed/
│           │   └── page.tsx        ← Booking confirmation screen
│           ├── cancel/
│           │   └── page.tsx        ← Cancel booking (token-based)
│           └── reschedule/
│               └── page.tsx        ← Reschedule booking (token-based)
│
├── (landing)/
│   └── page.tsx                    ← Marketing landing page
│
├── api/
│   ├── auth/
│   │   └── [...all]/
│   │       └── route.ts            ← Better Auth handler (MUST be this path)
│   ├── bookings/
│   │   └── route.ts                ← POST /api/bookings (public — invitee submits booking)
│   ├── slots/
│   │   └── route.ts                ← GET /api/slots (public — available time slots)
│   ├── admin/
│   │   ├── stats/route.ts          ← GET platform stats
│   │   ├── audit-log/route.ts      ← GET audit log list
│   │   ├── users/
│   │   │   └── route.ts            ← GET paginated user list
│   │   ├── users/[id]/
│   │   │   ├── route.ts            ← GET user detail
│   │   │   ├── ban/route.ts        ← POST ban user
│   │   │   ├── unban/route.ts      ← POST unban user
│   │   │   ├── impersonate/route.ts ← POST start impersonation
│   │   │   ├── revoke-sessions/route.ts ← POST revoke sessions
│   │   │   └── password-reset/route.ts ← POST send reset email
│   │   ├── jobs/route.ts           ← GET pg-boss job list
│   │   └── settings/route.ts       ← GET/PATCH platform settings
│   └── webhooks/
│       └── (empty at MVP — webhooks are Phase 2)
│
├── actions/                        ← Server Actions ('use server')
│   ├── auth.ts                     ← Sign in, sign up, sign out
│   ├── bookings.ts                 ← Cancel, reschedule from host dashboard
│   ├── event-types.ts              ← Create, update, delete, toggle, reorder
│   ├── availability.ts             ← Update schedule, windows, overrides
│   ├── profile.ts                  ← Update name, photo, timezone, username
│   ├── notifications.ts            ← Update notification preferences
│   ├── calendars.ts                ← Disconnect calendar
│   └── settings.ts                 ← Update platform settings (admin only)
│
├── layout.tsx                      ← Root layout (html, body, font, theme)
└── globals.css                     ← Tailwind base styles + CSS variables
```

---

## `src/lib/` — Business Logic

All service-layer code. Never import from `app/` into `lib/` — the dependency flows one way: `app/` → `lib/`.

```
src/lib/
├── auth.ts                         ← Better Auth config (providers, plugins, session)
├── auth-core.ts                    ← Shared auth session query helpers
├── env.ts                          ← Zod-validated env vars — import from here, not process.env
├── encrypt.ts                      ← AES-256-GCM encrypt/decrypt (for OAuth tokens at rest)
│
├── db/                             ← Drizzle ORM — schema + query helpers
│   ├── schema/                     ← ONE file per domain
│   │   ├── enums.ts                ← ALL pgEnum definitions (imported by every domain file)
│   │   ├── auth.ts                 ← users, sessions, accounts, verifications
│   │   ├── profile.ts              ← user_profiles, user_branding, username_redirects
│   │   ├── event-types.ts          ← event_types, event_type_durations, cancellation_policies, event_type_questions
│   │   ├── availability.ts         ← availability_schedules, availability_windows, availability_overrides
│   │   ├── calendars.ts            ← connected_calendars, calendar_events_cache
│   │   ├── video.ts                ← video_connections
│   │   ├── bookings.ts             ← bookings, booking_answers, booking_guests
│   │   ├── notifications.ts        ← notification_preferences, workflow_jobs
│   │   ├── audit.ts                ← audit_logs
│   │   ├── email.ts                ← email_outbox, email_events
│   │   ├── platform.ts             ← platform_settings, disposable_email_domains, idempotency_keys
│   │   ├── relations.ts            ← ALL Drizzle relations (avoids circular imports)
│   │   └── index.ts                ← re-exports all tables, enums, relations
│   ├── index.ts                    ← Drizzle client (singleton, exported as `db`)
│   ├── users.ts                    ← DbUsers: getById, getByEmail, getByUsername, update
│   ├── event-types.ts              ← DbEventTypes: create, update, delete, toggle, reorder
│   ├── availability.ts             ← DbAvailability: getSchedule, upsert, deleteOverride
│   ├── bookings.ts                 ← DbBookings: create, get, cancel, list, updateVideoLink
│   ├── calendars.ts                ← DbCalendars: connect, getTokens, markDisconnected, upsertCache
│   ├── video.ts                    ← DbVideo: connect, getTokens, disconnect
│   ├── notifications.ts            ← DbNotifications: getPrefs, upsertPrefs, logJob
│   ├── audit.ts                    ← DbAudit: log, list, get
│   ├── email.ts                    ← DbEmail: enqueue, updateStatus, listByUser, logEvent
│   └── settings.ts                 ← DbSettings: get (singleton), update
│
├── worker/                         ← pg-boss worker process
│   ├── boss.ts                     ← pg-boss client initialization
│   ├── index.ts                    ← Entry point: registers all handlers + cron schedules
│   ├── job-types.ts                ← TypeScript payload types for all 16 jobs
│   ├── enqueue.ts                  ← Shared enqueueing helpers (enqueueEmail, scheduleReminders)
│   └── handlers/
│       ├── email-send.ts           ← EMAIL_SEND
│       ├── email-outbox-reap.ts    ← EMAIL_OUTBOX_REAP (cron)
│       ├── email-events-prune.ts   ← EMAIL_EVENTS_PRUNE (cron)
│       ├── booking-reminder-24h.ts ← BOOKING_REMINDER_24H
│       ├── booking-reminder-1h.ts  ← BOOKING_REMINDER_1H
│       ├── booking-cancel-reminders.ts ← BOOKING_CANCEL_REMINDERS
│       ├── booking-reschedule-reminders.ts ← BOOKING_RESCHEDULE_REMINDERS
│       ├── video-link-generate.ts  ← VIDEO_LINK_GENERATE
│       ├── video-link-retry.ts     ← VIDEO_LINK_RETRY
│       ├── calendar-write.ts       ← CALENDAR_WRITE
│       ├── calendar-update.ts      ← CALENDAR_UPDATE
│       ├── calendar-cancel.ts      ← CALENDAR_CANCEL
│       ├── calendar-sync.ts        ← CALENDAR_SYNC (cron)
│       ├── calendar-token-refresh.ts ← CALENDAR_TOKEN_REFRESH
│       ├── calendar-disconnect-alert.ts ← CALENDAR_DISCONNECT_ALERT
│       └── disposable-emails-refresh.ts ← DISPOSABLE_EMAILS_REFRESH (cron)
│
├── email/                          ← React Email templates
│   ├── renderer.ts                 ← renderEmailTemplate(template, data) → HTML string
│   └── components/                 ← One file per email template
│       ├── booking-confirmation.tsx
│       ├── booking-notification-host.tsx
│       ├── reminder-24h.tsx
│       ├── reminder-1h.tsx
│       ├── cancellation-invitee.tsx
│       ├── cancellation-host.tsx
│       ├── host-cancellation-invitee.tsx
│       ├── reschedule-invitee.tsx
│       ├── reschedule-host.tsx
│       ├── email-verification.tsx
│       ├── password-reset.tsx
│       ├── welcome.tsx
│       ├── calendar-disconnect-alert.tsx
│       └── video-link-failed-host.tsx
│
├── calendar/                       ← Calendar provider integrations
│   ├── google.ts                   ← Google Calendar API: list events, create/update/delete event
│   ├── microsoft.ts                ← Microsoft Graph: list events, create/update/delete event
│   ├── slot-generator.ts           ← CRITICAL: generates available slots from availability + cache
│   └── conflict-check.ts           ← Final availability check inside booking transaction
│
├── video/                          ← Video conferencing integrations
│   ├── zoom.ts                     ← Zoom API: createMeeting, refreshToken
│   └── teams.ts                    ← MS Teams (Phase 2): createMeeting via Graph API
│
├── storage/                        ← File upload abstraction (multi-driver)
│   ├── index.ts                    ← Unified API: uploadFile, deleteFile, getFileUrl, avatarKey, logoKey
│   ├── local.ts                    ← Local disk driver — saves to public/uploads/, served at /uploads/
│   └── s3.ts                       ← S3/R2 driver (AWS S3 / Cloudflare R2) — activate via STORAGE_DRIVER=s3
│
├── booking-engine/                 ← Core booking logic
│   ├── conflict-check.ts           ← Full conflict check (calendar cache + Schedica bookings)
│   ├── advisory-lock.ts            ← pg_advisory_xact_lock helper
│   ├── idempotency.ts              ← idempotency_keys check/store
│   └── create-booking.ts           ← Full booking creation transaction
│
└── email-validation/               ← Signup email validation
    ├── disposable-check.ts         ← DB lookup against disposable_email_domains
    └── mx-check.ts                 ← Node.js dns.promises.resolveMx()
```

---

## `src/components/` — React UI Components

```
src/components/
├── ui/                             ← Shadcn/UI base components (DO NOT modify directly)
│   ├── button.tsx
│   ├── card.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── badge.tsx
│   ├── calendar.tsx                ← Date picker (Shadcn)
│   ├── form.tsx
│   ├── sheet.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   └── ...
│
├── layouts/                        ← Full-page layout shells
│   ├── dashboard-layout.tsx        ← Host dashboard sidebar + topbar
│   ├── admin-layout.tsx            ← Admin panel sidebar + topbar
│   ├── auth-layout.tsx             ← Centered card layout for auth pages
│   └── booking-layout.tsx          ← Public booking page wrapper
│
├── booking/                        ← Booking page components
│   ├── booking-calendar.tsx        ← Month view with available/unavailable days
│   ├── time-slot-list.tsx          ← Available time slots for a selected day
│   ├── booking-form.tsx            ← Invitee details + custom questions form
│   ├── booking-confirmation.tsx    ← "You're scheduled!" confirmation screen
│   ├── cancel-page.tsx             ← Cancellation confirmation page
│   └── reschedule-page.tsx         ← Reschedule flow
│
├── dashboard/                      ← Host dashboard components
│   ├── meetings-list.tsx           ← Upcoming/past bookings table
│   ├── meeting-detail.tsx          ← Single meeting detail drawer/sheet
│   ├── stats-strip.tsx             ← Today's count + upcoming total
│   └── empty-state.tsx             ← No meetings yet illustration
│
├── event-types/                    ← Event type management
│   ├── event-type-card.tsx         ← Card with name, duration, link, edit/clone
│   ├── event-type-form.tsx         ← Create/edit form
│   └── duration-picker.tsx         ← Multi-duration selector
│
├── availability/                   ← Availability schedule UI
│   ├── weekly-hours.tsx            ← Mon-Sun time block configurator
│   ├── date-override-form.tsx      ← Block/custom hours for specific dates
│   └── availability-preview.tsx    ← Mini calendar preview of available slots
│
├── admin/                          ← Admin panel components
│   ├── stats-cards.tsx             ← 3-stat summary row
│   ├── user-table.tsx              ← Paginated user list with search
│   ├── audit-log-table.tsx         ← Filterable audit events table
│   ├── job-queue-table.tsx         ← pg-boss job table
│   ├── platform-settings-form.tsx  ← Admin settings form
│   └── user-detail-panel.tsx       ← User profile, sessions, actions
│
├── settings/                       ← Profile & settings components
│   ├── profile-form.tsx
│   ├── photo-upload.tsx            ← S3 presigned upload with crop
│   ├── calendar-connections.tsx    ← Connected calendars list + add/remove
│   ├── video-connections.tsx       ← Zoom / Teams connection
│   └── notification-prefs.tsx      ← Toggle switches per notification type
│
├── landing/                        ← Marketing landing page sections
│   ├── navbar.tsx
│   ├── hero.tsx
│   ├── features-section.tsx
│   ├── how-it-works.tsx
│   ├── cta-section.tsx
│   └── footer.tsx
│
└── shared/                         ← Shared components used across sections
    ├── timezone-select.tsx          ← Searchable IANA timezone dropdown
    ├── copy-link-button.tsx         ← One-click copy with toast feedback
    ├── impersonation-banner.tsx     ← Red "You are impersonating [name]" banner
    └── maintenance-banner.tsx       ← Platform maintenance message banner
```

---

## `drizzle/` — Database Migrations

```
drizzle/
├── 0000_initial_schema.sql         ← First migration (auth tables, core tables)
├── 0001_add_platform_tables.sql    ← audit_logs, email_outbox, platform_settings, etc.
├── 0002_...                        ← Generated by drizzle-kit
└── meta/
    ├── _journal.json               ← Migration history (DO NOT edit manually)
    └── 0000_snapshot.json          ← Schema snapshot per migration
```

**Rules:**
1. Never edit migration files after running them
2. Never write migrations by hand — edit the appropriate `src/lib/db/schema/*.ts` file, run `pnpm db:generate`
3. Never run `drizzle-kit push` in production — always use `drizzle-kit migrate`

---

## Key File: `src/lib/env.ts`

All environment variables must be declared and validated here. Never use `process.env.X` directly in code — always import from `env.ts`.

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  ZOOM_REDIRECT_URI: z.string().url().optional(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_SECURE: z.coerce.boolean(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM_EMAIL: z.string().email(),
  SMTP_FROM_NAME: z.string().default('Schedica'),

  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_REGION: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_ENDPOINT: z.string().url().optional(),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
```

If any required variable is missing, the app fails to start with a clear error message.

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `booking-engine.ts`, `calendar-sync.ts` |
| React components | PascalCase | `BookingCalendar`, `MeetingsList` |
| Server Actions | camelCase verb | `cancelBooking`, `updateAvailability` |
| API routes | REST nouns | `/api/bookings`, `/api/slots` |
| Job names | SCREAMING_SNAKE | `EMAIL_SEND`, `CALENDAR_SYNC` |
| DB table names | snake_case plural | `booking_answers`, `audit_logs` |
| DB column names | camelCase in Drizzle, snake_case in SQL | `startTime` → `start_time` |
| Environment vars | SCREAMING_SNAKE | `DATABASE_URL`, `SMTP_HOST` |

---

## Where to Add New Code

| Task | File(s) to create/edit |
|------|----------------------|
| New page | `app/(route-group)/new-page/page.tsx` |
| New Server Action | `app/actions/feature.ts` |
| New API endpoint | `app/api/feature/route.ts` |
| New UI component | `src/components/feature/component-name.tsx` |
| New background job | `src/lib/worker/handlers/job-name.ts` + register in `worker/index.ts` + type in `job-types.ts` |
| New database table | Add to `src/lib/db/schema/<domain>.ts` → run `pnpm db:generate` → run `pnpm db:migrate` |
| New query helper | Create `src/lib/db/feature.ts` with `DbFeature` export |
| New email template | `src/lib/email/components/template-name.tsx` + register in `renderer.ts` |
| New external integration | `src/lib/feature/provider.ts` |
| New env var | Add to `src/lib/env.ts` schema + `.env.local` + `tools-packages.md` |
