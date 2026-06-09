# Schedica — Jobs & Queues Reference

All background work in Schedica runs through **pg-boss** — a PostgreSQL-backed job queue. No Redis, no separate message broker. The same PostgreSQL database used for application data also stores all job state. pg-boss runs as a **separate worker process** (`pnpm worker`) alongside the Next.js server.

> **Pattern adopted from Krova:** Every job uses a deterministic `singletonKey` in the format `{entityId}_{jobType}`. This ensures each job is uniquely identifiable, cancellable by key, and cannot create duplicates if the same event fires twice.

---

## Worker Process Setup

```
┌─────────────────────┐     ┌──────────────────────┐
│  Next.js Server     │     │  pg-boss Worker       │
│  pnpm dev           │     │  pnpm worker          │
│                     │     │                       │
│  API routes         │────▶│  Reads pgboss.job     │
│  Server Actions     │     │  Executes handlers    │
│  enqueue jobs via   │     │  Retries on failure   │
│  boss.send()        │     │  Runs cron schedules  │
└─────────────────────┘     └──────────────────────┘
          │                             │
          └──────────┬──────────────────┘
                     ▼
            PostgreSQL (shared DB)
            pgboss.* schema (job tables)
            public.* schema (app tables)
```

**Development:** `concurrently "pnpm dev" "pnpm worker"` — both run together via one command.

**Production:** Two separate processes. The worker auto-restarts on crash (pm2 / systemd).

---

## drizzle.config.ts — Critical Setting

```typescript
schemaFilter: ['public']  // REQUIRED — prevents Drizzle Kit from touching pgboss.* tables
```

Without this, `drizzle-kit push` / `drizzle-kit generate` would attempt to migrate pg-boss's internal tables.

---

## Complete Job Registry

### Job Naming Conventions

| Convention | Example | Rule |
|-----------|---------|------|
| Screaming snake case | `EMAIL_SEND` | All job names |
| Singleton key | `{bookingId}_reminder_24h` | Per-entity jobs |
| Cron jobs | No singleton key | Run on schedule, not per-entity |

---

## Master Feature-to-Job Mapping

| Feature | Job Name | Queue / Type | Trigger | Purpose | singletonKey |
|---------|---------|-------------|---------|---------|-------------|
| **User Onboarding** | `EMAIL_SEND` | Instant | After account created | Welcome email to new user | — |
| **User Onboarding** | `DISPOSABLE_EMAILS_REFRESH` | Cron — daily 04:00 UTC | Scheduled | Sync disposable email domain blocklist | — |
| **Booking Engine** | `EMAIL_SEND` | Instant ×2 | After booking confirmed | Confirmation email to invitee; notification to host | — |
| **Booking Engine** | `VIDEO_LINK_GENERATE` | Instant | After booking confirmed (Zoom/Teams only) | Create unique Zoom or Teams meeting room | `{bookingId}_video_link` |
| **Booking Engine** | `CALENDAR_WRITE` | Instant | After booking confirmed | Write booking event to host's Google/Outlook calendar | `{bookingId}_calendar_write` |
| **Booking Engine** | `BOOKING_REMINDER_24H` | Scheduled | After booking confirmed — fires 24h before start | 24-hour pre-meeting reminder email to invitee | `{bookingId}_reminder_24h` |
| **Booking Engine** | `BOOKING_REMINDER_1H` | Scheduled | After booking confirmed — fires 1h before start | 1-hour pre-meeting reminder email to invitee | `{bookingId}_reminder_1h` |
| **Booking Flow — Cancel** | `EMAIL_SEND` | Instant ×2 | After booking cancelled | Cancellation confirmation to invitee; cancellation notification to host | — |
| **Booking Flow — Cancel** | `BOOKING_CANCEL_REMINDERS` | Instant | After booking cancelled | Cancel pending `BOOKING_REMINDER_24H` and `BOOKING_REMINDER_1H` jobs so they don't fire for a cancelled meeting | — |
| **Booking Flow — Cancel** | `CALENDAR_CANCEL` | Instant | After booking cancelled | Delete calendar event from host's Google/Outlook calendar | `{bookingId}_calendar_cancel` |
| **Booking Flow — Reschedule** | `EMAIL_SEND` | Instant ×2 | After booking rescheduled | Reschedule confirmation email to invitee and host | — |
| **Booking Flow — Reschedule** | `BOOKING_RESCHEDULE_REMINDERS` | Instant | After booking rescheduled | Cancel old reminder jobs; schedule new ones for rescheduled time | — |
| **Booking Flow — Reschedule** | `CALENDAR_UPDATE` | Instant | After booking rescheduled | Update existing calendar event with new time | `{bookingId}_calendar_update` |
| **Calendar Integrations** | `CALENDAR_SYNC` | Cron — every 5 min | Scheduled | Poll calendar provider for events; refresh `calendar_events_cache` | `calendar_sync_{calendarId}` |
| **Calendar Integrations** | `CALENDAR_TOKEN_REFRESH` | On-demand | Before any calendar API call when token is expired | Refresh OAuth access token using stored refresh token | — |
| **Calendar Integrations** | `CALENDAR_DISCONNECT_ALERT` | Instant | After `CALENDAR_TOKEN_REFRESH` exhausts 3 retries | Mark calendar disconnected; disable booking pages; send host alert email | — |
| **Video Conferencing** | `VIDEO_LINK_GENERATE` | Instant | After booking confirmed (Zoom/Teams) | See Booking Engine row above | `{bookingId}_video_link` |
| **Video Conferencing** | `VIDEO_LINK_RETRY` | Instant | Spawned on retryable error from `VIDEO_LINK_GENERATE` | Manual retry path for rate-limited or temporary API failures | — |
| **Notifications — Reminders** | `EMAIL_SEND` | Instant | Reminder time reached | Render and deliver 24h / 1h reminder email | — |
| **Notifications — Cleanup** | `EMAIL_OUTBOX_REAP` | Cron — daily 03:00 UTC | Scheduled | Delete `email_outbox` rows older than 90 days with status=sent/failed | — |
| **Notifications — Cleanup** | `EMAIL_EVENTS_PRUNE` | Cron — daily 03:30 UTC | Scheduled | Delete `email_events` rows older than 30 days | — |
| **Admin Panel** | `EMAIL_SEND` | Instant | Admin clicks "Send password reset" | Deliver password reset email to user | — |

**Total: 16 distinct job types**

---

## Job Definitions (Complete)

### `EMAIL_SEND`

The universal email delivery job. Every outbound email goes through this job. Never send email inline in an API route.

```typescript
// Payload
type EmailSendPayload = {
  emailOutboxId: string   // Row ID in email_outbox table
}

// pg-boss config
export const EMAIL_SEND_CONFIG = {
  retryLimit: 3,
  retryDelay: 30,          // seconds
  retryBackoff: true,      // exponential: 30s → 60s → 120s
  concurrency: 5,          // 5 emails processed in parallel
}

// Handler pattern
export async function handleEmailSend(job: { data: EmailSendPayload }) {
  const outbox = await DbEmail.getById(job.data.emailOutboxId)
  if (!outbox || outbox.status === 'sent') return  // idempotent

  await DbEmail.updateStatus(outbox.id, 'sending')
  try {
    const html = await renderEmailTemplate(outbox.template, outbox.templateData)
    await transporter.sendMail({
      to: outbox.toEmail,
      subject: outbox.subject,
      from: `${outbox.fromName} <${process.env.SMTP_FROM_EMAIL}>`,
      replyTo: outbox.replyToEmail,
      html,
    })
    await DbEmail.updateStatus(outbox.id, 'sent', { sentAt: new Date() })
  } catch (err) {
    await DbEmail.updateStatus(outbox.id, 'failed', { errorMessage: String(err) })
    throw err  // let pg-boss retry
  }
}
```

**Used by:** All features that send email (booking engine, notifications, admin, calendar disconnect alert, onboarding)

---

### `EMAIL_OUTBOX_REAP`

Maintenance cron. Cleans up old sent/failed email records.

```typescript
// Payload: none
// Schedule: daily 03:00 UTC
// Handler: DELETE FROM email_outbox WHERE created_at < now() - interval '90 days' AND status IN ('sent', 'failed')
```

---

### `EMAIL_EVENTS_PRUNE`

Maintenance cron. Cleans up old delivery event records.

```typescript
// Payload: none
// Schedule: daily 03:30 UTC
// Handler: DELETE FROM email_events WHERE occurred_at < now() - interval '30 days'
```

---

### `BOOKING_REMINDER_24H` and `BOOKING_REMINDER_1H`

Timed jobs that fire at a specific future time. Scheduled inside the booking creation transaction.

```typescript
// Payload
type BookingReminderPayload = {
  bookingId: string
}

// pg-boss config
export const BOOKING_REMINDER_CONFIG = {
  retryLimit: 2,
  retryDelay: 60,
}

// Scheduling (inside booking transaction, after commit)
const reminderTime24h = new Date(booking.startTime.getTime() - 24 * 60 * 60 * 1000)
const reminderTime1h  = new Date(booking.startTime.getTime() - 60 * 60 * 1000)

await boss.sendAfter('BOOKING_REMINDER_24H',
  { bookingId: booking.id },
  { singletonKey: `${booking.id}_reminder_24h` },
  reminderTime24h
)

await boss.sendAfter('BOOKING_REMINDER_1H',
  { bookingId: booking.id },
  { singletonKey: `${booking.id}_reminder_1h` },
  reminderTime1h
)
```

**Handler:** Looks up booking, renders reminder email template, inserts `email_outbox` row, enqueues `EMAIL_SEND`.

---

### `BOOKING_CANCEL_REMINDERS`

Fires immediately on booking cancellation. Cancels pending reminder jobs by `singletonKey`.

```typescript
// Payload
type BookingCancelRemindersPayload = {
  bookingId: string
}

// Handler
export async function handleBookingCancelReminders(job: { data: BookingCancelRemindersPayload }) {
  const { bookingId } = job.data
  await boss.cancel('BOOKING_REMINDER_24H', `${bookingId}_reminder_24h`)
  await boss.cancel('BOOKING_REMINDER_1H',  `${bookingId}_reminder_1h`)
}
```

---

### `BOOKING_RESCHEDULE_REMINDERS`

Fires immediately on booking reschedule. Cancels old reminders, schedules new ones.

```typescript
// Payload
type BookingRescheduleRemindersPayload = {
  oldBookingId: string
  newBookingId: string
  newStartTime: string   // ISO 8601 UTC
}

// Handler
export async function handleBookingRescheduleReminders(job: { data: BookingRescheduleRemindersPayload }) {
  const { oldBookingId, newBookingId, newStartTime } = job.data

  // Cancel old reminder jobs
  await boss.cancel('BOOKING_REMINDER_24H', `${oldBookingId}_reminder_24h`)
  await boss.cancel('BOOKING_REMINDER_1H',  `${oldBookingId}_reminder_1h`)

  // Schedule new reminder jobs
  const start = new Date(newStartTime)
  const t24h = new Date(start.getTime() - 24 * 60 * 60 * 1000)
  const t1h  = new Date(start.getTime() -      60 * 60 * 1000)

  if (t24h > new Date()) {  // only schedule if in the future
    await boss.sendAfter('BOOKING_REMINDER_24H',
      { bookingId: newBookingId },
      { singletonKey: `${newBookingId}_reminder_24h` },
      t24h
    )
  }
  if (t1h > new Date()) {
    await boss.sendAfter('BOOKING_REMINDER_1H',
      { bookingId: newBookingId },
      { singletonKey: `${newBookingId}_reminder_1h` },
      t1h
    )
  }
}
```

---

### `VIDEO_LINK_GENERATE`

Generates a unique meeting room link for a booking (Zoom or Teams).

```typescript
// Payload
type VideoLinkGeneratePayload = {
  bookingId: string
  provider: 'zoom' | 'teams'
}

// pg-boss config
export const VIDEO_LINK_GENERATE_CONFIG = {
  retryLimit: 3,
  retryDelay: 5,
  retryBackoff: true,   // 5s → 30s → 120s
  singletonKey: (payload) => `${payload.bookingId}_video_link`,
}

// Handler outline
export async function handleVideoLinkGenerate(job: { data: VideoLinkGeneratePayload }) {
  const { bookingId, provider } = job.data
  const booking = await DbBookings.getById(bookingId)

  let link: string
  if (provider === 'zoom') {
    link = await createZoomMeeting(booking)
  } else {
    link = await createTeamsMeeting(booking)
  }

  await DbBookings.updateVideoLink(bookingId, link)
  // Note: Google Meet links are generated inside CALENDAR_WRITE handler (no separate job)
}
// On permanent failure (3 retries exhausted):
// - booking NOT blocked
// - enqueue EMAIL_SEND with template 'video-link-failed-host'
// - invitee confirmation email already sent with "Link will be sent shortly" fallback
```

---

### `VIDEO_LINK_RETRY`

Manual retry path for rate-limited video API calls.

```typescript
// Payload
type VideoLinkRetryPayload = {
  bookingId: string
  provider: 'zoom' | 'teams'
  attempt: number
}
// Handler: same as VIDEO_LINK_GENERATE but with manual delay based on `attempt`
```

---

### `CALENDAR_WRITE` / `CALENDAR_UPDATE` / `CALENDAR_CANCEL`

Calendar event mutations — create, update, and delete events on the host's connected calendar.

```typescript
// Shared payload shape
type CalendarMutationPayload = {
  bookingId: string
  connectedCalendarId: string
  externalEventId?: string   // required for UPDATE and CANCEL (stored on booking after first WRITE)
}

// pg-boss config (all three)
const CALENDAR_MUTATION_CONFIG = {
  retryLimit: 3,
  retryDelay: 15,
  retryBackoff: false,
}
```

**CALENDAR_WRITE handler:** Creates Google Calendar event (with `conferenceData.createRequest` for Meet link). On success, stores the `externalEventId` on the booking record.

**CALENDAR_UPDATE handler:** Calls `PATCH /calendars/{id}/events/{externalEventId}` with new time. Also updates the ICS file if Teams or custom location.

**CALENDAR_CANCEL handler:** Calls `DELETE /calendars/{id}/events/{externalEventId}`. Marks `bookings.calendarEventDeleted = true` on success.

---

### `CALENDAR_SYNC`

Recurring cron job. Refreshes the `calendar_events_cache` table for all connected calendars.

```typescript
// Payload: none (cron fires globally; handler queries all connected calendars)
// Schedule: every 5 minutes
// singletonKey: 'calendar_sync_global' (or per-calendar: 'calendar_sync_{calendarId}')

export const CALENDAR_SYNC_CONFIG = {
  singletonKey: 'calendar_sync_global',  // only one sync run at a time
}

// Handler:
// 1. SELECT all connected_calendars WHERE status = 'connected'
// 2. For each: call provider API to list events in the next 60 days
// 3. Upsert into calendar_events_cache
// 4. On token error: trigger CALENDAR_TOKEN_REFRESH
```

---

### `CALENDAR_TOKEN_REFRESH`

Refreshes an expired OAuth token before a calendar API call.

```typescript
// Payload
type CalendarTokenRefreshPayload = {
  connectedCalendarId: string
}

// pg-boss config
export const CALENDAR_TOKEN_REFRESH_CONFIG = {
  retryLimit: 3,
  retryDelay: 10,
}

// Handler:
// 1. Use stored refresh token to call provider OAuth token endpoint
// 2. On success: update connected_calendars.accessToken + tokenExpiresAt
// 3. On permanent failure (3 retries): enqueue CALENDAR_DISCONNECT_ALERT
```

---

### `CALENDAR_DISCONNECT_ALERT`

Fires when token refresh fails permanently. Disables booking pages and emails the host.

```typescript
// Payload
type CalendarDisconnectAlertPayload = {
  connectedCalendarId: string
  userId: string
}

// Handler:
// 1. DbCalendars.markDisconnected(connectedCalendarId)
//    → sets status = 'disconnected', disconnectedAt = now()
// 2. DbAudit.log({ action: 'calendar.disconnected', actorUserId: userId, targetId: connectedCalendarId })
// 3. Enqueue EMAIL_SEND:
//    template: 'calendar-disconnect-alert'
//    data: { hostName, providerName, reconnectUrl }
// Note: booking pages check calendar status at slot-generation time — no separate disable step needed
```

---

### `DISPOSABLE_EMAILS_REFRESH`

Daily cron. Syncs the disposable email domain blocklist from a public upstream source.

```typescript
// Payload: none
// Schedule: daily 04:00 UTC

// Handler:
// 1. Fetch domain list from upstream (e.g., https://disposable.github.io/disposable-email-domains/domains.txt)
// 2. Upsert into disposable_email_domains table
// 3. Log count of added/removed domains
```

---

## Queue Configuration (pg-boss init)

```typescript
// src/lib/worker/boss.ts
import PgBoss from 'pg-boss'

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  schema: 'pgboss',          // keeps pg-boss tables in a separate schema
  retentionDays: 30,         // keep completed jobs for 30 days
  deleteAfterDays: 7,        // delete completed jobs after 7 days
  monitorStateIntervalSeconds: 60,
})

await boss.start()
```

---

## localConcurrency — Per-Job Parallelism

`localConcurrency` (pg-boss calls it `teamConcurrency`) controls how many instances of a given job handler run **in parallel within the same worker process**. The default is `1` — each job type processes one job at a time.

Raising it only where the handler is provably safe to run in parallel avoids race conditions while maximising throughput for burst-tolerant jobs.

| Job | localConcurrency | Reason |
|-----|-----------------|--------|
| `EMAIL_SEND` | **5** | SMTP delivery is stateless and side-effect-free per row — five emails sending in parallel is safe and faster |
| `BOOKING_REMINDER_24H` | **5** | Read-only booking lookup + email enqueue — no shared mutable state |
| `BOOKING_REMINDER_1H` | **5** | Same as above |
| `VIDEO_LINK_GENERATE` | **3** | Zoom API allows parallel calls; keep at 3 to stay within Zoom rate limits |
| `CALENDAR_SYNC` | **3** | Fetching multiple users' calendars in parallel is safe; capped at 3 to avoid hitting provider rate limits |
| `CALENDAR_TOKEN_REFRESH` | **2** | Concurrent token refreshes for different calendars are safe; serialize per-calendar via singletonKey |
| `BOOKING_CANCEL_REMINDERS` | **3** | boss.cancel() calls are independent per booking |
| `BOOKING_RESCHEDULE_REMINDERS` | **3** | Same as above |
| All other jobs | **1** (default) | Serialized — any concurrency risk makes 1 the safe default |

**Jobs that must stay at 1:**

| Job | Why serialized |
|-----|---------------|
| `CALENDAR_WRITE` | Writing to the same calendar account from two goroutines could create duplicate events |
| `CALENDAR_UPDATE` | Must read the stored `externalEventId` before patching — concurrent updates could overwrite each other |
| `CALENDAR_CANCEL` | Same calendar event delete must be idempotent — serializing avoids double-cancel errors |
| `CALENDAR_DISCONNECT_ALERT` | Writes `status = 'disconnected'` — idempotent but no need to race |
| `EMAIL_OUTBOX_REAP` | Cron; single sweep is sufficient |
| `DISPOSABLE_EMAILS_REFRESH` | Cron; single upsert sweep |

---

## Dead-Letter Queue Monitoring — `workMonitored()`

When a pg-boss job exhausts all retries, it moves to `state = 'failed'` and stops. Without monitoring, this is silent — a failed job just sits in `pgboss.job` with no alert. The admin panel shows a failed count, but nobody is watching it at 3 AM.

`workMonitored()` is a thin wrapper around `boss.work()` that fires a dead-letter handler on the **final failed attempt** — before pg-boss transitions the job to `failed`. At MVP this logs prominently. In production it can also enqueue an admin alert email.

```typescript
// src/lib/worker/work-monitored.ts
import boss from './boss'
import type PgBoss from 'pg-boss'

// Called once when a job has exhausted all retries (final attempt threw).
// At MVP: structured error log — visible in any log aggregator (Datadog, Logtail, etc.).
// In production: also enqueue EMAIL_SEND with template 'admin-job-failed' to alert platform admin.
async function onDeadLetter(jobName: string, job: PgBoss.Job) {
  console.error('[worker:dlq] Job permanently failed — all retries exhausted', {
    jobName,
    jobId:      job.id,
    retryCount: job.retrycount,
    data:       job.data,
  })
}

export function workMonitored<T>(
  name: string,
  optsOrHandler: PgBoss.WorkOptions | ((job: PgBoss.Job<T>) => Promise<void>),
  handler?: (job: PgBoss.Job<T>) => Promise<void>,
) {
  const opts   = typeof optsOrHandler === 'function' ? {}           : optsOrHandler
  const handle = typeof optsOrHandler === 'function' ? optsOrHandler : handler!

  return boss.work<T>(name, opts, async (job) => {
    try {
      await handle(job)
    } catch (err) {
      // retryLimit comes from opts — default pg-boss value is 3 (0-indexed: 0, 1, 2)
      const retryLimit = (opts as { retryLimit?: number }).retryLimit ?? 3
      if (job.retrycount >= retryLimit - 1) {
        // This is the last attempt. After this throw, pg-boss marks the job 'failed'.
        await onDeadLetter(name, job as PgBoss.Job)
      }
      throw err  // always re-throw — never swallow errors here
    }
  })
}
```

**Rule:** Replace every `boss.work(...)` in `src/lib/worker/index.ts` with `workMonitored(...)`. The signature is identical — it is a drop-in replacement.

```typescript
// Before:
await boss.work('EMAIL_SEND', { teamSize: 5, teamConcurrency: 5 }, handleEmailSend)

// After (drop-in replacement — same args):
await workMonitored('EMAIL_SEND', { teamSize: 5, teamConcurrency: 5 }, handleEmailSend)
```

**What the dead-letter log entry looks like:**

```
[worker:dlq] Job permanently failed — all retries exhausted {
  jobName: 'VIDEO_LINK_GENERATE',
  jobId: 'abc123',
  retryCount: 2,
  data: { bookingId: 'xyz789', provider: 'zoom' }
}
```

This gives enough context to debug the failure manually — which booking, which job type, what the payload was. The admin job monitor at `/admin/jobs` also shows all `failed` state jobs from `pgboss.job`.

---

## Worker Entry Point

```typescript
// src/lib/worker/index.ts  (run via: pnpm worker)
import boss from './boss'
import { workMonitored } from './work-monitored'
import { handleEmailSend } from './handlers/email-send'
import { handleBookingReminder24h } from './handlers/booking-reminder-24h'
import { handleBookingReminder1h } from './handlers/booking-reminder-1h'
import { handleBookingCancelReminders } from './handlers/booking-cancel-reminders'
import { handleBookingRescheduleReminders } from './handlers/booking-reschedule-reminders'
import { handleVideoLinkGenerate } from './handlers/video-link-generate'
import { handleVideoLinkRetry } from './handlers/video-link-retry'
import { handleCalendarWrite } from './handlers/calendar-write'
import { handleCalendarUpdate } from './handlers/calendar-update'
import { handleCalendarCancel } from './handlers/calendar-cancel'
import { handleCalendarSync } from './handlers/calendar-sync'
import { handleCalendarTokenRefresh } from './handlers/calendar-token-refresh'
import { handleCalendarDisconnectAlert } from './handlers/calendar-disconnect-alert'
import { handleEmailOutboxReap } from './handlers/email-outbox-reap'
import { handleEmailEventsPrune } from './handlers/email-events-prune'
import { handleDisposableEmailsRefresh } from './handlers/disposable-emails-refresh'

// Register all job handlers via workMonitored() — drop-in replacement for boss.work()
// that fires the dead-letter handler on final failed attempt.
// localConcurrency (teamConcurrency) — see localConcurrency section above for reasoning.
await workMonitored('EMAIL_SEND',                  { teamSize: 5, teamConcurrency: 5 }, handleEmailSend)
await workMonitored('BOOKING_REMINDER_24H',        { teamSize: 5, teamConcurrency: 5 }, handleBookingReminder24h)
await workMonitored('BOOKING_REMINDER_1H',         { teamSize: 5, teamConcurrency: 5 }, handleBookingReminder1h)
await workMonitored('BOOKING_CANCEL_REMINDERS',    { teamSize: 3, teamConcurrency: 3 }, handleBookingCancelReminders)
await workMonitored('BOOKING_RESCHEDULE_REMINDERS',{ teamSize: 3, teamConcurrency: 3 }, handleBookingRescheduleReminders)
await workMonitored('VIDEO_LINK_GENERATE',         { teamSize: 3, teamConcurrency: 3 }, handleVideoLinkGenerate)
await workMonitored('VIDEO_LINK_RETRY',            handleVideoLinkRetry)                // 1 — default
await workMonitored('CALENDAR_WRITE',              handleCalendarWrite)                 // 1 — must serialize
await workMonitored('CALENDAR_UPDATE',             handleCalendarUpdate)                // 1 — must serialize
await workMonitored('CALENDAR_CANCEL',             handleCalendarCancel)                // 1 — must serialize
await workMonitored('CALENDAR_SYNC',               { teamSize: 3, teamConcurrency: 3 }, handleCalendarSync)
await workMonitored('CALENDAR_TOKEN_REFRESH',      { teamSize: 2, teamConcurrency: 2 }, handleCalendarTokenRefresh)
await workMonitored('CALENDAR_DISCONNECT_ALERT',   handleCalendarDisconnectAlert)       // 1 — default

// Register cron schedules
await boss.schedule('EMAIL_OUTBOX_REAP',          '0 3 * * *', {},   { tz: 'UTC' })
await boss.schedule('EMAIL_EVENTS_PRUNE',         '30 3 * * *', {},  { tz: 'UTC' })
await boss.schedule('DISPOSABLE_EMAILS_REFRESH',  '0 4 * * *', {},   { tz: 'UTC' })
await boss.schedule('CALENDAR_SYNC',              '*/5 * * * *', {}, { tz: 'UTC' })

// Graceful shutdown — MUST be at the end of index.ts, after all handlers are registered.
// Without this, killing the worker process (deploy restart, Ctrl+C, pm2 reload) cuts
// off any job that is mid-execution — the job is left in 'active' state forever and
// is never retried. boss.stop({ graceful: true }) waits for running handlers to finish
// before closing the pg-boss connection, up to the timeout.
async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received — draining active jobs...`)
  await boss.stop({ graceful: true, timeout: 30_000 })  // 30s max drain window
  console.log('[worker] stopped cleanly')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))  // sent by pm2 / systemd / Docker on stop
process.on('SIGINT',  () => shutdown('SIGINT'))   // sent by Ctrl+C in development
```

> **Why this matters:** pm2 and Docker send `SIGTERM` before `SIGKILL`. The 30-second window lets any in-progress `EMAIL_SEND` or `CALENDAR_WRITE` job finish before the process exits. Without it, a job killed mid-send could mark the email as `failed` even though the SMTP server accepted it — causing a duplicate resend on the next retry.

---

## Worker File Structure

```
src/lib/worker/
  boss.ts                       ← pg-boss client init
  index.ts                      ← Entry point; registers all handlers + crons
  job-types.ts                  ← TypeScript payload types for all 16 jobs
  handlers/
    email-send.ts               ← EMAIL_SEND
    email-outbox-reap.ts        ← EMAIL_OUTBOX_REAP (cron)
    email-events-prune.ts       ← EMAIL_EVENTS_PRUNE (cron)
    booking-reminder-24h.ts     ← BOOKING_REMINDER_24H
    booking-reminder-1h.ts      ← BOOKING_REMINDER_1H
    booking-cancel-reminders.ts ← BOOKING_CANCEL_REMINDERS
    booking-reschedule-reminders.ts ← BOOKING_RESCHEDULE_REMINDERS
    video-link-generate.ts      ← VIDEO_LINK_GENERATE
    video-link-retry.ts         ← VIDEO_LINK_RETRY
    calendar-write.ts           ← CALENDAR_WRITE
    calendar-update.ts          ← CALENDAR_UPDATE
    calendar-cancel.ts          ← CALENDAR_CANCEL
    calendar-sync.ts            ← CALENDAR_SYNC (cron)
    calendar-token-refresh.ts   ← CALENDAR_TOKEN_REFRESH
    calendar-disconnect-alert.ts ← CALENDAR_DISCONNECT_ALERT
    disposable-emails-refresh.ts ← DISPOSABLE_EMAILS_REFRESH (cron)
```

---

## Complete Cron Schedule

| Job | Schedule | Purpose |
|-----|----------|---------|
| `CALENDAR_SYNC` | Every 5 min (`*/5 * * * *`) | Refresh free/busy cache for all connected calendars |
| `EMAIL_OUTBOX_REAP` | Daily 03:00 UTC (`0 3 * * *`) | Delete email_outbox rows >90 days (sent/failed) |
| `EMAIL_EVENTS_PRUNE` | Daily 03:30 UTC (`30 3 * * *`) | Delete email_events rows >30 days |
| `DISPOSABLE_EMAILS_REFRESH` | Daily 04:00 UTC (`0 4 * * *`) | Sync disposable email domain blocklist from upstream |

---

## Job State Machine (pg-boss)

```
         ┌─────────┐
         │ created │  ← boss.send() / boss.sendAfter()
         └────┬────┘
              │ worker picks up
         ┌────▼────┐
         │ active  │  ← handler is running
         └────┬────┘
        ┌─────┴──────┐
        │            │
   ┌────▼────┐  ┌────▼──────┐
   │completed│  │  failed   │  ← thrown error or retries exhausted
   └─────────┘  └──────┬────┘
                       │ retryLimit not reached
                  ┌────▼────┐
                  │ retry   │  → back to created with delay
                  └─────────┘
```

---

## Email Outbox Pattern (How Every Email Goes Through pg-boss)

```
Server Action / API Route
         │
         ▼
  1. Insert email_outbox row (status = pending)    ← inside DB transaction
  2. boss.send('EMAIL_SEND', { emailOutboxId })    ← after transaction commits
         │
         ▼
  EMAIL_SEND job handler
  3. Fetch email_outbox row
  4. Render React Email template with templateData
  5. Send via Nodemailer SMTP
  6. Update email_outbox.status = 'sent'
  7. Insert email_events row (event_type = 'delivered')
         │
         │ (on failure: pg-boss auto-retries 3×)
         ▼
  On permanent failure:
  8. Update email_outbox.status = 'failed'
  9. email_events row with event_type = 'failed'
```

---

## Enqueueing Pattern (Shared Utility)

```typescript
// src/lib/worker/enqueue.ts
import boss from './boss'

export async function enqueueEmail(data: {
  toEmail: string
  toName?: string
  subject: string
  template: string
  templateData: Record<string, unknown>
  fromName?: string
  replyToEmail?: string
  bookingId?: string
  userId?: string
}) {
  const [outboxRow] = await DbEmail.enqueue(data)
  await boss.send('EMAIL_SEND', { emailOutboxId: outboxRow.id })
  return outboxRow
}

export async function scheduleBookingReminders(booking: {
  id: string
  startTime: Date
}) {
  const t24h = new Date(booking.startTime.getTime() - 24 * 60 * 60 * 1000)
  const t1h  = new Date(booking.startTime.getTime() -      60 * 60 * 1000)

  if (t24h > new Date()) {
    await boss.sendAfter('BOOKING_REMINDER_24H',
      { bookingId: booking.id },
      { singletonKey: `${booking.id}_reminder_24h` },
      t24h
    )
  }
  if (t1h > new Date()) {
    await boss.sendAfter('BOOKING_REMINDER_1H',
      { bookingId: booking.id },
      { singletonKey: `${booking.id}_reminder_1h` },
      t1h
    )
  }
}

export async function cancelBookingReminders(bookingId: string) {
  await boss.cancel('BOOKING_REMINDER_24H', `${bookingId}_reminder_24h`)
  await boss.cancel('BOOKING_REMINDER_1H',  `${bookingId}_reminder_1h`)
}
```

---

## Admin Panel Job Monitoring

The admin panel (`/admin/jobs`) queries `pgboss.job` directly:

```typescript
// In an admin Server Component
import db from '@/lib/db'
import { sql } from 'drizzle-orm'

// Failed jobs count (for dashboard stats card)
const [{ count }] = await db.execute(
  sql`SELECT COUNT(*) as count FROM pgboss.job WHERE state = 'failed'`
)

// Job list for /admin/jobs table
const jobs = await db.execute(
  sql`SELECT id, name, state, createdon, startedon, completedon, retrycount, output
      FROM pgboss.job
      WHERE state = ${state}  -- 'created' | 'active' | 'completed' | 'failed'
      ORDER BY createdon DESC
      LIMIT 25 OFFSET ${offset}`
)
```

> **Note:** `pgboss.job` is in the `pgboss` schema, not `public`. It is queried via raw SQL, not Drizzle ORM migrations, because `schemaFilter: ['public']` intentionally excludes it.
