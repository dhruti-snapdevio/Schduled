# Admin Panel

The Admin Panel is a password-protected internal dashboard for platform administrators (not regular hosts). It provides full visibility and control over the Schedica platform — users, bookings, background jobs, audit history, and platform configuration — without touching the database directly.

---

## Overview

The admin panel sits at `/admin` and is completely separate from the host dashboard (`/dashboard`). Only users with `role = platform_admin` (set via Better Auth Admin Plugin or directly in the database) can access it.

**What MVP must do:**
1. Let admins look up any user by email and ban/unban their account
2. Impersonate a user to debug their reported issue
3. Show a quick health check — user count, active bookings, failed job count
4. Show a platform-wide audit log of all admin and user mutations
5. Show a simplified job queue view (state, counts, failed job details)
6. Provide minimal platform settings (toggle new signups, set email sender name)

**What is Phase 2 (not at launch):**
- Booking oversight screen (platform-wide booking list)
- Email template preview + test send
- Sign-up trend charts
- Slack/webhook notification when job queue depth spikes

The admin panel is built entirely with **custom Next.js pages + Shadcn/UI** — no third-party admin dashboard dependency. All data is fetched server-side via Drizzle ORM and Better Auth Admin Plugin API calls.

---

## User Stories

**Platform Admin**
- As an admin, I want to search and view any user's account, so that I can assist with support requests. *(MVP)*
- As an admin, I want to ban a user account, so that I can handle abuse. *(MVP)*
- As an admin, I want to unban a user account, so that I can restore access when an issue is resolved. *(MVP)*
- As an admin, I want to impersonate a user, so that I can reproduce and debug their reported issue. *(MVP)*
- As an admin, I want to see a dashboard with key platform metrics at a glance, so that I know the platform is healthy. *(MVP — minimal stats only; charts Phase 2)*
- As an admin, I want to view a platform-wide audit log of all mutations (bookings, cancellations, profile changes), so that I have a full trail of what happened and when. *(MVP)*
- As an admin, I want to see all background jobs (pending, running, failed) via the UI, so that I know if the job queue is healthy. *(MVP — read-only table view; retry/cancel Phase 2)*
- As an admin, I want to retry a failed job from the UI, so that I can recover from transient failures without a code deployment. *(Post-MVP — Phase 2)*
- As an admin, I want to view all bookings platform-wide, so that I can monitor activity and investigate issues. *(Post-MVP — Phase 2)*
- As an admin, I want to configure platform-level settings (allow signups, email sender name) from the admin panel, so that I can tune the platform at runtime without re-deploying. *(MVP — minimal settings only)*

---

## Access Control

### Who Can Access

Only users with `role = 'admin'` can access the admin panel. This field is set in the `users` table via the Better Auth admin plugin. The first admin account is set manually: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com'`.

### Route Protection

```
src/middleware.ts → checks session on every /admin/* request
→ if no session: redirect to /sign-in
→ if session but not platform_admin: redirect to /dashboard
→ if platform_admin: allow
```

Every `/api/admin/*` route also verifies the admin role server-side and returns `403 Forbidden` for non-admins — the middleware check is defense-in-depth only.

### Admin Plugin API

Better Auth Admin Plugin provides these server-side functions (called from Server Components / Server Actions):

```ts
auth.api.listUsers({ query })          // Paginated user list with search
auth.api.getUser({ userId })           // Get single user
auth.api.banUser({ userId, reason })   // Ban user (blocks sign-in); kills all existing sessions
auth.api.unbanUser({ userId })         // Lift ban
auth.api.impersonateUser({ userId })   // Start an impersonation session (MVP)
auth.api.listUserSessions({ userId })  // Active sessions list
auth.api.revokeUserSessions({ userId })// Kill all sessions for a user
```

**Impersonation Session Rules:**
- Admin-to-admin impersonation is blocked (cannot impersonate another admin)
- Impersonation session is time-limited (1 hour max)
- A red "Impersonating [name]" banner appears in the app during the session
- "Stop impersonating" button returns admin to their own session instantly
- Every impersonation start/stop is recorded in `audit_logs`

---

## Screens & Features

### 1. Admin Dashboard — `/admin`

**Stats Cards (top row) — MVP:**

| Stat | Source |
|------|--------|
| Total users | `COUNT(*) FROM users` |
| Active bookings | `WHERE status = confirmed AND startTime > now` |
| Failed jobs count | `SELECT count FROM pg_boss.job WHERE state = failed` |

> **MVP admin dashboard is intentionally minimal.** Three numbers is all you need at launch to know if the platform is alive and the job queue is clean. No chart, no recent activity list — those come in Phase 2 when there is data worth visualising.

**Sign-up Chart *(Post-MVP — Phase 2)*:**
- Last 30 days, grouped by day
- Bar chart built with Shadcn/UI + Recharts
- Shows daily new user registrations

**Recent Activity *(Post-MVP — Phase 2)*:**
- Last 10 bookings platform-wide (invitee name, host, time, status)
- Last 5 failed jobs (job type, error summary, timestamp)

---

### 2. Audit Log — `/admin/audit-log`

A searchable, filterable table of every significant mutation that happened on the platform. Powered by the `audit_logs` table — every write operation in the app records a row here automatically.

**Audit Log Table:**
- Columns: Actor (admin or user), Action, Target (user/booking/event-type), Details (JSON summary), IP Address, Timestamp
- Filters: action type, actor type (admin/user), date range
- Search: by actor email or target entity ID
- Paginated: 50 rows per page
- Default sort: newest first

**Logged Actions (MVP):**

| Action | Trigger |
|--------|---------|
| `user.signup` | New account created |
| `user.signin` | Successful sign-in |
| `user.signout` | Session terminated |
| `user.ban` | Admin banned a user |
| `user.unban` | Admin unbanned a user |
| `user.impersonate_start` | Admin started impersonating a user |
| `user.impersonate_stop` | Admin stopped impersonating |
| `user.password_reset` | Password reset completed |
| `user.revoke_sessions` | All sessions revoked |
| `booking.created` | New booking confirmed |
| `booking.cancelled_by_invitee` | Invitee cancelled |
| `booking.cancelled_by_host` | Host cancelled |
| `booking.rescheduled` | Booking rescheduled |
| `event_type.created` | Host created event type |
| `event_type.updated` | Host updated event type |
| `event_type.deleted` | Host deleted event type |
| `calendar.connected` | Calendar OAuth connected |
| `calendar.disconnected` | Calendar disconnected |
| `platform_settings.updated` | Admin changed platform settings |

**Audit Log Detail:**
- Click any row to see full JSON payload of the change
- Shows before/after values for updates
- Links to affected entity (user ID → user detail, booking ID → booking detail in Phase 2)

---

### 3. User Management — `/admin/users`

**User List:**
- Paginated table (25 per page)
- Columns: Name, Email, Created At, Status (Active / Banned), Bookings Count
- Search bar: search by name or email (real-time)
- Status filter: All / Active / Banned

**User Detail — `/admin/users/[id]`:**

| Section | Content | Scope |
|---------|---------|-------|
| Profile | Name, email, username, timezone, created date | *(MVP)* |
| Account | Status (active/banned), email verified | *(MVP)* |
| Sessions | Active sessions (device, IP, last active) — with Revoke button per session | *(MVP)* |
| Bookings | Total bookings as host, last booking date | *(MVP — count only; full list Phase 2)* |
| Calendars | Connected calendars (provider, account email) | *(MVP)* |
| Email History | Last 10 emails sent to this user (type, status, sent at) from `email_outbox` | *(MVP)* |
| Actions | Ban / Unban, Revoke all sessions, Send password reset, Impersonate | *(MVP)* |

**Actions:**

| Action | Behavior |
|--------|----------|
| **Ban user** | Calls `auth.api.banUser()` — user cannot sign in; existing sessions killed; audit log entry written |
| **Unban user** | Calls `auth.api.unbanUser()` — restores access; audit log entry written |
| **Impersonate** *(MVP)* | Calls `auth.api.impersonateUser()` — opens app as that user in current tab; red banner "You are impersonating [name]" shown; "Stop impersonating" button returns to admin; start/stop both audit-logged |
| **Revoke all sessions** | Calls `auth.api.revokeUserSessions()` — logs user out everywhere; audit-logged |
| **Send password reset** | Triggers Nodemailer to send password reset email to user via `EMAIL_SEND` pg-boss job |

---

### 4. Job Queue Monitor — `/admin/jobs` *(MVP — read-only view)*

Background jobs run via pg-boss. This screen surfaces the queue state in a minimal read-only table.

**Job Stats Cards (top row):**

| Stat | Source |
|------|--------|
| Pending jobs | `SELECT count FROM pgboss.job WHERE state = 'created'` |
| Active jobs | `SELECT count FROM pgboss.job WHERE state = 'active'` |
| Failed jobs (last 24h) | `SELECT count FROM pgboss.job WHERE state = 'failed' AND failedOn > now() - interval '24h'` |

**Job List Table:**
- Columns: Job Name, State, Created At, Started At, Completed/Failed At, Retry Count
- Filters: State (All / Pending / Running / Failed), Date range
- Paginated: 25 per page

**Failed Job Detail (click any failed row):**
- Error message and stack trace from `pgboss.job.output`
- Original job payload (JSON)
- Retry count and last attempted at

> **MVP:** Read-only. Retry and cancel buttons ship in Phase 2 — at MVP scale, re-enqueueing via the `pg-boss` Node.js API in a one-off script is sufficient.

**Job Names visible in this screen (all Schedica job types):**

| Job Name | Trigger | Cleanup? |
|----------|---------|---------|
| `EMAIL_SEND` | Any transactional email | — |
| `EMAIL_OUTBOX_REAP` | Cron — daily | ✓ |
| `EMAIL_EVENTS_PRUNE` | Cron — daily | ✓ |
| `BOOKING_REMINDER_24H` | On booking confirmed | — |
| `BOOKING_REMINDER_1H` | On booking confirmed | — |
| `BOOKING_CANCEL_REMINDERS` | On booking cancelled | — |
| `BOOKING_RESCHEDULE_REMINDERS` | On booking rescheduled | — |
| `VIDEO_LINK_GENERATE` | On booking confirmed | — |
| `VIDEO_LINK_RETRY` | On `VIDEO_LINK_GENERATE` failure | — |
| `CALENDAR_SYNC` | Cron — every 5 min | — |
| `CALENDAR_TOKEN_REFRESH` | Before calendar API call with expired token | — |
| `CALENDAR_DISCONNECT_ALERT` | On token refresh permanent failure | — |
| `DISPOSABLE_EMAILS_REFRESH` | Cron — daily | ✓ |

---

### 5. Platform Settings — `/admin/settings` *(MVP — minimal)*

Runtime-configurable platform settings stored in the `platform_settings` singleton table (always `id = 1`). Anything that requires a re-deploy stays in `.env`.

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| Allow new user signups | Toggle | On | When off, `/sign-up` returns "Signups are currently disabled" |
| Email sender name | Text | "Schedica" | Used as `from` name on all transactional emails |
| Max bookings per invitee per day | Number | 10 | Guards against booking spam |
| Platform maintenance message | Text | — | If set, shown as a banner on all pages |

> Every settings change is written to `audit_logs` with the admin's user ID, old value, and new value.

#### Platform Settings Cache

`platform_settings` is read on **every page load** — booking pages check `allowNewSignups`, middleware checks `maintenanceMessage`, the booking engine checks `maxBookingsPerInviteePerDay`. Without caching this would be a DB query on every single request.

`DbSettings.get()` caches the singleton row in memory for 60 seconds. After an admin saves changes, `invalidatePlatformSettingsCache()` is called immediately so the next request gets the fresh row.

```typescript
// src/lib/db/settings.ts
import db from '@/lib/db'
import { platformSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type PlatformSettings = typeof platformSettings.$inferSelect

let cache: PlatformSettings | null = null
let cacheAt = 0
const CACHE_TTL = 60_000  // 60 seconds

export const DbSettings = {
  // Call this everywhere settings are needed — never query platform_settings directly.
  // Returns the cached row if fresh; otherwise fetches from DB and refreshes the cache.
  async get(): Promise<PlatformSettings> {
    if (cache && Date.now() - cacheAt < CACHE_TTL) return cache
    const row = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.id, 1),
    })
    cache = row!
    cacheAt = Date.now()
    return cache
  },

  // Call immediately after any admin PATCH /admin/settings succeeds.
  // Forces the next get() to re-fetch from DB — no stale settings served.
  invalidateCache() {
    cache = null
  },

  async update(data: Partial<Omit<PlatformSettings, 'id' | 'updatedAt'>>) {
    const [updated] = await db
      .update(platformSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(platformSettings.id, 1))
      .returning()
    DbSettings.invalidateCache()  // always invalidate after any update
    return updated
  },
}
```

**Usage pattern across the app:**

```typescript
// In middleware, booking page, or any Server Component:
import { DbSettings } from '@/lib/db/settings'

const settings = await DbSettings.get()

if (!settings.allowNewSignups) {
  return NextResponse.redirect(new URL('/sign-in', request.url))
}
```

**Admin settings update action:**

```typescript
// src/app/actions/admin-settings.ts
export async function updatePlatformSettingsAction(data: SettingsFormInput) {
  // ... auth + validation ...
  const updated = await DbSettings.update(data)  // invalidateCache() called inside
  await DbAudit.log({ action: 'platform_settings.updated', ... })
  return { ok: true }
}
```

**Email Template Preview *(Phase 2)*:**
- Select email type from dropdown, fill dummy data, render React Email template in `<iframe>`, send test to admin email.

---

### 6. Booking Oversight — `/admin/bookings` *(Post-MVP — Phase 2)*

**Booking List:**
- All bookings platform-wide, paginated (25 per page)
- Columns: Invitee Name, Host Name, Event Type, Start Time, Status, Created At
- Filters: Status (all/confirmed/cancelled/rescheduled), Date range
- Search: by invitee email or host username

**Booking Detail:**
- Full booking record: host, invitee, event type, time (UTC + both timezones), location
- Booking answers (custom question responses)
- Timeline: booked at, cancelled at (if applicable), cancellation reason

---


## API Endpoints

All admin API routes require `is_platform_admin = true` — verified server-side on every request.

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Paginated user list with search |
| GET | `/api/admin/users/[id]` | Get user detail + stats |
| POST | `/api/admin/users/[id]/ban` | Ban user; writes audit log |
| POST | `/api/admin/users/[id]/unban` | Unban user; writes audit log |
| POST | `/api/admin/users/[id]/impersonate` | Start impersonation session *(MVP)* |
| POST | `/api/admin/users/[id]/revoke-sessions` | Revoke all user sessions; writes audit log |
| POST | `/api/admin/users/[id]/password-reset` | Enqueue `EMAIL_SEND` job for password reset |

### Audit Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/audit-log` | Paginated audit log with filters (action, actor, date range) |
| GET | `/api/admin/audit-log/[id]` | Full audit event payload (before/after JSON) |

### Job Queue *(MVP — read-only)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/jobs` | Paginated job list from `pgboss.job` table |
| GET | `/api/admin/jobs/[id]` | Job detail — error output, payload, retry count |
| POST | `/api/admin/jobs/[id]/retry` | Re-enqueue failed job *(Phase 2)* |
| POST | `/api/admin/jobs/[id]/cancel` | Cancel a job *(Phase 2)* |

### Platform Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/settings` | Get current platform settings singleton |
| PATCH | `/api/admin/settings` | Update platform settings; writes audit log |

### Bookings *(Post-MVP — Phase 2)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/bookings` | Paginated booking list (platform-wide) |
| GET | `/api/admin/bookings/[id]` | Get booking detail |

### Dashboard Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform metrics (user count, active bookings, failed jobs count) |

---

## UI Screens

| Screen | Route | Key Components | Scope |
|--------|-------|----------------|-------|
| Admin Dashboard | `/admin` | Stats cards (users, active bookings, failed jobs count) | *(MVP)* |
| Audit Log | `/admin/audit-log` | Searchable + filterable audit event table; click row for JSON detail | *(MVP)* |
| User List | `/admin/users` | Searchable data table with filters | *(MVP)* |
| User Detail | `/admin/users/[id]` | Profile, sessions, email history, ban/unban, impersonate | *(MVP)* |
| Job Queue | `/admin/jobs` | Read-only job table with state filter; failed job detail view | *(MVP)* |
| Platform Settings | `/admin/settings` | Minimal config form (allow signups, email sender name, booking limit, maintenance message) | *(MVP)* |
| Booking List | `/admin/bookings` | Data table with status + date filters | *(Phase 2)* |
| Booking Detail | `/admin/bookings/[id]` | Full booking record view | *(Phase 2)* |

**Admin Layout (MVP):** Sidebar with 5 entries — Dashboard, Audit Log, Users, Jobs, Settings. Top bar shows "Logged in as [admin name]" with a sign-out button.

---

## Data Model

The admin panel reads from existing tables and from two new tables added specifically for admin visibility:

| Data | Source Table | Notes |
|------|-------------|-------|
| Users | `users` (Better Auth) | — |
| Sessions | `sessions` (Better Auth) | — |
| Bookings | `bookings` | MVP: count only; full list Phase 2 |
| Booking answers | `booking_answers` | Phase 2 |
| Background jobs | `pgboss.job` (pg-boss schema) | Read-only via Drizzle `db.execute(sql...)` |
| Audit events | `audit_logs` | New table — every mutation writes a row |
| Email history | `email_outbox` | New table — every outbound email row; admin reads per-user |
| Platform settings | `platform_settings` | New singleton table — admin reads and writes |

Admin actions (ban, unban, revoke sessions) are performed via Better Auth Admin Plugin API — no raw SQL needed.

### `audit_logs` Table

```typescript
export const auditActionEnum = pgEnum('audit_action', [
  'user.signup', 'user.signin', 'user.signout',
  'user.ban', 'user.unban',
  'user.impersonate_start', 'user.impersonate_stop',
  'user.password_reset', 'user.revoke_sessions',
  'booking.created', 'booking.cancelled_by_invitee', 'booking.cancelled_by_host',
  'booking.rescheduled',
  'event_type.created', 'event_type.updated', 'event_type.deleted',
  'calendar.connected', 'calendar.disconnected',
  'platform_settings.updated',
])

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  actorEmail: text('actor_email'),                     // snapshot at time of action
  action: auditActionEnum('action').notNull(),
  targetType: text('target_type'),                     // 'user' | 'booking' | 'event_type' | 'platform'
  targetId: text('target_id'),                         // ID of affected entity
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  before: jsonb('before'),                             // state before mutation (for updates)
  after: jsonb('after'),                               // state after mutation
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('audit_logs_actor_idx').on(t.actorUserId),
  index('audit_logs_action_idx').on(t.action),
  index('audit_logs_created_at_idx').on(t.createdAt),
])
```

### `platform_settings` Table (Singleton)

```typescript
export const platformSettings = pgTable('platform_settings', {
  id: integer('id').primaryKey().default(1),           // always row ID = 1
  allowNewSignups: boolean('allow_new_signups').notNull().default(true),
  emailSenderName: text('email_sender_name').notNull().default('Schedica'),
  maxBookingsPerInviteePerDay: integer('max_bookings_per_invitee_per_day').notNull().default(10),
  maintenanceMessage: text('maintenance_message'),      // null = no banner
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedByUserId: text('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
})
```

---

## MVP Scope

**In MVP:**
- Admin dashboard — 3 stats: total users, active bookings, failed job count
- Audit log viewer — searchable table of all platform mutations; click row for before/after JSON
- User list with search by name/email + ban/unban + impersonate
- User detail view: profile, active sessions, email history, revoke all sessions, send password reset
- Job queue — read-only table view of `pgboss.job` with failed job detail; retry/cancel Phase 2
- Platform settings — toggle new signups, set email sender name, booking limit, maintenance message

**Post-MVP:**
- Job retry/cancel from UI — at MVP scale, re-enqueueing via a one-off script is sufficient
- Booking oversight screen (platform-wide booking list) — not needed before you have users to oversee
- Email template preview + test send
- Sign-up trend charts (Recharts bar chart)
- Admin email alerts when job queue depth spikes

---

## Background Jobs

The admin panel itself does not enqueue jobs, but the **Send Password Reset** action from the user detail screen enqueues an `EMAIL_SEND` job via pg-boss so email delivery is async and retried on failure.

| Job Name | Trigger | Payload |
|----------|---------|---------|
| `EMAIL_SEND` | Admin clicks "Send password reset" | `{ to, subject, template: 'password-reset', data: { resetUrl } }` |

---

## Tech Stack

- **Next.js App Router (Server Components)** — all admin pages are Server Components; data fetched directly via Drizzle ORM and Better Auth Admin Plugin on the server. No client-side data fetching for lists.
- **Better Auth Admin Plugin** — provides `listUsers`, `banUser`, `unbanUser`, `listUserSessions`, `revokeUserSessions`, `impersonateUser`. All admin actions use this API — no raw SQL needed.
- **Drizzle ORM** — queries `audit_logs`, `email_outbox`, `platform_settings`, `bookings` count. `pgboss.job` queried via `db.execute(sql\`SELECT ...\`)` since it lives in the `pgboss` schema. `platform_settings` is always accessed via `DbSettings.get()` — never queried directly — to benefit from the 60-second in-memory cache.
- **Shadcn/UI** — data tables, cards, badges, dialogs, and sidebar navigation components used throughout.
- **PostgreSQL (pg-boss schema)** — `pgboss.job` table is queried read-only for the job queue monitor; retry/cancel operations go through the pg-boss Node.js API (not raw SQL) in Phase 2.
- **pg-boss** — admin "Send password reset" action enqueues `EMAIL_SEND` job for async delivery with automatic retry.
- **Nodemailer (SMTP) + React Email** — delivers the password reset email rendered from a React Email template.
- **`src/middleware.ts`** — admin route protection; redirects non-admins before any admin page renders.
