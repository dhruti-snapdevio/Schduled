# Development Plan — Schedica

## How to use this file

Each phase is a self-contained development step. Work through them **in order** — each phase depends on the previous one being complete. Do not skip ahead.

At the start of each phase, reference the relevant feature doc from the `features/` folder. At the end of each phase, the app should be in a working, testable state before moving to the next.

**Relevant docs:** All feature specs live in `features/`

---

## Tech Stack (reference)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16+ |
| ORM | Drizzle ORM |
| Auth | Better Auth (with Admin Plugin) |
| Job Queue | pg-boss (PostgreSQL-backed) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix UI primitives) |
| Email Delivery | Nodemailer (SMTP) |
| Email Templates | React Email |
| File Storage | S3-compatible storage (@aws-sdk/client-s3) |
| Logging | console.log / console.error (built-in) |
| Admin Panel | Custom Next.js pages (Shadcn/UI + Better Auth Admin Plugin) |
| Calendar Libs | date-fns-tz, ical-generator |
| Validation | Zod |

---

## Phase Overview

```
Phase 0  →  Project Setup
Phase 1  →  Database Schema
Phase 2  →  Landing Page
Phase 3  →  Authentication
Phase 4  →  User Onboarding
Phase 5  →  User Profile & Settings
Phase 6  →  Event Type Builder
Phase 7  →  Availability Management
Phase 8  →  Calendar Integrations
Phase 9  →  Timezone Management
Phase 10 →  Public Booking Page
Phase 11 →  Booking Engine
Phase 12 →  Custom Questions
Phase 13 →  Video Conferencing
Phase 14 →  Booking Confirmation
Phase 15 →  Notifications & Reminders
Phase 16 →  Meetings Dashboard
Phase 17 →  Cancellation & Reschedule
Phase 18 →  Open Source Configuration
Phase 19 →  Admin Panel
Phase 20 →  QA & Launch Prep
```

---

## Phase 0 — Project Setup

**Goal:** Working Next.js 15 project with all tools configured, connected to the database, and deployable.

### Tasks

- [ ] Init Next.js 15 project with TypeScript and App Router
  ```bash
  npx create-next-app@latest schedica --typescript --tailwind --app --src-dir
  ```
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui
  ```bash
  npx shadcn@latest init
  ```
- [ ] Set up folder structure:
  ```
  src/
  ├── app/
  │   ├── (auth)/               ← sign-in, sign-up, forgot/reset password, verify-email
  │   ├── (dashboard)/          ← host dashboard (protected)
  │   ├── (admin)/              ← custom admin panel (Next.js pages, protected by Better Auth admin role)
  │   ├── onboarding/           ← first-run wizard
  │   ├── [username]/           ← public booking pages (no auth)
  │   │   └── [eventSlug]/
  │   └── api/                  ← API routes
  ├── components/
  │   ├── booking/              ← booking page, slot picker, confirmation
  │   ├── dashboard/            ← meetings list, event type cards
  │   ├── admin/                ← admin panel components (user table, job queue, stats)
  │   ├── onboarding/           ← wizard step components
  │   └── ui/                   ← shadcn components
  ├── lib/
  │   ├── auth/                 ← Better Auth config + client
  │   ├── db/
  │   │   ├── schema/           ← Drizzle schema (one file per domain)
  │   │   ├── index.ts          ← Drizzle client + connection
  │   │   └── queries/          ← reusable query helpers
  │   ├── email/
  │   │   ├── client.ts         ← Nodemailer SMTP transporter (singleton)
  │   │   ├── send.ts           ← send() wrapper — renders template + delivers via SMTP
  │   │   └── templates/        ← React Email components (one per email type)
  │   │       ├── booking-confirmation.tsx
  │   │       ├── booking-notification.tsx
  │   │       ├── reminder.tsx
  │   │       ├── cancellation.tsx
  │   │       ├── reschedule.tsx
  │   │       ├── welcome.tsx
  │   │       └── verification.tsx
  │   ├── storage/
  │   │   ├── client.ts         ← S3Client singleton (@aws-sdk/client-s3) — points to any S3-compatible endpoint
  │   │   └── upload.ts         ← upload(), deleteFile(), getPresignedUrl() helpers
  │   └── jobs/
  │       ├── client.ts         ← pg-boss singleton
  │       ├── workers/          ← job handler functions
  │       └── scheduler.ts      ← job registration + cron definitions
  └── types/                    ← shared TypeScript types
  ```
- [ ] Install Drizzle ORM and set up PostgreSQL connection
  ```bash
  npm install drizzle-orm postgres
  npm install -D drizzle-kit
  ```
- [ ] Install Better Auth
  ```bash
  npm install better-auth
  ```
- [ ] Install pg-boss for background jobs
  ```bash
  npm install pg-boss
  ```
- [ ] Install Nodemailer for SMTP email
  ```bash
  npm install nodemailer
  npm install -D @types/nodemailer
  ```
- [ ] Install React Email for email templates
  ```bash
  npm install @react-email/components react-email
  ```
- [ ] Install date and calendar libraries
  ```bash
  npm install date-fns date-fns-tz ical-generator zod
  ```
- [ ] Install CalDAV library for Apple Calendar / iCloud integration
  ```bash
  npm install tsdav
  ```
- [ ] Install S3-compatible storage SDK (works with AWS S3, Cloudflare R2, MinIO, Backblaze B2, DigitalOcean Spaces)
  ```bash
  npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  ```
- [ ] Install Google API and Microsoft Graph clients
  ```bash
  npm install googleapis @microsoft/microsoft-graph-client
  npm install -D @microsoft/microsoft-graph-types
  ```
- [ ] Set up `src/lib/email/client.ts` — Nodemailer transporter using env vars; use Mailhog (`smtp://localhost:1025`) for local dev
- [ ] Set up `src/lib/email/send.ts` — `send({ to, subject, template, props })` wrapper that renders React Email component to HTML then calls `transporter.sendMail()`
- [ ] Set up `src/lib/storage/client.ts` — `S3Client` singleton using `S3_*` env vars; set `endpoint` when using non-AWS provider (Cloudflare R2, MinIO, etc.)
- [ ] Set up `src/lib/storage/upload.ts` — `getPresignedUploadUrl(key)`, `deleteFile(key)`, `getPublicUrl(key)` helpers
- [ ] Configure `drizzle.config.ts` — **must include `schemaFilter: ["public"]`** to restrict Drizzle Kit to the `public` schema only. pg-boss automatically creates its own tables in a `pgboss` schema on startup; without this filter, `npx drizzle-kit generate` will detect those untracked tables and attempt to generate migrations that drop or alter them.
  ```typescript
  // drizzle.config.ts
  export default defineConfig({
    schema: "./src/lib/db/schema/*",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: { url: process.env.DATABASE_URL! },
    schemaFilter: ["public"],   // ← required: ignore pgboss schema
  })
  ```
- [ ] Configure `.env` file:
  ```
  DATABASE_URL=
  BETTER_AUTH_SECRET=
  BETTER_AUTH_URL=
  NEXT_PUBLIC_APP_URL=

  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=

  # Microsoft Graph API — Outlook calendar sync + Teams meeting creation (NOT for user sign-in)
  MICROSOFT_CLIENT_ID=
  MICROSOFT_CLIENT_SECRET=

  ZOOM_CLIENT_ID=
  ZOOM_CLIENT_SECRET=
  ZOOM_REDIRECT_URI=

  # SMTP — use any SMTP server (Gmail SMTP, Postfix, Mailhog for dev, etc.)
  SMTP_HOST=
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=
  SMTP_PASS=
  SMTP_FROM_EMAIL=
  SMTP_FROM_NAME=Schedica

  # S3-compatible storage — profile photos, logos, banners
  # Works with AWS S3, Cloudflare R2, MinIO, Backblaze B2, DigitalOcean Spaces
  S3_ACCESS_KEY_ID=
  S3_SECRET_ACCESS_KEY=
  S3_REGION=
  S3_BUCKET_NAME=
  S3_ENDPOINT=          # omit for AWS S3; set for Cloudflare R2 / MinIO / other providers
  ```
- [ ] Set up ESLint + Prettier config
- [ ] Set up git repository and initial commit
- [ ] Confirm dev server runs: `npm run dev`

**Done when:** `npm run dev` runs without errors and the default Next.js page loads.

---

## Phase 1 — Database Schema

**Goal:** Full Drizzle schema defined for all modules. All tables created in the database.

**Reference docs:** All feature docs (each has a Data Model section)

### Tasks

- [ ] Write Drizzle schema files under `src/lib/db/schema/`:

  **`users.ts` — Auth + profile tables:**
  - [ ] `users` — id, name, email, emailVerified, image, username, timezone, onboardingStep, onboardingDone, createdAt, updatedAt *(extends Better Auth base)*
  - [ ] `sessions` — id, userId, token, expiresAt, ipAddress, userAgent
  - [ ] `accounts` — id, userId, provider, providerAccountId, accessToken, refreshToken, expiresAt
  - [ ] `verifications` — id, identifier, value, expiresAt
  - [ ] `user_profiles` — id, userId, displayName, jobTitle, company, bio, websiteUrl, theme (light/dark/system), dateFormat, timeFormat, updatedAt
  - [ ] `user_branding` — id, userId, brandPrimaryColor, brandTextColor, brandBackgroundColor, logoUrl, bannerUrl, welcomeMessage, confirmationMessage, redirectUrl, customEmailSubject, updatedAt
  - [ ] `username_redirects` — id, userId, oldUsername, newUsername, expiresAt, createdAt — records old usernames for 30-day redirect; without this table, any old booking link in an email signature would 404 the moment a user changes their username

  **`event-types.ts` — Scheduling setup:**
  - [ ] `event_types` — id, userId, name, slug, description, locationType, locationValue, phoneCallDirection (host_calls_invitee / invitee_calls_host — only used when locationType = phone; drives whether invitee phone is required on the form and whose number is displayed in confirmation), color, isActive, isHidden, status (active/inactive), minimumNotice, bookingWindow, bookingWindowType (rolling/fixed), bufferBefore, bufferAfter, maxBookingsPerDay, startTimeIncrement, requiresApproval, createdAt, updatedAt
  - [ ] `event_type_durations` — id, eventTypeId, duration, isDefault
  - [ ] `cancellation_policies` — id, eventTypeId, allowCancellation, cutoffHours, allowRescheduling, rescheduleCutoffHours, maxReschedules, requireCancellationReason, cancellationReasonOptions (json), showPolicyText, createdAt
  - [ ] `availability_schedules` — id, userId, name, isDefault, timezone, createdAt
  - [ ] `availability_windows` — id, scheduleId, dayOfWeek, startTime, endTime *(times stored as HH:mm strings in schedule's timezone)*
  - [ ] `availability_overrides` — id, userId, date, isBlocked, startTime, endTime, reason, createdAt
  - [ ] `event_type_questions` — id, eventTypeId, label, type (short_text/long_text/phone/single_select/multi_select/dropdown/number/date/url), isRequired, options (json), position, isActive

  **`calendars.ts` — Calendar integrations:**
  - [ ] `connected_calendars` — id, userId, provider (google/outlook/apple/caldav), accountEmail, accessToken, refreshToken, tokenExpiresAt, calendarId, calendarName, isPrimary, isConflictCheck, isWriteTarget, createdAt
  - [ ] `calendar_events_cache` — id, connectedCalendarId, externalEventId, title, startTime, endTime, isBusy, hostOverride (null/available/busy), syncedAt

  **`video.ts` — Video conferencing:**
  - [ ] `video_connections` — id, userId, provider (zoom/teams), accountEmail, accessToken, refreshToken, tokenExpiresAt, providerUserId, createdAt

  **`bookings.ts` — Booking records:**
  - [ ] `bookings` — id, eventTypeId, hostUserId, inviteeName, inviteeEmail, inviteePhone, inviteeTimezone, startTime, endTime, status (confirmed/cancelled/rescheduled/completed/no_show/pending_payment), locationValue, videoLinkHost, videoLinkInvitee, cancelToken, rescheduleToken, cancellationReason, cancelledAt, rescheduledFromId, paymentId, paymentAmount, createdAt, updatedAt
  - [ ] `booking_answers` — id, bookingId, questionId, questionLabel, answer
  - [ ] `booking_guests` — id, bookingId, guestEmail, guestName

  **`billing.ts` — Plans & pricing:**
  - [ ] `plans` — id, name, displayName, tagline, monthlyPriceUsd, annualPriceUsd, isHighlighted, ctaLabel, ctaAction (signup/contact_sales), status (active/hidden), orderIndex, createdAt, updatedAt
  - [ ] `plan_limits` — id, planId, limitKey, limitValue (int; -1 = unlimited)
  - [ ] `plan_feature_flags` — id, planId, featureKey, isEnabled
  - [ ] `plan_bullets` — id, planId, text, isIncluded, orderIndex
  - [ ] `user_plans` — id, userId, planId, planOverrideId, status (active/cancelled/past_due), currentPeriodStart, currentPeriodEnd, stripeCustomerId, stripeSubscriptionId, createdAt, updatedAt
  - [ ] `plan_overrides` — id, userId, planId, reason, expiresAt, createdByAdminId, createdAt

  **`notifications.ts` — Notifications & reminders:**
  - [ ] `notification_preferences` — id, userId, bookingConfirmationEmail, bookingNotificationEmail, reminderEmail24h, reminderEmail1h, cancellationEmail, rescheduleEmail, dailyDigestEmail, weeklySummaryEmail, fromName, replyToEmail, emailFormat (detailed/summary), updatedAt
  - [ ] `workflow_jobs` — id, bookingId, jobType (reminder_24h/reminder_1h/followup/noshow_check), singletonKey, scheduledFor, status, createdAt

- [ ] Run initial migration:
  ```bash
  npx drizzle-kit generate
  npx drizzle-kit migrate
  ```
- [ ] Confirm Drizzle Studio opens and shows all tables:
  ```bash
  npx drizzle-kit studio
  ```

**Done when:** All tables exist in the database, migrations are tracked, and Drizzle Studio shows all tables correctly.

---

## Phase 2 — Landing Page

**Goal:** Full public-facing marketing page is live. Visitors can understand the product and sign up.

**Reference doc:** [features/landing-page.md](./features/landing-page.md)

### Tasks

**Layout & Navigation:**
- [ ] Public layout (separate from app layout — no sidebar, no auth)
- [ ] Sticky nav bar with logo, nav links, Sign In + Get Started CTAs
- [ ] Mobile hamburger menu
- [ ] Smooth scroll to section on anchor link click

**Sections (in order):**
- [ ] Hero — headline, subheadline, primary CTA ("Get Started Free"), hero image
- [ ] Social proof bar — e.g. "Used by freelancers and growing teams"
- [ ] Features section — 6 cards (Smart Booking Links, Calendar Sync, Custom Questions, Reminders, Video Conferencing, Meetings Dashboard)
- [ ] How It Works — 4 steps (Sign Up → Connect Calendar → Create Event Type → Share Link)
- [ ] Pricing section — plan cards fetched dynamically from `GET /api/plans` (not hardcoded)
  - [ ] Monthly / Annual toggle (state saved in localStorage)
  - [ ] Free / Standard / Pro plan cards rendered from API response
  - [ ] "All plans include" row
  - [ ] Pricing FAQ accordion
- [ ] Comparison table — Schedica vs Calendly vs Cal.com
- [ ] Testimonials — 3 static cards
- [ ] General FAQ — accordion (6–8 questions)
- [ ] Final CTA banner — "Start scheduling in minutes"
- [ ] Footer — Product, Company, Legal, Social links

**Additional pages:**
- [ ] `/pricing` — standalone pricing page (reuse pricing section component)
- [ ] `/privacy` — Privacy Policy (required before launch)
- [ ] `/terms` — Terms of Service (required before launch)
- [ ] `/cookies` — Cookie Policy

**SEO:**
- [ ] `<title>` and `<meta description>` on all public pages
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] `sitemap.xml`
- [ ] `robots.txt`

**Done when:** Landing page is fully built, all sections render, legal pages exist, and Sign In / Get Started buttons link to auth pages.

---

## Phase 3 — Authentication

**Goal:** Users can sign up, sign in, sign out, verify email, and reset password. Google OAuth and magic link work.

**Reference doc:** [features/user-onboarding.md](./features/user-onboarding.md)

### Tasks

**Better Auth setup:**
- [ ] Configure Better Auth in `src/lib/auth/config.ts`
  - Email + password provider
  - Google OAuth provider
  - Magic link provider (passwordless sign-in via email)
  - Admin Plugin
  - Drizzle adapter
  - Session config (7-day TTL, 30-day with "remember me")
- [ ] Mount Better Auth handler at `src/app/api/auth/[...all]/route.ts`
- [ ] Configure Nodemailer SMTP as the email provider for Better Auth
- [ ] Create Better Auth client in `src/lib/auth/client.ts`

**Pages:**
- [ ] `/sign-up` — sign up form (name, email, password) + Google OAuth button
- [ ] `/sign-in` — sign in form (email, password, remember me checkbox) + Google OAuth button + magic link option
- [ ] `/forgot-password` — email input form
- [ ] `/reset-password` — new password + confirm password (reads token from URL)
- [ ] `/verify-email` — handles code from email, shows success or expired error

**Logic:**
- [ ] On sign-up: send email verification via Nodemailer (SMTP)
- [ ] On Google OAuth: skip email verification (already verified by Google)
- [ ] On password reset: revoke all existing sessions
- [ ] Redirect authenticated users away from auth pages → `/dashboard`
- [ ] Protect all `(dashboard)` routes — unauthenticated users redirected to `/sign-in`
- [ ] Middleware: `src/middleware.ts` — session check on every protected route

**Email templates (React Email → Nodemailer SMTP):**
- [ ] Email verification email (link valid 24 hours)
- [ ] Password reset email (link valid 1 hour, single-use)
- [ ] Welcome email (after first successful sign-up)

**Done when:** A new user can fully sign up, verify email, sign in (email + OAuth), reset password, and sign out. All auth pages are styled consistently.

---

## Phase 4 — User Onboarding

**Goal:** New users are guided from sign-up to their first live booking link in under 3 minutes.

**Reference doc:** [features/user-onboarding.md](./features/user-onboarding.md)

### Tasks

- [ ] `/onboarding` route — protected, only accessible if user has no event types yet
- [ ] Onboarding wizard layout with step indicator (Step 1 of 5)
- [ ] **Step 1 — Profile Setup**
  - [ ] Name (pre-filled from OAuth if available)
  - [ ] Profile photo upload (optional, skip button)
  - [ ] Username / booking URL slug (auto-suggested from name, editable, uniqueness check)
- [ ] **Step 2 — Connect Calendar**
  - [ ] Connect Google Calendar button → OAuth flow
  - [ ] Connect Outlook / Office 365 button → OAuth flow
  - [ ] "Skip for now" option (can connect later in Settings)
  - [ ] Apple Calendar / iCloud connection — *(Phase 2 — CalDAV is complex, lacks OAuth; do not include in MVP onboarding)*
  - [ ] Show connected calendar with green checkmark after auth
- [ ] **Step 3 — Set Timezone**
  - [ ] Searchable timezone dropdown (IANA timezones)
  - [ ] Auto-detect from browser with confirmation ("We detected: Asia/Kolkata — is this correct?")
- [ ] **Step 4 — Create First Event Type**
  - [ ] Name input (default: "30-Minute Meeting")
  - [ ] Duration selector (15 / 30 / 45 / 60 min)
  - [ ] Location type selector (Zoom / Google Meet / Phone / In-Person)
- [ ] **Step 5 — Preview & Share**
  - [ ] Live preview of the booking page (iframe or component)
  - [ ] Copy booking link button
  - [ ] "Go to Dashboard" button
- [ ] If user already has event types: redirect away from `/onboarding` to `/dashboard`

**Done when:** A new user after sign-up is guided through all 5 steps and arrives at their dashboard with a working, shareable booking link.

---

## Phase 5 — User Profile & Settings

**Goal:** Hosts can manage their profile, timezone, notification preferences, and account security.

**Reference doc:** [features/user-profile-settings.md](./features/user-profile-settings.md)

### Tasks

**API Routes / Server Actions:**
- [ ] Update profile (name, display name, bio, job title, company, website URL)
- [ ] Upload / remove profile photo
- [ ] Update timezone
- [ ] Update notification preferences
- [ ] Change password (requires current password)
- [ ] Enable / disable 2FA (TOTP via Better Auth) *(Phase 2 — defer to post-MVP)*
- [ ] List active sessions *(Phase 2)*
- [ ] Revoke individual session *(Phase 2)*
- [ ] Revoke all other sessions *(Phase 2)*
- [ ] Update username / booking URL slug (with uniqueness check in real-time)
- [ ] Delete account (with confirmation — type email to confirm)
- [ ] Request GDPR data export (triggers pg-boss job → ZIP uploaded to S3-compatible storage → presigned download URL emailed via Nodemailer within 24h)

**UI (`/settings/`):**
- [ ] `/settings/profile` — name, display name, bio, photo, job title, company, website
  - [ ] Live booking page preview on right side as user edits
- [ ] `/settings/timezone` — timezone picker with current time preview
- [ ] `/settings/notifications` — toggle per notification type (booking, reminder, cancellation, reschedule)
  - [ ] From name and reply-to email customization
- [ ] `/settings/security` — change password, 2FA setup *(Phase 2)*, active sessions list with revoke buttons *(Phase 2)*
- [ ] `/settings/integrations` — connected calendars + video platforms (links to Phase 8 and Phase 13)
- [ ] Username change input with real-time uniqueness check; on save: write old username to `username_redirects` with `expiresAt = NOW() + 30 days`
- [ ] Middleware: resolve `GET /[username]/...` — if username not found in `users` table, check `username_redirects` for an unexpired record and return 308 redirect to new username URL
- [ ] "Download my data" button → triggers GDPR export job, shows "You'll receive an email within 24 hours"
- [ ] Danger zone: Delete account with confirmation modal

**Done when:** All profile fields update and persist correctly. Photo upload works. Username change creates a redirect. GDPR export request triggers a job and sends an email.

---

## Phase 6 — Event Type Builder

**Goal:** Hosts can create, edit, duplicate, hide, and delete event types. Each generates a unique booking link.

**Reference doc:** [features/event-types.md](./features/event-types.md)

### Tasks

**API Routes / Server Actions:**
- [ ] Create event type
- [ ] Get event types for current user
- [ ] Get event type by id
- [ ] Update event type (all fields)
- [ ] Duplicate event type
- [ ] Toggle hide/show event type
- [ ] Delete event type
- [ ] Reorder event types (drag-and-drop position)
- [ ] Check slug uniqueness (per user)

**UI (`/event-types/`):**
- [ ] Event types list page — cards with name, duration, location icon, active/hidden badge, booking link, action menu
- [ ] Create event type button → opens builder
- [ ] Event type builder page `/event-types/new` and `/event-types/[id]/edit`:
  - [ ] **What** tab: name, description, duration (preset + custom), color picker
  - [ ] **Where** tab: location type selector — Zoom, Google Meet, Teams, Phone, In-Person address, Custom link
    - [ ] When "Phone" is selected: show `phoneCallDirection` radio — "Host calls invitee" (invitee phone required in form) vs "Invitee calls host" (host phone number shown in confirmation)
  - [ ] **When** tab: availability schedule selector, booking window, minimum notice, buffer before/after, daily limit
  - [ ] **Options** tab: URL slug, hide from profile, booking confirmation message, redirect URL after booking
  - [ ] Multi-duration option: toggle "Let invitees choose duration" → add multiple durations
  - [ ] Live preview panel showing how the booking page will look
  - [ ] Save + Publish button
- [ ] Copy booking link button on each event type card
- [ ] Context menu on each card: Edit, Duplicate, Hide, Delete

**Done when:** Event types can be created, edited, duplicated, and hidden. Each event type generates a correct URL at `schedica.com/[username]/[slug]`.

---

## Phase 7 — Availability Management

**Goal:** Hosts can set weekly working hours, buffer times, booking limits, and date-specific overrides.

**Reference doc:** [features/availability-management.md](./features/availability-management.md)

### Tasks

**API Routes / Server Actions:**
- [ ] Get availability schedule for current user
- [ ] Update weekly availability rules (per day: enabled, startTime, endTime)
- [ ] Add multiple time blocks per day (e.g., 9am–12pm and 2pm–5pm)
- [ ] Set buffer time before / after meetings
- [ ] Set minimum notice period
- [ ] Set maximum booking window
- [ ] Set daily meeting limit
- [ ] Get date overrides (specific blocked dates or custom hours)
- [ ] Add date override (block a date or set custom hours for a date)
- [ ] Delete date override

**UI (`/availability/`):**
- [ ] Weekly availability grid — toggle days on/off, set start/end time per day
- [ ] Add multiple time blocks per day (+ Add time range button)
- [ ] Buffer settings: before meeting / after meeting dropdowns (0 / 5 / 10 / 15 / 30 / 60 min)
- [ ] Minimum notice selector (e.g., 1 hour / 2 hours / 1 day / 2 days)
- [ ] Booking window selector (e.g., 14 days / 30 days / 60 days / Indefinite)
- [ ] Daily meeting limit input (None or number)
- [ ] Start time increment selector (every 15 / 30 / 60 minutes)
- [ ] Booking window type toggle: Rolling (e.g., next 30 days) vs Fixed date range (select start + end date)
- [ ] Date overrides section:
  - [ ] Calendar view to pick specific dates
  - [ ] Mark date as fully unavailable (blocked)
  - [ ] Set custom hours for a specific date
  - [ ] Bulk block a date range (e.g., vacation Jan 15–22) via calendar range picker
  - [ ] List of upcoming overrides with edit / delete
- [ ] Save changes button with success toast

**Done when:** Weekly availability rules save correctly and overrides block specific dates. The booking page for an event type reflects all rules accurately.

---

## Phase 8 — Calendar Integrations

**Goal:** Hosts can connect Google, Outlook, and Apple calendars. Schedica reads free/busy data in real-time and writes new bookings.

**Reference doc:** [features/calendar-integrations.md](./features/calendar-integrations.md)

### Tasks

**Google Calendar:**
- [ ] OAuth 2.0 flow — `GET /api/calendars/google/connect` → redirect to Google consent
- [ ] OAuth callback — `GET /api/calendars/google/callback` → exchange code for tokens, save to `connected_calendars`
- [ ] Fetch calendar list from Google Calendar API
- [ ] User selects which calendars to check for conflicts + which to write new bookings to
- [ ] Read free/busy data via `calendar.freebusy.query`
- [ ] Write new bookings via `calendar.events.insert`
- [ ] Token refresh logic (access token expires every 1 hour)
- [ ] Disconnect Google Calendar → delete tokens from DB

**Microsoft Outlook / Office 365:**
- [ ] OAuth 2.0 flow via Microsoft Graph API
- [ ] Callback handler — save tokens to `connected_calendars`
- [ ] Read free/busy via `/me/calendarView`
- [ ] Write bookings via `/me/events`
- [ ] Token refresh logic
- [ ] Disconnect Outlook

**Apple iCloud / CalDAV *(Phase 2 — Post-MVP)*:**
> CalDAV lacks standard OAuth, requires app-specific passwords, and involves a complex protocol. Include in Phase 2 after Google + Outlook integrations are stable.
- [ ] App-specific password form (no OAuth for Apple)
- [ ] CalDAV connection using provided credentials
- [ ] Read calendar events via CalDAV REPORT request
- [ ] Write bookings via CalDAV PUT request
- [ ] Disconnect Apple Calendar

**Free/Busy Caching:**
- [ ] `sync-calendar` pg-boss job — runs every 10 minutes per connected calendar
- [ ] Cache free/busy windows in `calendar_events_cache`
- [ ] Booking engine reads from cache first, falls back to live API call

**UI (`/settings/integrations/`):**
- [ ] Connected calendars section:
  - [ ] Google: "Connect Google Calendar" button → OAuth flow
  - [ ] Outlook: "Connect Outlook" button → OAuth flow
  - [ ] Apple: App-specific password form
  - [ ] Each connected calendar shows: account email, calendars checked for conflicts, write-target calendar, "Disconnect" button
- [ ] Per-calendar toggles: which calendars to include in conflict check

**Done when:** Connecting Google Calendar allows Schedica to read free/busy data and write bookings. Token refresh works silently. Disconnect cleans up all stored tokens.

---

## Phase 9 — Timezone Management

**Goal:** Host and invitee always see meeting times in their own local timezone — automatically and accurately.

**Reference doc:** [features/timezone-management.md](./features/timezone-management.md)

### Tasks

**Host Timezone:**
- [ ] Timezone stored on `users` table (IANA identifier, set during onboarding)
- [ ] All dashboard times rendered in host timezone
- [ ] All host-side calendar writes use host timezone
- [ ] Timezone change in settings: recalculate future availability display, keep past bookings in UTC

**Invitee Timezone:**
- [ ] Auto-detect via `Intl.DateTimeFormat().resolvedOptions().timeZone` on booking page load
- [ ] Manual timezone override — dropdown shown on booking page ("Showing times in: Asia/Kolkata ▾")
- [ ] Store detected/selected timezone with the booking record

**Slot Calculation:**
- [ ] Availability windows stored as `HH:mm` strings paired with the schedule's IANA timezone (e.g., `09:00`–`17:00` in `Asia/Kolkata`) — NOT converted to UTC, to handle DST correctly
- [ ] All booking `startTime` / `endTime` stored as UTC timestamps in the database
- [ ] Slot generation — **generate slots as local-time increments first, then convert each slot to UTC** (do NOT convert the window to a UTC range and iterate through it — on DST transition days the local day is 23 or 25 hours long, and a single-offset UTC range produces slots that are 1 hour off after the transition):
  1. For a given date in the host's timezone, expand `HH:mm` windows into local datetime strings (e.g., `2026-03-08 09:00 America/New_York`, `2026-03-08 09:30 America/New_York`, …)
  2. Convert each local datetime to UTC using `date-fns-tz.zonedTimeToUtc()` — each slot gets the correct UTC offset for that exact moment
  3. Filter out UTC slots that overlap busy calendar events
  4. Return remaining UTC slots; convert to invitee timezone for display using `date-fns-tz.utcToZonedTime()`
- [ ] Slot generation uses `date-fns-tz` for DST-safe conversion to invitee timezone
- [ ] Slots display in invitee local time on booking page
- [ ] Confirmation screen shows both: invitee time AND host time

**Emails:**
- [ ] Confirmation email to invitee: "Your time: Thu Jun 5 at 3:00 PM IST" + "Host's time: 10:00 AM EST"
- [ ] Notification email to host: meeting time shown in host's timezone
- [ ] Reminder emails to invitee: invitee timezone shown

**Done when:** An invitee in IST booking a host in EST sees correct local times on the booking page, confirmation screen, and all emails. DST transitions do not cause off-by-one hour errors.

---

## Phase 10 — Public Booking Page

**Goal:** The public-facing booking page is live at `schedica.com/[username]/[eventSlug]`. Invitees can browse and select available time slots.

**Reference doc:** [features/booking-page-customization.md](./features/booking-page-customization.md)

### Tasks

**Profile Overview Page (`/[username]`):**
- [ ] Server-rendered page (no auth required)
- [ ] Host photo, name, bio, job title
- [ ] All active (non-hidden) event type cards
- [ ] Each card: name, duration, location icon, short description, "Book" button
- [ ] If one event type: option to redirect directly (skip profile overview)

**Event Type Booking Page (`/[username]/[eventSlug]`):**
- [ ] Server-rendered page (no auth required)
- [ ] **Multi-duration selection step** — if `inviteeCanChooseDuration` is enabled on the event type, render a duration picker card **before** the calendar. Invitee must select a duration first; the calendar then loads slots calculated for that duration. Without this step, slot availability is undefined (a 15-min slot may exist while a 60-min slot at the same time does not).
- [ ] Host info in left panel (photo, name, event type name, duration, location, description)
- [ ] Date picker (calendar) in center — grayed-out unavailable dates, highlighted available dates
- [ ] Time slot grid — available slots listed for selected date in invitee's timezone
- [ ] Timezone selector shown below slot list ("Showing times in: Asia/Kolkata ▾")
- [ ] "No slots available" message for fully booked dates

**Booking Page Customization:**
- [ ] Host brand color applied as accent color on booking page
- [ ] Host profile photo shown (circular avatar)
- [ ] Custom welcome / confirmation message shown after booking
- [ ] "Powered by Schedica" badge (shown on free plan, hidden on paid)

**Performance:**
- [ ] Slot calculation is done server-side (Server Component or API route)
- [ ] Static metadata (host info, event type) pre-rendered
- [ ] Slots reload only when a new date is selected (no full page reload)

**Done when:** The booking page is publicly accessible, shows correct available slots for the next 30 days, respects all availability rules, and is mobile-responsive.

---

## Phase 11 — Booking Engine

**Goal:** The core booking processor — slot locking, conflict check, calendar write, and all post-booking jobs.

**Reference doc:** [features/booking-engine.md](./features/booking-engine.md)

### Tasks

**Spam Booking Protection:**
- [ ] Validate email format with Zod before any DB write
- [ ] Block known disposable email domains

**API Route: `POST /api/bookings`**
- [ ] Validate request body with Zod (eventTypeId, startTime, inviteeName, inviteeEmail, inviteeTimezone, answers)
- [ ] Acquire PostgreSQL advisory lock for the slot: `pg_advisory_xact_lock(hostUserId + startTime)` — key must be derived from **hostUserId + startTime**, not eventTypeId, so concurrent bookings across different event types for the same host at the same time are serialised correctly
- [ ] Re-verify slot availability inside a DB transaction (final check)
- [ ] Insert booking record into `bookings` table
- [ ] Release advisory lock
- [ ] Enqueue post-booking pg-boss jobs (inside same transaction):
  - [ ] `generate-video-link` — create Zoom / Google Meet link
  - [ ] `write-calendar-event` — add event to host's connected calendar
  - [ ] `send-confirmation` — send confirmation emails to host + invitee
  - [ ] `schedule-reminders` — schedule 24h and 1h reminder jobs
- [ ] Return booking confirmation data to client

**pg-boss Workers:**
- [ ] `generate-video-link` worker — calls Zoom or Google Meet API, updates booking record with video URLs
- [ ] `write-calendar-event` worker — creates calendar event on host's calendar with .ics invite
- [ ] `send-confirmation` worker — renders React Email template and sends via Nodemailer (SMTP)
- [ ] `schedule-reminders` worker — schedules two future pg-boss jobs (24h and 1h before start)

**Booking Status Flow:**
- [ ] `confirmed` — successfully booked
- [ ] `pending_payment` — awaiting payment (Phase 3)
- [ ] `cancelled` — cancelled by host or invitee
- [ ] `rescheduled` — rescheduled (original booking links to new one)
- [ ] `no_show` — host marked invitee as no-show

**Slot Lock Expiry:**
- [ ] If payment/form processing takes > 5 minutes — lock expires and slot is released

**Error Handling:**
- [ ] Slot already taken → return clear error + list alternative available slots
- [ ] Video API failure → booking still confirmed, host notified to add link manually
- [ ] Calendar write failure → retry via pg-boss (3 retries with exponential backoff)
- [ ] Email failure → retry via pg-boss (3 retries)

**Done when:** Concurrent booking attempts for the same slot cannot both succeed. Post-booking jobs run async and do not block the API response. Failed jobs retry automatically.

---

## Phase 12 — Custom Questions

**Goal:** Hosts can add custom intake questions to their booking form. Invitees answer them before confirming.

**Reference doc:** [features/custom-questions.md](./features/custom-questions.md)

### Tasks

**API Routes / Server Actions:**
- [ ] Get questions for an event type
- [ ] Add question to event type
- [ ] Update question (label, type, options, required, position)
- [ ] Delete question
- [ ] Reorder questions (drag-and-drop position)
- [ ] Save booking answers with the booking record

**Question Types:**
- [ ] Short text (single-line, 255 char limit)
- [ ] Long text / paragraph (multi-line, 2000 char limit)
- [ ] Phone number (with country code selector, format validation)
- [ ] Single select (radio buttons)
- [ ] Multi select (checkboxes)
- [ ] Dropdown (select from list)
- [ ] Number input

**UI — Host (Event Type Builder → Questions tab):**
- [ ] Questions list with drag-and-drop reorder
- [ ] "Add Question" button → opens question type picker
- [ ] Question editor: label, type, required toggle, options editor (for select/dropdown)
- [ ] Delete question with confirmation

**UI — Invitee (Booking Form):**
- [ ] Questions rendered after name + email fields, before confirm button
- [ ] Required fields marked with asterisk (*), validated on submit
- [ ] Phone field shows country code selector

**Answers Storage:**
- [ ] Answers saved to `booking_answers` table on booking creation
- [ ] Answers included in host notification email
- [ ] Answers visible in Meetings Dashboard booking detail view

**Auto-Remember for Repeat Invitees:**
- [ ] On email field blur during booking: query `bookings` table for previous bookings by same host + same invitee email
- [ ] If found: pre-fill question answers from most recent booking into form fields
- [ ] Show notice: "We've pre-filled your answers from a previous booking. Update anything that has changed."
- [ ] Invitee can edit any pre-filled answer before submitting

**Done when:** Hosts can add, reorder, and delete questions. Invitees see and answer them during booking. Answers are stored and visible in the dashboard. Repeat invitees see pre-filled answers.

---

## Phase 13 — Video Conferencing

**Goal:** Every booking automatically gets a unique video link for the host and a join link for the invitee.

**Reference doc:** [features/video-conferencing.md](./features/video-conferencing.md)

### Tasks

> ⚠️ **Zoom Marketplace Approval — Do This First**
> The Zoom API requires a published, approved OAuth app in the Zoom Marketplace before it works for all users. Submit the app for review early — approval takes **2–4 weeks** and requires a live privacy policy, terms of service, and a working demo. During development, use a **development-mode** Zoom OAuth app (works for up to 100 connected users, no approval needed). Switch to the published app before launch.

**Zoom Integration:**
- [ ] Register Zoom OAuth app in Zoom Marketplace (development mode first)
- [ ] OAuth 2.0 connection: `GET /api/video/zoom/connect` → redirect to Zoom OAuth
- [ ] Callback: `GET /api/video/zoom/callback` → exchange code, save tokens
- [ ] `generate-video-link` worker: call `POST /v2/users/me/meetings` via Zoom API
  - [ ] Unique meeting ID + passcode per booking
  - [ ] Meeting title = event type name + invitee name
  - [ ] Duration = booking duration
- [ ] Store `videoLinkHost` (start URL) and `videoLinkInvitee` (join URL) on booking record
- [ ] Token refresh logic
- [ ] Disconnect Zoom from settings

**Google Meet Integration:**
- [ ] Google Meet link generated via `conferenceData` on Google Calendar event creation
- [ ] No separate OAuth needed — uses Google Calendar access already granted in Phase 8
- [ ] Extract Meet link from calendar event `conferenceData.entryPoints`

**Microsoft Teams Integration:**
- [ ] Teams meeting created via Microsoft Graph API `POST /me/onlineMeetings`
- [ ] No separate OAuth needed — uses Microsoft Graph access from Phase 8
- [ ] Extract Teams join link from response

**UI (`/settings/integrations/`):**
- [ ] Video platforms section:
  - [ ] Zoom: "Connect Zoom Account" button → OAuth → connected state with account email
  - [ ] Google Meet: auto-available if Google Calendar is connected (no extra auth needed)
  - [ ] Microsoft Teams: auto-available if Outlook is connected
- [ ] Event type builder — location type selector shows connected platforms only

**Done when:** Selecting Zoom in an event type creates a unique Zoom meeting per booking. Google Meet and Teams links are generated automatically from existing calendar connections.

---

## Phase 14 — Booking Confirmation

**Goal:** Invitee sees a confirmation screen instantly after booking. Both parties receive confirmation emails with calendar invites.

**Reference doc:** [features/booking-confirmation.md](./features/booking-confirmation.md)

### Tasks

**Confirmation Screen (Client-side, no page reload):**
- [ ] Booking page transitions to confirmation screen after `POST /api/bookings` succeeds
- [ ] Large green checkmark animation
- [ ] "You're scheduled!" headline
- [ ] Host name + photo
- [ ] Event type name
- [ ] **Invitee time** — full date + time in invitee's timezone
- [ ] **Host time** — same meeting in host's timezone (shown directly below invitee time)
- [ ] Duration
- [ ] Location (video join button or address)
- [ ] "A confirmation has been sent to [email]" message
- [ ] Add to Calendar buttons — Google Calendar, iCal/Outlook, Office 365
- [ ] Reschedule link + Cancel link

**Confirmation Email — Invitee (via Nodemailer SMTP):**
- [ ] Subject: "Confirmed: [Event Type Name] with [Host Name]"
- [ ] Invitee time + host time (both timezones)
- [ ] Video join link (or address)
- [ ] Calendar download buttons (Google, iCal)
- [ ] Invitee's own form answers (for their reference)
- [ ] Reschedule link + Cancel link
- [ ] Host's custom confirmation message (if set)
- [ ] `.ics` file attached (generated via `ical-generator`)

**Notification Email — Host (via Nodemailer SMTP):**
- [ ] Subject: "New booking: [Invitee Name] — [Date + Time]"
- [ ] Invitee name + email
- [ ] Meeting time in host's timezone
- [ ] Video join link (host's start link for Zoom)
- [ ] All booking form answers
- [ ] Cancel booking link

**Calendar Event (via Phase 8 calendar connection):**
- [ ] Host calendar event created with: title, start/end, location (video link or address), invitee as attendee, description with form answers
- [ ] ICS invite sent to invitee via email attachment

**Done when:** Invitee sees the confirmation screen immediately after booking. Both parties receive confirmation emails with correct timezones. Calendar invite is attached to invitee email.

---

## Phase 15 — Notifications & Reminders

**Goal:** Automated 24-hour and 1-hour email reminders are sent to invitees before every meeting. All lifecycle events trigger correct emails.

**Reference doc:** [features/notifications-reminders.md](./features/notifications-reminders.md)

### Tasks

**pg-boss Job Scheduling:**
- [ ] On booking created — schedule four future jobs:
  - [ ] `reminder_24h` — fires 24 hours before `startTime`
  - [ ] `reminder_1h` — fires 1 hour before `startTime`
  - [ ] `followup` — fires 30 minutes after `endTime` *(Phase 2)*
  - [ ] `noshow_check` — fires 15 minutes after `startTime` *(Phase 2)*
- [ ] Each job uses `singletonKey` = `{bookingId}_{jobType}` — ensures one job per booking per type
- [ ] On booking cancelled — cancel all pending reminder jobs by `singletonKey`
- [ ] On booking rescheduled — cancel old jobs, schedule new jobs with updated times

**pg-boss Workers:**
- [ ] `send-reminder.ts`:
  - [ ] Fetch booking + host + invitee details
  - [ ] Confirm booking is still `confirmed` (skip if cancelled/rescheduled)
  - [ ] Send reminder email to invitee via Nodemailer (render React Email template → send via SMTP)
  - [ ] Invitee time + host time in email (both timezones)
  - [ ] Video join link prominently displayed
  - [ ] Reschedule and cancel links in footer
- [ ] Transactional email workers (fire immediately, not scheduled):
  - [ ] `send-booking-confirmation` — to invitee (triggered on booking creation — Phase 14)
  - [ ] `send-host-notification` — to host (triggered on booking creation — Phase 14)
  - [ ] `send-cancellation-notification` — to both parties (Phase 17)
  - [ ] `send-reschedule-notification` — to both parties (Phase 17)

**Email Templates (React Email → Nodemailer SMTP):**
- [ ] Booking confirmation — invitee
- [ ] Booking notification — host
- [ ] 24-hour reminder — invitee
- [ ] 1-hour reminder — invitee
- [ ] Cancellation notice — invitee (when invitee or host cancels)
- [ ] Cancellation notice — host (when invitee cancels)
- [ ] Reschedule confirmation — invitee
- [ ] Reschedule confirmation — host
- [ ] Host cancellation notice — invitee (when host cancels from dashboard)

**Customization:**
- [ ] Host can set: from name, reply-to email (stored in `notification_preferences`)
- [ ] All emails use host's from name (e.g., "Jane Smith" not "Schedica")
- [ ] Custom confirmation message injected into invitee confirmation email

**Done when:** Reminder jobs are scheduled when a booking is created, cancelled when booking is cancelled, and fire correctly at 24h and 1h before the meeting. All reminder emails include both timezones and the join link.

---

## Phase 16 — Meetings Dashboard

**Goal:** Hosts can view, search, filter, and manage all their bookings from a central dashboard.

**Reference doc:** [features/meetings-dashboard.md](./features/meetings-dashboard.md)

### Tasks

**API Routes / Server Actions:**
- [ ] Get upcoming meetings (paginated, sorted by soonest first)
- [ ] Get past meetings (paginated, sorted by most recent first)
- [ ] Get meeting detail (with booking answers, notes)
- [ ] Search meetings by invitee name or event type
- [ ] Filter meetings by status, event type, date range
- [ ] Add / update private notes on a booking
- [ ] Cancel meeting from dashboard (host-initiated)
- [ ] Stats: total meetings this month, upcoming count, cancellation rate

**UI (`/dashboard/`):**
- [ ] **Today's Meetings** section at top — highlighted, with countdown to next meeting, one-click join button (active 15 min before start)
- [ ] **Upcoming Meetings** list — sorted by date, grouped by day ("Tomorrow", "Thursday, June 5", etc.)
- [ ] **Past Meetings** tab — sorted most recent first
- [ ] Meeting card shows: invitee name + photo initials, event type, date + time (host timezone), duration, location icon, status badge (Confirmed / Rescheduled / Cancelled), Join button
- [ ] Click meeting card → open booking detail panel (slide-in):
  - [ ] All booking details (time, both timezones, location, invitee email)
  - [ ] Invitee's form answers
  - [ ] Private notes textarea (host-only, not visible to invitee)
  - [ ] Cancel meeting button
- [ ] Search bar — filter by invitee name in real-time
- [ ] Filter dropdown — by event type, status
- [ ] Stats bar at top: Upcoming / This Month / Cancellation Rate
- [ ] Empty state for each tab ("No upcoming meetings — share your booking link to get started")

**Done when:** Dashboard shows all meetings correctly. Today's meetings are highlighted. Search and filters work. Private notes save. Join button activates 15 minutes before meetings.

---

## Phase 17 — Cancellation & Reschedule

**Goal:** Invitees can cancel or reschedule bookings via links in their emails. Hosts can cancel from the dashboard.

**Reference doc:** [features/booking-flow.md](./features/booking-flow.md)

### Tasks

**API Routes:**
- [ ] `GET /api/bookings/[token]/cancel` — load cancellation page (validate token; if `startTime <= NOW()` return "Meeting Already Completed" page — cannot cancel a past meeting)
- [ ] `POST /api/bookings/[token]/cancel` — process cancellation (re-validate `startTime > NOW()` before writing; prevents race condition where meeting starts between page load and submit)
- [ ] `GET /api/bookings/[token]/reschedule` — load reschedule page (validate token; if `startTime <= NOW()` return "Meeting Already Completed" page — cannot reschedule a past meeting)
- [ ] `POST /api/bookings/[token]/reschedule` — confirm reschedule (re-validate `startTime > NOW()` before writing)

**Cancellation Flow:**
- [ ] Unique cancel token per booking (stored on `bookings` table)
- [ ] Cancel page: shows meeting details, cancellation reason field (free text or host-configured dropdown options), "Cancel Meeting" button
- [ ] Store cancellation reason on `bookings.cancellationReason` column
- [ ] Cancellation policy enforcement — if within locked window: show **Cancellation Blocked** page with: heading, explanation of window, host contact email, add-to-calendar button (booking stays confirmed)
- [ ] Reschedule Blocked page: same design as Cancellation Blocked — shown when reschedule window is also locked
- [ ] On cancel: update booking status to `cancelled`, cancel all pg-boss reminder jobs, remove from host's calendar, send cancellation emails to both parties

**Reschedule Flow:**
- [ ] Unique reschedule token per booking
- [ ] Reschedule page: shows full booking page (same as original event type) with available slots
- [ ] Original time shown at top: "You are rescheduling from: Thu Jun 5, 3:00 PM IST"
- [ ] On reschedule: cancel old booking, create new booking with same invitee details, cancel old pg-boss jobs, schedule new jobs, send reschedule emails to both parties
- [ ] Rescheduled booking links to previous via `rescheduledFromId`

**Host Cancellation (from Dashboard):**
- [ ] "Cancel Meeting" button in booking detail panel
- [ ] Cancellation reason input (sent to invitee)
- [ ] On cancel: same flow as invitee cancellation + notification to invitee

**Cancellation Policy:**
- [ ] Host sets policy on event type: allowed always / no cancellations within X hours
- [ ] Policy enforced on both invitee cancel link and host dashboard cancel

**Done when:** Invitees can cancel and reschedule via email links. Hosts can cancel from the dashboard. Cancellation and reschedule emails send correctly. Calendar events are removed on cancellation.

---

## Phase 18 — Billing & Plan Enforcement

**Goal:** Plan limits are enforced server-side on every relevant action. Upgrade prompts appear when limits are hit. Admin can configure plans. Public pricing page fetches data from the API.

**Note:** No billing or plan system — Schedica is fully open source. All features are available to all users with no restrictions.

### Tasks

**Database seed (plans already in schema from Phase 1):**
- [ ] Seed `plans` table: Free, Standard, Pro/Teams (name, displayName, monthlyPriceUsd, annualPriceUsd, status, orderIndex)
- [ ] Seed `plan_limits` for each plan: custom_questions, date_overrides_per_month, booking_history_days
- [ ] Seed `plan_feature_flags` for each plan: branding_removal, custom_email_from, analytics, webhooks, payments
- [ ] Seed `plan_bullets` (marketing bullet points per plan for pricing page)
- [ ] Assign all existing users to Free plan in `user_plans` on first migration

**Plan Enforcement Utility:**
- [ ] `getActivePlan(userId)` — reads `user_plans`, resolves override if non-expired
- [ ] `checkLimit(userId, limitKey)` → `{ allowed, current, max }` — used before any limit-gated action
- [ ] `checkFeatureFlag(userId, featureKey)` → boolean — used before feature-gated actions
- [ ] Enforce `custom_questions` limit on question add API
- [ ] Enforce `date_overrides_per_month` on date override create API
- [ ] Enforce `branding_removal` flag on booking page render (server component)
- [ ] Enforce `custom_email_from` flag on notification preference save

**API Routes:**
- [ ] `GET /api/plans` — public, no auth — returns all active plans with limits, flags, and bullets (for pricing page)
- [ ] `GET /api/user/plan` — returns current user's plan + usage stats
- [ ] `GET /api/user/usage` — returns current usage vs plan limits

**Upgrade Prompt:**
- [ ] On `PLAN_LIMIT_EXCEEDED` API error (403): frontend shows upgrade modal
- [ ] Modal shows: which limit was hit, what the next plan includes, [View Plans] + [Upgrade Now] buttons
- [ ] [Upgrade Now] links to `/settings/billing` (full implementation Phase 3 — Stripe)

**UI:**
- [ ] `/settings/billing` — current plan name, usage stats per limit, "Upgrade" button (disabled in MVP, links to contact)
- [ ] Pricing page (`/pricing`) fetches from `GET /api/plans` dynamically — not hardcoded

**Admin Plan Config (in Phase 19 Admin Panel):**
- [ ] `/admin/plans` — list all plans with Edit buttons
- [ ] `/admin/plans/:id/edit` — edit pricing, limits, feature flags, bullet points, visibility
- [ ] `GET/PATCH /api/admin/plans/:id` — admin plan update endpoints
- [ ] `PATCH /api/admin/plans/:id/bullets` — reorder/add/remove bullets
- [ ] `POST /api/admin/users/:id/plan-override` — set manual plan override for a user
- [ ] `DELETE /api/admin/users/:id/plan-override` — remove override

**Done when:** Free plan users cannot add more than 3 questions; upgrade prompt appears when they try. Pricing page renders from the API. Admin can edit plan limits without a code deployment.

---

## Phase 19 — Admin Panel

**Goal:** Platform admins can manage users, view bookings, monitor job queues, and configure the platform via the custom Next.js admin panel (no third-party admin dependency).

**Reference doc:** [features/admin-panel.md](./features/admin-panel.md)

### Tasks

**Access Control:**
- [ ] `/admin` route group — check `is_platform_admin = true` via Better Auth Admin Plugin, else redirect to `/`
- [ ] All `/api/admin/*` routes return 403 for non-platform-admins

**Admin Panel Setup (custom — built with Next.js App Router + Shadcn/UI):**
- [ ] Create `src/app/(admin)/admin/layout.tsx` — admin shell layout (sidebar nav + auth check)
- [ ] Create `src/components/admin/` — shared admin UI components (data table, stats card, job row)
- [ ] All admin pages are Next.js Server Components — data fetched server-side via Drizzle ORM directly
- [ ] Better Auth Admin Plugin provides `auth.api.listUsers()`, `auth.api.banUser()`, `auth.api.impersonateUser()`, `auth.api.listSessions()` — call these from admin server actions

**Dashboard:**
- [ ] `/admin` — Metrics: total users, active bookings, bookings today, bookings this month
- [ ] Sign-up trend chart (last 30 days)

**User Management:**
- [ ] User list — paginated with search by email / name
- [ ] User detail — profile, bookings count, connected calendars, active sessions
- [ ] Ban / Unban user (Better Auth Admin Plugin)
- [ ] Impersonate user (Better Auth Admin Plugin)
- [ ] Revoke all sessions for a user
- [ ] Send password reset email to user

**Booking Oversight:**
- [ ] Platform-wide booking list — filter by date, status, event type
- [ ] Booking detail view — host info, invitee info, timeline

**Job Queue Monitor:**
- [ ] `/admin/jobs` — list of pg-boss jobs (pending, running, failed)
- [ ] Filter by job type
- [ ] Retry failed job button
- [ ] View job error / stack trace

**Platform Settings:**
- [ ] Manage plan features and limits (for future billing integration)
- [ ] Email template preview

**Done when:** Platform admins can access `/admin`, manage users (ban, impersonate), view all bookings, and monitor / retry failed pg-boss jobs.

---

## Phase 20 — QA & Launch Prep

**Goal:** The product is stable, fully tested, and ready for real users.

### Tasks

**End-to-End Testing (manual):**
- [ ] Full host journey: Sign up → Onboarding → Create Event Type → Set Availability → Share Link
- [ ] Full invitee journey: Open booking link → Pick slot → Fill form → Book → Receive confirmation email
- [ ] Reminder emails: confirm 24h and 1h reminder jobs fire at correct times
- [ ] Cancellation flow: cancel via email link → calendar event removed → cancellation email sent
- [ ] Reschedule flow: reschedule via email link → new booking created → old reminder jobs cancelled → new jobs scheduled
- [ ] Double-booking prevention: open same slot in two browser tabs simultaneously, confirm only one succeeds
- [ ] Timezone accuracy: host in EST, invitee in IST — confirm all times display correctly in both timezones
- [ ] Token refresh: let calendar OAuth token expire → confirm Schedica refreshes it silently
- [ ] Calendar sync: add personal event to Google Calendar → confirm slot disappears from booking page within minutes

**Security Checks:**
- [ ] All dashboard routes return 401 for unauthenticated requests
- [ ] Cancel / reschedule tokens are single-use and expire
- [ ] Invitee cannot access another host's bookings via token manipulation
- [ ] Better Auth admin routes return 403 for non-admin users
- [ ] OAuth state parameter validated to prevent CSRF on calendar connect flows
- [ ] Rate limiting on booking creation (prevent spam bookings to a single event type)

**Performance:**
- [ ] Database indexes on: `bookings.hostUserId`, `bookings.startTime`, `bookings.status`, `connected_calendars.userId`, `booking_answers.bookingId`
- [ ] No N+1 queries on dashboard booking list
- [ ] Booking page slot calculation completes in < 500ms
- [ ] Lighthouse score 90+ on booking page (Performance, Accessibility, SEO)

**Pre-Launch Checklist:**
- [ ] `/privacy` page live with real content
- [ ] `/terms` page live with real content
- [ ] `/cookies` page live
- [ ] SMTP server configured with SPF, DKIM, and DMARC records on sending domain
- [ ] SMTP sending tested in production — confirm emails arrive in inbox (not spam)
- [ ] S3-compatible storage bucket created with correct access policy (allow PutObject/GetObject/DeleteObject for the app credentials only)
- [ ] S3 bucket not publicly accessible — all access via presigned URLs only
- [ ] Google OAuth app reviewed and not in "Testing" mode (production OAuth consent screen published)
- [ ] Microsoft Graph API app registered for production (calendar + Teams scopes approved)
- [ ] Zoom OAuth app published (not in development mode)
- [ ] All environment variables set in production (SMTP_*, S3_*, BETTER_AUTH_*, GOOGLE_*, MICROSOFT_*, ZOOM_*)
- [ ] pg-boss job workers started on server boot
- [ ] Confirm `console.error` output is captured by hosting platform logs
- [ ] Create first platform admin account
- [ ] Confirm all pages are mobile-responsive (test on iPhone SE and Galaxy S21)

**Done when:** All manual tests pass, all pre-launch checklist items are complete, the app is deployed to production, and the first real booking can be made end-to-end.

---

## Development Notes

- **Always build mobile-responsive** — booking pages especially must work perfectly on mobile; most invitees will book on their phone
- **Both timezones everywhere** — every email and confirmation screen must show both the invitee's time AND the host's time; this is a key differentiator vs Calendly
- **pg-boss jobs are the source of truth for async work** — never send emails or create calendar events synchronously in the booking API response; always enqueue a job
- **Cancel reminder jobs immediately on cancellation/reschedule** — use `singletonKey` to cancel pending pg-boss jobs when a booking changes; no reminders for meetings that no longer exist
- **Advisory locks for slot booking** — use `pg_advisory_xact_lock` (released on transaction end) to prevent two concurrent bookings claiming the same slot
- **Server Actions over API Routes where possible** — use Next.js Server Actions for dashboard mutations; API Routes for public-facing booking endpoints (invitees are not logged in)
- **Token refresh is silent** — calendar API token refresh must happen invisibly; never show an OAuth re-auth error to an invitee during booking
- **Error states on every async action** — loading state + error state required for every booking form submit, calendar connect, and settings save
- **Email always async via pg-boss** — never call `nodemailer.sendMail()` directly in an API route; always enqueue a pg-boss job so email failures don't block the user-facing response
- **All file uploads go directly to S3-compatible storage via presigned URLs** — the Next.js server generates a presigned `PUT` URL and returns it to the browser; the browser uploads directly to the bucket without the file passing through the Next.js server
- **Use `console.error` for errors, `console.log` for key events** — no logging library needed; hosting platforms (Vercel, Railway, etc.) capture stdout/stderr automatically
