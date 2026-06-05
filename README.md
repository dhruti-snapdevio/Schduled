# Schedica

> A modern, intelligent scheduling platform — built for teams, freelancers, and revenue teams who need more than a simple booking link.

---

## Project Overview

**Schedica** is a web-based appointment scheduling and meeting automation platform. It eliminates the back-and-forth of finding meeting times by letting users share a booking link where others can self-schedule based on real-time calendar availability.

Schedica is inspired by the best of the scheduling market — the simplicity of **Calendly**, the openness of **Cal.com**, the conversion focus of **Chili Piper**, the CRM depth of **HubSpot Meetings**, and the UX innovation of **SavvyCal** — combined into a single, cohesive product.

### Target Users

| Segment | Use Case |
|---------|----------|
| Freelancers / Solopreneurs | Simple booking links, self-scheduling |
| Sales Teams | Lead routing, round-robin assignment |
| Customer Success | Client onboarding, support call scheduling |
| Recruiters | Interview scheduling, multi-interviewer collective events |
| Consultants / Coaches | Session scheduling, package bookings |
| Enterprises | Team workspaces, SSO, compliance, advanced routing |

---

## Tech Stack

### Frontend & Framework

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** (App Router) | React framework — server components, server actions, API routes, SSR/SSG |
| **TypeScript** | Type safety across the entire codebase — frontend, backend, and DB schema |

### Database

| Technology | Purpose |
|-----------|---------|
| **PostgreSQL 16+** | Primary relational database — stores users, event types, bookings, availability, jobs |
| **Drizzle ORM** | TypeScript-first ORM — schema-as-code, type-safe queries, built-in migration runner |

### Background Jobs & Queues

| Technology | Purpose |
|-----------|---------|
| **pg-boss** | PostgreSQL-backed job queue — schedules and processes async tasks such as sending reminder emails, syncing calendar events, delivering webhooks, and processing no-show follow-ups. Uses the same Postgres database (no Redis required). |

> **Why pg-boss over Redis/BullMQ:** pg-boss stores jobs inside PostgreSQL, keeping the infrastructure simple — one fewer service to provision, monitor, and scale. It supports scheduled jobs (cron), retries with exponential backoff, job priorities, and exactly-once delivery.

### Authentication

| Technology | Purpose |
|-----------|---------|
| **Better Auth** | Full-stack authentication library — email/password, Google OAuth, magic links, sessions, 2FA (TOTP), refresh token rotation |
| **Better Auth — Admin Plugin** | Adds an admin API layer: list/ban/impersonate users, manage sessions, view audit logs, revoke tokens — consumed by the custom admin panel |

### Admin Panel

| Technology | Purpose |
|-----------|---------|
| **Custom Next.js Admin** | Hand-built admin pages at `/admin` using Next.js App Router + Shadcn/UI — user management, booking oversight, job queue monitor, platform settings. Protected by Better Auth admin role check. No third-party admin dependency. |

### UI & Styling

| Technology | Purpose |
|-----------|---------|
| **Tailwind CSS** | Utility-first CSS — all booking page, dashboard, and admin UI styles |
| **Shadcn/UI** | Pre-built accessible component library (buttons, modals, calendars, dropdowns) built on Radix UI primitives — used across dashboard and booking pages |

### External APIs & Calendar Integrations

| Service | Purpose |
|---------|---------|
| **Google Calendar API** | Read free/busy events from Google Calendar; write new bookings; auto-generate Google Meet links via `conferenceData` on event creation |
| **Microsoft Graph API** | Read/write Outlook & Office 365 calendars; create Teams meetings via `/onlineMeetings` endpoint |
| **Apple CalDAV / iCloud** *(Phase 2)* | Read/write iCloud calendars using the CalDAV protocol with an app-specific password — no OAuth required; deferred post-MVP due to protocol complexity |
| **Zoom API (OAuth 2.0)** | Create a unique Zoom meeting room per booking via the Zoom Meetings API |

### Email

| Library | Purpose |
|---------|---------|
| **Nodemailer** | SMTP email delivery — connects to any SMTP server (self-hosted or provider); sends booking confirmations, reminders, password resets, cancellation notices |
| **React Email** | Component-based email template rendering — type-safe, styled React components compiled to HTML and passed to Nodemailer for delivery |
| **ical-generator** | Generates RFC 5545-compliant `.ics` calendar invite files — attached to confirmation emails via Nodemailer |

### File Storage

| Library | Purpose |
|---------|---------|
| **@aws-sdk/client-s3** | S3-compatible storage SDK — stores user-uploaded files (profile photos, logos, banners). Works with any S3-compatible provider: AWS S3, Cloudflare R2, MinIO, Backblaze B2, DigitalOcean Spaces. |
| **@aws-sdk/s3-request-presigner** | Generates presigned S3 URLs — allows browsers to upload files directly to the storage bucket without routing through the Next.js server |

### Key Libraries

| Library | Purpose |
|---------|---------|
| **Zod** | Runtime validation for all API request bodies, form inputs, and environment variables |
| **date-fns** | Date arithmetic — adding/subtracting durations, formatting dates |
| **date-fns-tz** | Timezone-aware date arithmetic using IANA timezone names — DST-safe slot calculation and display |
| **console.log / console.error** | Built-in Node.js logging — used for errors, warnings, and key events; no additional library needed |

---

## Feature → Tools Reference

Which library or service each feature depends on. Use this as a quick lookup during implementation — each feature's `features/*.md` file has a full Tech Stack section with implementation details.

| # | Feature | Tools / Libraries Needed |
|---|---------|--------------------------|
| 1 | **Landing Page** | Next.js 15 (Server Components), Tailwind CSS, Shadcn/UI, Next.js Metadata API, `next/image`, `next/font` |
| 2 | **User Onboarding & Auth** | Better Auth (email/password, Google OAuth, magic link), Nodemailer (SMTP), React Email, Next.js App Router |
| 3 | **User Profile & Settings** | Better Auth, S3-compatible storage + `@aws-sdk/client-s3` + `s3-request-presigner` (photo upload), pg-boss (GDPR export), Nodemailer, Drizzle ORM, Shadcn/UI |
| 4 | **Event Type Builder** | Drizzle ORM, Next.js Server Actions, Next.js ISR (`revalidatePath`), Shadcn/UI |
| 5 | **Availability Management** | Drizzle ORM, `date-fns-tz`, Next.js Server Actions, Shadcn/UI |
| 6 | **Timezone Management** | `date-fns-tz`, Drizzle ORM, `ical-generator`, Browser `Intl.DateTimeFormat` API |
| 7 | **Calendar Integrations** | `googleapis` (Google Calendar API), `@microsoft/microsoft-graph-client` (Outlook + Teams), `tsdav` *(Phase 2 — Apple CalDAV)*, Drizzle ORM, pg-boss (sync job) |
| 8 | **Public Booking Page** | Next.js App Router (dynamic routes), Next.js ISR, Next.js Metadata API, Tailwind CSS, Shadcn/UI, Drizzle ORM, `date-fns-tz` |
| 9 | **Booking Engine** | PostgreSQL advisory locks (`pg_advisory_xact_lock`), Drizzle ORM, Zod, pg-boss (post-booking jobs), Next.js API Route |
| 10 | **Custom Questions** | Drizzle ORM, Zod (answer validation + HTML strip), Shadcn/UI, Next.js App Router |
| 11 | **Video Conferencing** | Zoom API (OAuth 2.0), `googleapis` (Google Meet via Calendar API), `@microsoft/microsoft-graph-client` (Teams), Drizzle ORM, pg-boss |
| 12 | **Booking Confirmation** | pg-boss (async after DB commit), Nodemailer (SMTP), React Email, `ical-generator` (ICS), `googleapis` (host calendar event), `@microsoft/microsoft-graph-client` (Outlook event) |
| 13 | **Notifications & Reminders** | pg-boss (schedule 24h + 1h jobs), Nodemailer (SMTP), React Email (reminder templates), Drizzle ORM |
| 14 | **Meetings Dashboard** | Drizzle ORM (bookings + joins), Better Auth (session check), pg-boss (cancel reminders on host cancel), Shadcn/UI, Next.js Server Components |
| 15 | **Cancellation & Reschedule** | Drizzle ORM (token lookup + atomic status update), pg-boss (cancel/reschedule reminder jobs), Nodemailer + React Email (notification emails), Next.js App Router |
| 16 | **Admin Panel** | Better Auth Admin Plugin (`listUsers`, `banUser`, `impersonateUser`, `revokeUserSessions`), Drizzle ORM (bookings + pgboss.job queries), Shadcn/UI, Nodemailer, pg-boss Node.js API (retry/cancel jobs) |

> **Cross-feature tools used everywhere:** PostgreSQL 16+ (primary DB) · Drizzle ORM (all DB access) · Next.js 15 App Router (all pages/routes) · TypeScript (whole stack) · Tailwind CSS + Shadcn/UI (all UI) · Zod (all API validation) · Better Auth (all protected routes) · pg-boss (all async jobs)

---

## Core Functionality

Schedica is organized around five core pillars:

### 1. Smart Scheduling
- Create 1-on-1 event types *(MVP)*
- Group, round-robin, and collective event types *(Phase 2 — 1-on-1 only in MVP)*
- Connect calendars and sync availability in real-time *(MVP)*
- Share booking links that auto-update as availability changes *(MVP)*

### 2. Team Coordination *(Phase 2)*
- Distribute meetings across team members (round-robin, priority, weighted)
- Require multiple hosts available simultaneously (collective)
- Manage team workspaces with admin controls

### 3. Booking Experience
- Customizable booking pages with branding *(MVP)*
- Custom intake questions before booking *(MVP)*
- Calendar overlay so invitees see mutual availability *(Phase 3)*

### 4. Automation & Workflows
- Automated email reminders (24hr and 1hr pre-meeting) *(MVP)*
- Pre-meeting confirmation emails *(MVP)*
- Post-meeting follow-up emails *(Phase 2)*
- Webhook triggers for any event *(Phase 2)*

### 5. Insights & Growth
- Lead qualification routing forms *(Phase 2)*
- Analytics dashboard to track meeting performance *(Phase 2)*

---

## MVP Feature List

The MVP focuses on delivering a complete solo + small team scheduling experience.

### Phase 1 — Core MVP (Solo Users)

| # | Feature | Description |
|---|---------|-------------|
| 1 | Landing Page | Public marketing page — hero, features, how it works, comparison table, FAQ, footer; `/privacy`, `/terms`, `/cookies` legal pages |
| 2 | User Onboarding | Sign up, sign in, email verification, password reset (Google OAuth + magic link); guided first-run wizard to connect calendar, set timezone, create first event type, and get booking link |
| 3 | User Profile & Settings | Name, photo, timezone, connected calendars, notification preferences, 2FA, account security |
| 4 | Event Type Builder | Create unlimited event types; multiple duration options per link; invitees can add up to 10 additional guests per booking |
| 5 | Availability Settings | Set weekly hours, buffer times, minimum notice, daily limits, date-specific overrides |
| 6 | Timezone Management | Auto-detect invitee timezone, manual override, both timezones shown in every email and confirmation |
| 7 | Calendar Sync | Real-time free/busy sync with Google Calendar and Outlook — prevents double-booking. Apple iCloud CalDAV — Phase 2. |
| 8 | Booking Page | Public-facing scheduling page with available time slots, host branding, and profile overview |
| 9 | Booking Engine | Core booking processor — slot locking, conflict check, calendar write, async post-booking jobs |
| 10 | Custom Questions | Add intake questions to booking form (text, dropdown, checkbox, phone, multi-select) |
| 11 | Video Conferencing | Auto-generate unique Zoom / Google Meet / Teams links per booking |
| 12 | Booking Confirmation | Confirmation screen + email with both timezones, calendar invite (.ics), and add-to-calendar buttons |
| 13 | Notifications & Reminders | Automated 24-hour and 1-hour email reminders; instant host notification on new booking |
| 14 | Meetings Dashboard | View all upcoming and past meetings; search, filter, private notes, and manage bookings |
| 15 | Cancellation & Reschedule | Invitee-initiated cancellation and reschedule via secure email link; host can cancel from dashboard |
| 16 | Admin Panel | Platform admin dashboard — user management (ban, impersonate), booking oversight, job queue monitor, platform settings |

### Future Roadmap (Post-MVP)

| Phase | Feature | Description |
|-------|---------|-------------|
| 2 | Team Workspaces | Invite team members, shared event types, admin controls |
| 2 | Round-Robin Scheduling | Auto-distribute meetings among team members |
| 2 | Collective Events | Require multiple hosts available simultaneously |
| 2 | Routing Forms | Qualify and route leads to the right team member |
| 2 | Scheduling Outreach | Send specific available times; single-use booking links |
| 2 | Meeting Polls | Propose times; participants vote; host confirms winner |
| 2 | Website Embeds | Inline, pop-up, and widget embeds for any website |
| 2 | Analytics Dashboard | Meeting stats, cancellation rates, no-show tracking |
| 2 | Webhooks | Send booking data to external apps in real-time |
| 2 | AI Notetaker | Auto-join, record, transcribe, summarize with action items |
| 3 | Browser Extension | Chrome/Outlook extension; share times directly in Gmail |
| 3 | Calendar Overlay | Invitees see mutual availability (SavvyCal-style) |
| 3 | Mobile App | iOS & Android native apps |
| 4 | SSO / SAML | Enterprise single sign-on (Okta, Azure AD, Google Workspace) |
| 4 | Custom Domain | Host booking pages on your own domain |
| 4 | Audit Logs | Activity log for all scheduling events — compliance-ready |
| 4 | HIPAA Compliance | BAA agreements and healthcare-grade privacy |
| 4 | Advanced Routing | Territory, account ownership, CRM lookup-based routing |
| 4 | SCIM Provisioning | Automatic user provisioning via identity provider |

---

## Competitive Landscape

| Product | Strength | Gap Schedica Fills |
|---------|----------|-------------------|
| **Calendly** | Market leader, ease of use | Expensive for teams; dropped Apple Calendar support; shows only one timezone |
| **Cal.com** | Open source, generous free tier | Complex self-hosting; less polished UX |
| **Acuity Scheduling** | Deep appointment customization, built-in payments | Outdated UI; no real-time calendar overlay; weak team routing |
| **Microsoft Bookings** | Native Microsoft 365 integration | No invitee timezone auto-detect; limited customization; tied to Microsoft ecosystem |
| **Chili Piper** | Best-in-class B2B lead routing | Extremely expensive; Salesforce-only; steep learning curve |
| **HubSpot Meetings** | Native CRM integration | Tied to HubSpot; basic features on free tier |
| **SavvyCal** | Best booking UX (calendar overlay) | No free tier; small ecosystem |

**Schedica's positioning:** A polished, open source scheduling platform with SavvyCal-quality UX, Calendly-level features, and Chili Piper-inspired lead routing — free for everyone to use and self-host.



## Project Structure (Planned)

Single Next.js application — frontend, API routes, and server actions all in one repo. No separate API server needed.

```
schedica/
│
├── src/
│   │
│   ├── middleware.ts                     # Route protection — redirects unauthenticated users, guards admin routes
│   │
│   ├── app/                              # Next.js App Router
│   │   │
│   │   ├── (auth)/                       # Auth pages — unauthenticated routes
│   │   │   ├── sign-in/                  # Sign-in page (email/password + OAuth buttons)
│   │   │   ├── sign-up/                  # Sign-up + onboarding entry point
│   │   │   ├── forgot-password/          # Forgot password — request reset email
│   │   │   ├── reset-password/           # Reset password — consume token from email
│   │   │   └── verify-email/             # Email verification — enter 6-digit code
│   │   │
│   │   ├── (dashboard)/                  # Host dashboard — protected (requires login)
│   │   │   ├── dashboard/                # Meetings overview + quick stats
│   │   │   ├── event-types/              # Event type builder and management
│   │   │   ├── availability/             # Weekly schedule, date overrides, limits
│   │   │   ├── integrations/             # Connect Zoom, Google, Outlook, Apple Calendar
│   │   │   └── settings/                 # Profile, timezone, notifications, security
│   │   │
│   │   ├── (admin)/                      # Custom admin panel — platform administration
│   │   │   └── admin/                    # Protected by Better Auth admin role
│   │   │       ├── users/                # User list, ban, impersonate (via Better Auth admin plugin)
│   │   │       ├── bookings/             # Platform-wide booking oversight
│   │   │       ├── jobs/                 # pg-boss job queue monitor and retry UI
│   │   │       └── settings/             # Platform configuration
│   │   │
│   │   ├── onboarding/                   # First-run onboarding wizard (5 steps)
│   │   │
│   │   ├── [username]/                   # Public booking pages — no auth required
│   │   │   └── [eventSlug]/              # Specific event type booking page
│   │   │       └── confirmed/            # Post-booking confirmation page
│   │   │
│   │   └── api/                          # Next.js API routes
│   │       ├── auth/
│   │       │   └── [...all]/             # Better Auth universal handler (all auth endpoints)
│   │       ├── bookings/                 # Booking creation, cancellation, reschedule
│   │       ├── calendars/                # Calendar OAuth callbacks + push notification receivers
│   │       ├── video/                    # Zoom / Teams meeting link generation
│   │       └── webhooks/                 # Outbound webhook delivery to external apps (Phase 2)
│   │
│   ├── components/
│   │   ├── booking/                      # Booking page, date picker, slot grid, confirmation screen
│   │   ├── dashboard/                    # Meetings list, event type cards, stats bar
│   │   ├── onboarding/                   # Step-by-step onboarding wizard components
│   │   └── ui/                           # Shared UI primitives (buttons, inputs, modals)
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── config.ts                 # Better Auth instance — providers, plugins, session config
│   │   │   ├── admin-plugin.ts           # Better Auth admin plugin — user management API
│   │   │   └── client.ts                 # Better Auth client (used in client components)
│   │   │
│   │   ├── db/
│   │   │   ├── schema/                   # Drizzle ORM schema — one file per domain
│   │   │   │   ├── users.ts              # users, accounts, sessions (Better Auth tables)
│   │   │   │   ├── event-types.ts        # event_types, availability_schedules
│   │   │   │   ├── bookings.ts           # bookings, booking_answers, cancellations
│   │   │   │   ├── calendars.ts          # connected_calendars, calendar_events_cache
│   │   │   │   ├── notifications.ts      # notification_preferences, workflow_templates
│   │   │   ├── index.ts                  # Drizzle client + db connection (postgres.js)
│   │   │   └── queries/                  # Reusable query helpers per domain
│   │   │
│   │   ├── email/
│   │   │   ├── client.ts                 # Nodemailer SMTP transporter (singleton)
│   │   │   ├── send.ts                   # send() wrapper — renders template + delivers via SMTP
│   │   │   └── templates/                # React Email components (one file per email type)
│   │   │       ├── booking-confirmation.tsx
│   │   │       ├── booking-notification.tsx
│   │   │       ├── reminder.tsx          # Shared template for 24h and 1h reminders
│   │   │       ├── cancellation.tsx
│   │   │       ├── reschedule.tsx
│   │   │       ├── welcome.tsx
│   │   │       └── verification.tsx      # Email verification code email
│   │   │
│   │   ├── storage/
│   │   │   ├── client.ts                 # S3-compatible storage client (S3Client singleton)
│   │   │   └── upload.ts                 # upload(), deleteFile(), getPresignedUrl() helpers
│   │   │
│   │   └── jobs/
│   │       ├── client.ts                 # pg-boss instance (shared singleton)
│   │       ├── workers/                  # Job handler functions (one file per job type)
│   │       │   ├── send-reminder.ts      # 24h / 1h pre-meeting reminder emails
│   │       │   ├── send-followup.ts      # Post-meeting follow-up emails
│   │       │   ├── sync-calendar.ts      # Periodic calendar free/busy sync
│   │       │   ├── generate-video.ts     # Async Zoom / Teams link generation
│   │       │   └── deliver-webhook.ts    # Outbound webhook delivery with retries
│   │       └── scheduler.ts             # Job registration and cron schedule definitions
│   │
│   └── types/
│       ├── booking.ts                    # Booking, Invitee, BookingStatus types
│       ├── event-type.ts                 # EventType, LocationType, AvailabilityRule types
│       └── calendar.ts                   # CalendarProvider, CalendarEvent, FreeBusy types
│
├── drizzle/                              # Drizzle migration files (auto-generated)
│   ├── 0001_initial_schema.sql
│   └── meta/                             # Drizzle migration metadata
│
├── features/                             # Feature documentation (16 files)
│   │
│   ├── — Platform —
│   ├── landing-page.md                   # Public marketing page — sections, SEO, CTAs, legal pages
│   ├── admin-panel.md                    # Custom admin panel — user mgmt, bookings, job queue, settings
│   │
│   ├── — Account & Profile —
│   ├── user-onboarding.md                # Sign-up, sign-in, email verification, password reset, OAuth, onboarding wizard
│   ├── user-profile-settings.md          # Name, photo, timezone, calendars, 2FA, GDPR export, account
│   │
│   ├── — Scheduling Setup —
│   ├── event-types.md                    # 1:1, Group, Round-Robin, Collective; all settings
│   ├── availability-management.md        # Weekly hours, buffers, limits, date overrides
│   ├── calendar-integrations.md          # Google, Outlook, Apple/iCloud, CalDAV
│   ├── timezone-management.md            # Host/invitee timezone, DST, confirmation emails
│   │
│   ├── — Booking Experience —
│   ├── booking-page-customization.md     # Branding, colors, logo, custom messages (MVP); custom domain (Phase 4)
│   ├── custom-questions.md               # Intake form question types and configuration
│   ├── video-conferencing.md             # Zoom, Meet, Teams (MVP); Webex (Phase 2)
│   ├── booking-engine.md                 # Core booking processor, race conditions, retries
│   ├── booking-confirmation.md           # Confirmation screen, emails, ICS, calendar writes
│   │
│   ├── — Management & Communication —
│   ├── meetings-dashboard.md             # Upcoming/past meetings, search, filters, detail view
│   ├── notifications-reminders.md        # Transactional emails, 24h+1h reminders (MVP); SMS reminders (Phase 2)
│   └── booking-flow.md                   # Full booking flow, cancellation & reschedule policies
│
└── README.md
```

---

## Key Differentiators

1. **Apple Calendar Support** — Native iCloud/Apple Calendar sync; Calendly dropped this in August 2024
2. **Both Timezones in Every Email** — Confirmation and reminder emails show the invitee's time AND the host's time; Calendly only shows one timezone
3. **Cancellation Policy Enforcement** — Calendly only displays policy text; Schedica actually blocks cancellations within the configured window
4. **Unlimited Custom Questions** — No limits on intake questions; Calendly restricts questions behind paid plans
5. **Multi-Duration Event Types** — One booking link can offer 15, 30, and 60-min options; invitee picks at booking time
6. **Meeting Overload Protection** — Daily meeting limits, buffer times, and minimum notice periods prevent back-to-back burnout
7. **Fully Open Source** — All features free, self-hostable, no paywalls or plan tiers

---

## References

- [Calendly](https://calendly.com) — Market leader, benchmark for core scheduling UX
- [Cal.com](https://cal.com) — Open source reference implementation
- [Chili Piper](https://chilipiper.com) — B2B lead routing and sales scheduling
- [HubSpot Meetings](https://hubspot.com/products/sales/schedule-meeting) — CRM-native scheduling
- [SavvyCal](https://savvycal.com) — Calendar overlay UX inspiration
