# Admin Panel

The Admin Panel is a password-protected internal dashboard for platform administrators (not regular hosts). It provides full visibility and control over the Schedica platform — users, bookings, background jobs, and platform configuration — without touching the database directly.

---

## Overview

The admin panel sits at `/admin` and is completely separate from the host dashboard (`/dashboard`). Only users with `role = platform_admin` (set via Better Auth Admin Plugin or directly in the database) can access it.

**What MVP must do:**
1. Let admins look up any user by email and ban/unban their account
2. Show a quick health check — user count, active bookings, failed job count

**What is Phase 2 (not at launch):**
- Impersonation ("log in as user")
- Booking oversight screen
- Job queue monitor UI
- Platform settings + email template preview

The admin panel is built entirely with **custom Next.js pages + Shadcn/UI** — no third-party admin dashboard dependency. All data is fetched server-side via Drizzle ORM and Better Auth Admin Plugin API calls.

---

## User Stories

**Platform Admin**
- As an admin, I want to search and view any user's account, so that I can assist with support requests. *(MVP)*
- As an admin, I want to ban a user account, so that I can handle abuse. *(MVP)*
- As an admin, I want to unban a user account, so that I can restore access when an issue is resolved. *(MVP)*
- As an admin, I want to see a dashboard with key platform metrics at a glance, so that I know the platform is healthy. *(MVP — minimal stats only; charts Phase 2)*
- As an admin, I want to impersonate a user, so that I can reproduce and debug their reported issue. *(Post-MVP — Phase 2)*
- As an admin, I want to view all bookings platform-wide, so that I can monitor activity and investigate issues. *(Post-MVP — Phase 2)*
- As an admin, I want to see all background jobs (pending, running, failed) via the UI, so that I know if the job queue is healthy. *(Post-MVP — Phase 2; check pgboss.job table directly at MVP)*
- As an admin, I want to retry a failed job from the UI, so that I can recover from transient failures without a code deployment. *(Post-MVP — Phase 2)*

---

## Access Control

### Who Can Access

Only users with `is_platform_admin = true` can access the admin panel. This flag is set in the `users` table. First admin account is created manually (see Phase 20 pre-launch checklist).

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
auth.api.banUser({ userId, reason })   // Ban user (blocks sign-in)
auth.api.unbanUser({ userId })         // Lift ban
auth.api.impersonateUser({ userId })   // Get session token for impersonation
auth.api.listUserSessions({ userId })  // Active sessions
auth.api.revokeUserSessions({ userId })// Kill all sessions
```

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

### 2. User Management — `/admin/users`

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
| Actions | Ban / Unban, Revoke all sessions, Send password reset | *(MVP)* |
| Impersonate | Open app as this user (red banner, stop-impersonating button) | *(Phase 2)* |

**Actions:**

| Action | Behavior |
|--------|----------|
| **Ban user** | Calls `auth.api.banUser()` — user cannot sign in; existing sessions killed |
| **Unban user** | Calls `auth.api.unbanUser()` — restores access |
| **Impersonate** *(Phase 2)* | Calls `auth.api.impersonateUser()` — opens app as that user in current tab; red banner "You are impersonating [name]" shown; "Stop impersonating" button returns to admin |
| **Revoke all sessions** | Calls `auth.api.revokeUserSessions()` — logs user out everywhere |
| **Send password reset** | Triggers Nodemailer to send password reset email to user |

---

### 3. Booking Oversight — `/admin/bookings` *(Post-MVP — Phase 2)*

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

### 4. Job Queue Monitor — `/admin/jobs` *(Post-MVP — Phase 2)*

Background jobs run via pg-boss. This screen surfaces the queue state directly.

> **MVP approach:** Check `pgboss.job` table directly in the database when needed. A UI for this adds significant complexity before you have enough job volume to justify it.

**Job List:**
- Queries the `pgboss.job` table via Drizzle ORM
- Columns: Job Name (type), State (created / active / completed / failed / cancelled), Created At, Completed At, Retry Count
- Filters: State (All / Pending / Running / Failed), Job Type

**Job States:**

| State | Meaning |
|-------|---------|
| `created` | Queued, not yet picked up |
| `active` | Currently being processed |
| `completed` | Finished successfully |
| `failed` | Errored after all retries exhausted |
| `cancelled` | Manually cancelled |

**Failed Job Detail:**
- Error message and full stack trace from `pgboss.job.output`
- Retry count and last attempted at
- Original job data (payload)
- **Retry button** — re-enqueues the job for immediate execution
- **Cancel button** — marks job as cancelled (no further retries)

---

### 5. Platform Settings — `/admin/settings` *(Post-MVP — Phase 2)*

Simple configuration screen for platform-level settings.

> **MVP approach:** All platform configuration is via environment variables. A UI settings screen is convenient but not needed before launch — change the `.env` and redeploy.

| Setting | Type | Default |
|---------|------|---------|
| SMTP from name | Text | "Schedica" |
| SMTP from email | Text | From env var |
| Max bookings per invitee email per day | Number | 10 |
| Allow new user signups | Toggle | On |

> **Note:** Most configuration is via environment variables. The settings screen is for runtime-configurable values only. Core settings like DATABASE_URL, SMTP_HOST, AWS credentials are always env vars.

**Email Template Preview:**
- Select an email template from a dropdown (booking-confirmation, reminder, cancellation, etc.)
- Fill in dummy data
- Render the React Email template and show it in an `<iframe>`
- Send test email to admin's email address

---

## API Endpoints

All admin API routes require `is_platform_admin = true` — verified server-side on every request.

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Paginated user list with search |
| GET | `/api/admin/users/[id]` | Get user detail + stats |
| POST | `/api/admin/users/[id]/ban` | Ban user |
| POST | `/api/admin/users/[id]/unban` | Unban user |
| POST | `/api/admin/users/[id]/impersonate` | Get impersonation session *(Phase 2)* |
| POST | `/api/admin/users/[id]/revoke-sessions` | Revoke all user sessions |
| POST | `/api/admin/users/[id]/password-reset` | Send password reset email |

### Bookings *(Post-MVP — Phase 2)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/bookings` | Paginated booking list (platform-wide) |
| GET | `/api/admin/bookings/[id]` | Get booking detail |

### Job Queue *(Post-MVP — Phase 2)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/jobs` | Paginated job list (from pgboss.job table) |
| GET | `/api/admin/jobs/[id]` | Get job detail + error/output |
| POST | `/api/admin/jobs/[id]/retry` | Re-enqueue failed job |
| POST | `/api/admin/jobs/[id]/cancel` | Cancel a job |

### Dashboard Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform metrics (user count, active bookings, failed jobs count) |

---

## UI Screens

| Screen | Route | Key Components | Scope |
|--------|-------|----------------|-------|
| Admin Dashboard | `/admin` | Minimal stats cards (users, active bookings, failed jobs count) | *(MVP)* |
| User List | `/admin/users` | Searchable data table with filters | *(MVP)* |
| User Detail | `/admin/users/[id]` | Profile, sessions, ban/unban actions | *(MVP)* |
| Booking List | `/admin/bookings` | Data table with status + date filters | *(Phase 2)* |
| Booking Detail | `/admin/bookings/[id]` | Full booking record view | *(Phase 2)* |
| Job Queue | `/admin/jobs` | Job table with state filter + retry/cancel actions | *(Phase 2)* |
| Job Detail | `/admin/jobs/[id]` | Error trace, payload, retry/cancel | *(Phase 2)* |
| Platform Settings | `/admin/settings` | Config form + email preview | *(Phase 2)* |

**Admin Layout (MVP):** Minimal sidebar — Dashboard + Users only. Bookings, Jobs, Settings tabs added in Phase 2. Top bar shows "Logged in as [admin name]".

---

## Data Model

No new database tables needed. The admin panel reads from existing tables:

| Data | Source Table |
|------|-------------|
| Users | `users` (Better Auth) |
| Sessions | `sessions` (Better Auth) |
| Bookings | `bookings` |
| Booking answers | `booking_answers` |
| Background jobs | `pgboss.job` (pg-boss schema, read-only) |

Admin actions (ban, unban, revoke sessions) are performed via Better Auth Admin Plugin API — no raw SQL needed.

---

## MVP Scope

**In MVP:**
- Minimal admin dashboard — 3 stats: total users, active bookings, failed job count
- User list with search by name/email + ban/unban
- User detail view: profile, active sessions, revoke all sessions, send password reset

**Post-MVP:**
- Impersonation ("log in as user") — complex security surface; not needed before scale
- Job queue monitor UI with retry/cancel — check DB directly at MVP scale
- Booking oversight screen — not needed before you have enough users to warrant oversight
- Platform settings UI — use environment variables at MVP; UI when settings change frequently
- Email template preview — useful but not a launch blocker
- Sign-up trend charts
- Audit log (who did what admin action, when)
- Admin notifications (email alert when job queue depth exceeds threshold)

> **Why:** A full admin panel (5 screens, 12+ endpoints) is months of work that delivers zero user value before you have users. What you actually need at launch: look up a user by email, ban them if needed, and check the job queue via direct DB query. That is 2 screens, 5 endpoints, and 2 days — not 2 weeks.

---

## Tech Stack

- **Next.js App Router (Server Components)** — all admin pages are Server Components; data fetched directly via Drizzle ORM and Better Auth Admin Plugin on the server. No client-side data fetching for lists.
- **Better Auth Admin Plugin** — provides `listUsers`, `banUser`, `unbanUser`, `listUserSessions`, `revokeUserSessions` without custom SQL. `impersonateUser` available but used in Phase 2 only.
- **Drizzle ORM** — queries `users` and `bookings` tables for user detail (bookings count). `pgboss.job` queried for the failed-jobs count on the dashboard stats card only; full job monitor UI is Phase 2.
- **Shadcn/UI** — data tables, cards, badges, dialogs, and sidebar navigation components used throughout the admin panel.
- **PostgreSQL (pg-boss schema)** — `pgboss.job` table is queried read-only for the job queue monitor; retry and cancel operations go through the pg-boss Node.js API (not raw SQL).
- **Nodemailer (SMTP)** — used to send the "send password reset" action email from admin user detail screen.
- **`src/middleware.ts`** — admin route protection; redirects non-admins before any admin page renders.
