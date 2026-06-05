# Admin Panel

The Admin Panel is a password-protected internal dashboard for platform administrators (not regular hosts). It provides full visibility and control over the Schedica platform — users, bookings, background jobs, and platform configuration — without touching the database directly.

---

## Overview

The admin panel sits at `/admin` and is completely separate from the host dashboard (`/dashboard`). Only users with `role = platform_admin` (set via Better Auth Admin Plugin or directly in the database) can access it.

**Three jobs it must do:**
1. Let admins manage users (view, ban, impersonate, reset password)
2. Let admins monitor platform health (bookings, background jobs, errors)
3. Let admins configure the platform (email settings, system info)

The admin panel is built entirely with **custom Next.js pages + Shadcn/UI** — no third-party admin dashboard dependency. All data is fetched server-side via Drizzle ORM and Better Auth Admin Plugin API calls.

---

## User Stories

**Platform Admin**
- As an admin, I want to see a dashboard with key platform metrics at a glance, so that I know the platform is healthy. *(MVP)*
- As an admin, I want to search and view any user's account, so that I can assist with support requests. *(MVP)*
- As an admin, I want to ban a user account, so that I can handle abuse. *(MVP)*
- As an admin, I want to impersonate a user, so that I can reproduce and debug their reported issue. *(MVP)*
- As an admin, I want to view all bookings platform-wide, so that I can monitor activity and investigate issues. *(MVP)*
- As an admin, I want to see all background jobs (pending, running, failed), so that I know if the job queue is healthy. *(MVP)*
- As an admin, I want to retry a failed job, so that I can recover from transient failures without a code deployment. *(MVP)*
- As an admin, I want to see a failed job's error and stack trace, so that I can diagnose what went wrong. *(MVP)*

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

**Stats Cards (top row):**

| Stat | Source |
|------|--------|
| Total users | `COUNT(*) FROM users` |
| New users today | `WHERE createdAt >= today` |
| Bookings today | `WHERE startTime >= today` |
| Active bookings | `WHERE status = confirmed AND startTime > now` |
| Failed jobs | `SELECT count FROM pg_boss.job WHERE state = failed` |

**Sign-up Chart:**
- Last 30 days, grouped by day
- Bar chart built with Shadcn/UI + Recharts (or plain CSS bars for simplicity)
- Shows daily new user registrations

**Recent Activity:**
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

| Section | Content |
|---------|---------|
| Profile | Name, email, username, timezone, created date |
| Account | Status (active/banned), email verified, 2FA enabled |
| Calendars | Connected calendars (provider, account email) |
| Sessions | Active sessions (device, IP, last active) — with Revoke button per session |
| Bookings | Total bookings as host, last booking date |
| Actions | Ban / Unban, Impersonate, Revoke all sessions, Send password reset |

**Actions:**

| Action | Behavior |
|--------|----------|
| **Ban user** | Calls `auth.api.banUser()` — user cannot sign in; existing sessions killed |
| **Unban user** | Calls `auth.api.unbanUser()` — restores access |
| **Impersonate** | Calls `auth.api.impersonateUser()` — opens app as that user in current tab; red banner "You are impersonating [name]" shown; "Stop impersonating" button returns to admin |
| **Revoke all sessions** | Calls `auth.api.revokeUserSessions()` — logs user out everywhere |
| **Send password reset** | Triggers Nodemailer to send password reset email to user |

---

### 3. Booking Oversight — `/admin/bookings`

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

### 4. Job Queue Monitor — `/admin/jobs`

Background jobs run via pg-boss. This screen surfaces the queue state directly.

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

### 5. Platform Settings — `/admin/settings`

Simple configuration screen for platform-level settings.

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
| POST | `/api/admin/users/[id]/impersonate` | Get impersonation session |
| POST | `/api/admin/users/[id]/revoke-sessions` | Revoke all user sessions |
| POST | `/api/admin/users/[id]/password-reset` | Send password reset email |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/bookings` | Paginated booking list (platform-wide) |
| GET | `/api/admin/bookings/[id]` | Get booking detail |

### Job Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/jobs` | Paginated job list (from pgboss.job table) |
| GET | `/api/admin/jobs/[id]` | Get job detail + error/output |
| POST | `/api/admin/jobs/[id]/retry` | Re-enqueue failed job |
| POST | `/api/admin/jobs/[id]/cancel` | Cancel a job |

### Dashboard Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform metrics (user count, booking count, failed jobs) |

---

## UI Screens

| Screen | Route | Key Components |
|--------|-------|----------------|
| Admin Dashboard | `/admin` | Stats cards, sign-up chart, recent activity |
| User List | `/admin/users` | Searchable data table with filters |
| User Detail | `/admin/users/[id]` | Profile, sessions, actions panel |
| Booking List | `/admin/bookings` | Data table with status + date filters |
| Booking Detail | `/admin/bookings/[id]` | Full booking record view |
| Job Queue | `/admin/jobs` | Job table with state filter + retry/cancel actions |
| Job Detail | `/admin/jobs/[id]` | Error trace, payload, retry/cancel |
| Platform Settings | `/admin/settings` | Config form + email preview |

**Admin Layout:** Shared sidebar navigation (Dashboard, Users, Bookings, Jobs, Settings) + top bar showing "Logged in as [admin name]".

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
- Admin Dashboard with stats cards and recent activity
- User list with search + ban/unban/impersonate/revoke actions
- Booking list and detail view (read-only)
- Job queue monitor with retry/cancel actions
- Email template preview
- Platform Settings (from name, from email, signup toggle)

**Post-MVP:**
- Audit log — every admin action logged (who did what to whom, when)
- Sign-up trend chart with more granular breakpoints (Phase 2)
- Advanced booking search (by date range, host, event type combinations)
- Admin notifications (email alert when job queue depth exceeds threshold)

---

## Tech Stack

- **Next.js App Router (Server Components)** — all admin pages are Server Components; data fetched directly via Drizzle ORM and Better Auth Admin Plugin on the server. No client-side data fetching for lists.
- **Better Auth Admin Plugin** — provides `listUsers`, `banUser`, `unbanUser`, `impersonateUser`, `listUserSessions`, `revokeUserSessions` without custom SQL.
- **Drizzle ORM** — queries `bookings`, `booking_answers`, and `pgboss.job` tables directly for booking oversight and job queue monitor.
- **Shadcn/UI** — data tables, cards, badges, dialogs, and sidebar navigation components used throughout the admin panel.
- **PostgreSQL (pg-boss schema)** — `pgboss.job` table is queried read-only for the job queue monitor; retry and cancel operations go through the pg-boss Node.js API (not raw SQL).
- **Nodemailer (SMTP)** — used to send the "send password reset" action email from admin user detail screen.
- **`src/middleware.ts`** — admin route protection; redirects non-admins before any admin page renders.
