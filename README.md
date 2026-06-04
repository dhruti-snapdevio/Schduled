# Schedica

> A modern, intelligent scheduling platform — built for teams, freelancers, and revenue teams who need more than a simple booking link.

---

## Project Overview

**Schedica** is a web-based appointment scheduling and meeting automation platform. It eliminates the back-and-forth of finding meeting times by letting users share a booking link where others can self-schedule based on real-time calendar availability.

Schedica is inspired by the best of the scheduling market — the simplicity of **Calendly**, the openness of **Cal.com**, the conversion focus of **Chili Piper**, the CRM depth of **HubSpot Meetings**, and the UX innovation of **SavvyCal** — combined into a single, cohesive product.

### Target Users

| Segment | Use Case |
|---------|----------|
| Freelancers / Solopreneurs | Simple booking links, payment collection |
| Sales Teams | Lead routing, round-robin assignment |
| Customer Success | Client onboarding, support call scheduling |
| Recruiters | Interview scheduling, multi-interviewer collective events |
| Consultants / Coaches | Paid sessions, package bookings |
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
| **Better Auth** | Full-stack authentication library — email/password, Google OAuth, Microsoft OAuth, magic links, sessions, 2FA (TOTP), refresh token rotation |
| **Better Auth — Admin Plugin** | Adds an admin API layer: list/ban/impersonate users, manage sessions, view audit logs, revoke tokens — consumed by the Orbit Admin panel |

### Admin Dashboard

| Technology | Purpose |
|-----------|---------|
| **Orbit Admin** | Pre-built admin dashboard UI — user management, system metrics, booking oversight, platform configuration. Sits at `/admin` (protected by Better Auth admin role). |

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
| **Apple CalDAV / iCloud** | Read/write iCloud calendars using the CalDAV protocol with an app-specific password — no OAuth required |
| **Zoom API (OAuth 2.0)** | Create a unique Zoom meeting room per booking via the Zoom Meetings API |

### Email & Messaging

| Service | Purpose |
|---------|---------|
| **Resend** | Transactional email delivery — booking confirmations, reminders, password resets, cancellation notices |
| **React Email** | Component-based email template rendering — type-safe, styled email templates compiled and sent via Resend |

### File Storage

| Service | Purpose |
|---------|---------|
| **Vercel Blob** | Cloud storage for user-uploaded files — profile photos |

### Key Libraries

| Library | Purpose |
|---------|---------|
| **Zod** | Runtime validation for all API request bodies, form inputs, and environment variables |
| **ical-generator** | Generates RFC 5545-compliant `.ics` calendar invite files — attached to confirmation emails |
| **date-fns-tz** | Timezone-aware date arithmetic using IANA timezone names — DST-safe slot calculation and display |
| **@upstash/ratelimit** | Rate limiting on auth endpoints and public booking creation — prevents spam and brute-force attacks |
| **Sentry** | Error monitoring, performance tracing, and alerting — tracks exceptions and slow API calls in production |

---

## Core Functionality

Schedica is organized around five core pillars:

### 1. Smart Scheduling
- Create 1-on-1 event types *(MVP)*
- Group, round-robin, and collective event types *(Phase 2)*
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

### 5. Revenue & Growth
- Lead qualification routing forms *(Phase 2)*
- Stripe / PayPal payment collection at booking *(Phase 3)*
- Analytics dashboard to track meeting performance *(Phase 2)*

---

## MVP Feature List

The MVP focuses on delivering a complete solo + small team scheduling experience.

### Phase 1 — Core MVP (Solo Users)

| # | Feature | Description |
|---|---------|-------------|
| 1 | User Onboarding | Sign up, sign in, email verification, password reset (Google and Microsoft OAuth supported); guided first-run wizard to connect calendar, set timezone, create first event type, and get booking link |
| 2 | User Profile & Settings | Name, photo, timezone, connected calendars, notification preferences, 2FA, account security |
| 3 | Event Type Builder | Create unlimited event types; each supports multiple duration options (15/30/60 min) for invitees to choose |
| 4 | Availability Settings | Set weekly hours, buffer times, minimum notice, daily limits, date-specific overrides |
| 5 | Timezone Management | Auto-detect invitee timezone, manual override, both timezones shown in every email and confirmation |
| 6 | Calendar Sync | Real-time free/busy sync with Google, Outlook, and Apple Calendar — prevents double-booking |
| 7 | Booking Page | Public-facing scheduling page with available time slots, host branding, and profile overview |
| 8 | Booking Engine | Core booking processor — slot locking, conflict check, calendar write, async post-booking jobs |
| 9 | Custom Questions | Add intake questions to booking form (text, dropdown, checkbox, phone, multi-select) |
| 10 | Video Conferencing | Auto-generate unique Zoom / Google Meet / Teams links per booking |
| 11 | Booking Confirmation | Confirmation screen + email with both timezones, calendar invite (.ics), and add-to-calendar buttons |
| 12 | Notifications & Reminders | Automated 24-hour and 1-hour email reminders; instant host notification on new booking |
| 13 | Meetings Dashboard | View all upcoming and past meetings; search, filter, private notes, and manage bookings |
| 14 | Cancellation & Reschedule | Invitee-initiated cancellation and reschedule via secure email link; host can cancel from dashboard |

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
| 3 | Payments | Collect payment via Stripe / PayPal at time of booking |
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

**Schedica's positioning:** A polished, affordable scheduling platform with SavvyCal-quality UX, Calendly-level features, and Chili Piper-inspired lead routing — at a price accessible to growing teams.



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
│   │   ├── (admin)/                      # Orbit Admin panel — platform administration
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
│   │   │   │   └── notifications.ts      # notification_preferences, workflow_templates
│   │   │   ├── index.ts                  # Drizzle client + db connection (postgres.js)
│   │   │   └── queries/                  # Reusable query helpers per domain
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
├── features/                             # MVP feature documentation (14 files)
│   │
│   ├── — Platform —
│   ├── billing.md                        # Plan tiers (Free/Standard/Pro), feature gates, upgrade flow, Stripe (Phase 3)
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
│   ├── notifications-reminders.md        # Transactional emails, reminder workflows, SMS
│   └── booking-flow.md                   # Full booking flow, cancellation & reschedule policies
│
└── README.md
```

---

## Key Differentiators

1. **Apple Calendar Support** — Native iCloud/Apple Calendar sync; Calendly dropped this in August 2024
2. **Both Timezones in Every Email** — Confirmation and reminder emails show the invitee's time AND the host's time; Calendly only shows one timezone
3. **Cancellation Policy Enforcement** — Calendly only displays policy text; Schedica actually blocks cancellations within the configured window
4. **Free Custom Questions** — 3 intake questions on the free plan; Calendly gives 0 on free
5. **Multi-Duration Event Types** — One booking link can offer 15, 30, and 60-min options; invitee picks at booking time
6. **Meeting Overload Protection** — Daily meeting limits, buffer times, and minimum notice periods prevent back-to-back burnout
7. **Transparent Pricing** — Per-feature tiers; key features not locked behind per-seat enterprise plans

---

## References

- [Calendly](https://calendly.com) — Market leader, benchmark for core scheduling UX
- [Cal.com](https://cal.com) — Open source reference implementation
- [Chili Piper](https://chilipiper.com) — B2B lead routing and sales scheduling
- [HubSpot Meetings](https://hubspot.com/products/sales/schedule-meeting) — CRM-native scheduling
- [SavvyCal](https://savvycal.com) — Calendar overlay UX inspiration
