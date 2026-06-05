# Schedica — Pre-Development Setup & Planning

> Complete this document **before writing a single line of application code.**
> Every credential, package, folder, and config listed here must be in place so development flows without stopping to hunt for keys or install missing tools.

---

## Table of Contents

1. [Local Machine Requirements](#1-local-machine-requirements)
2. [External Accounts to Create](#2-external-accounts-to-create)
3. [Credential Setup — Step by Step](#3-credential-setup--step-by-step)
4. [Complete Package List](#4-complete-package-list)
5. [Environment Variables — Full Template](#5-environment-variables--full-template)
6. [Project Folder Structure](#6-project-folder-structure)
7. [Database Setup](#7-database-setup)
8. [Pre-Development Checklist](#8-pre-development-checklist)

---

## 1. Local Machine Requirements

Install these tools on your development machine before anything else.

| Tool | Minimum Version | How to Check | Install |
|------|----------------|-------------|---------|
| **Node.js** | 20.x LTS | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | 10.x | `npm -v` | Comes with Node.js |
| **PostgreSQL** | 16+ | `psql --version` | [postgresql.org](https://www.postgresql.org) |
| **Git** | Any recent | `git --version` | Pre-installed on most systems |
| **VS Code** | Any | — | [code.visualstudio.com](https://code.visualstudio.com) |

**Recommended VS Code Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Drizzle ORM IntelliSense
- PostgreSQL (for DB browsing)

---

## 2. External Accounts to Create

You need accounts on **5 external services** before starting. Create them in this order — some approvals take time.

| # | Service | Used For | Cost | Time to Set Up |
|---|---------|----------|------|----------------|
| 1 | **Google Cloud Console** | Google OAuth sign-in + Google Calendar API + Google Meet link generation | Free | ~15 minutes |
| 2 | **Microsoft Azure Portal** | Microsoft Graph API — Outlook calendar sync + Teams meeting creation | Free | ~20 minutes |
| 3 | **Zoom Developer Portal** | Zoom OAuth app — create unique Zoom meeting per booking | Free | ~10 minutes |
| 4 | **S3-compatible Storage** | File storage — profile photos, logos, banners | Free tier available | ~10 minutes |
| 5 | **SMTP Email Provider** | Sending transactional emails (confirmations, reminders, resets) | Free tier available | ~5 minutes |

> **Tip:** Set up all 5 accounts in one session. Keep a secure note with all credentials ready before starting `Phase 0` of development.

---

## 3. Credential Setup — Step by Step

### 3.1 Google Cloud Console

**Used for:** Google OAuth sign-in (Better Auth) + Google Calendar API (read/write) + Google Meet link generation

**Steps:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project — name it `schedica-dev`
3. Go to **APIs & Services → Library**
   - Enable: **Google Calendar API**
   - Enable: **Google People API** (for OAuth user profile)
4. Go to **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Schedica`
   - User support email: your email
   - Scopes to add:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Add your email as a **Test user** (required before publishing)
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production — add later)
6. Copy and save:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

### 3.2 Microsoft Azure Portal

**Used for:** Microsoft Graph API — reading/writing Outlook calendar + creating Teams meeting links
> **Not** used for user sign-in. This is calendar integration only.

**Steps:**

1. Go to [portal.azure.com](https://portal.azure.com) (create a free account if needed)
2. Search for **App registrations → New registration**
   - Name: `Schedica Calendar Integration`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: Web → `http://localhost:3000/api/calendars/microsoft/callback`
3. Go to **API permissions → Add a permission → Microsoft Graph → Delegated permissions**
   - Add:
     - `Calendars.ReadWrite`
     - `OnlineMeetings.ReadWrite` (for Teams meetings)
     - `User.Read`
   - Click **Grant admin consent**
4. Go to **Certificates & secrets → New client secret**
   - Description: `schedica-dev`
   - Expires: 24 months
5. Copy and save **immediately** (shown only once):
   - `MICROSOFT_CLIENT_ID` (from Overview → Application (client) ID)
   - `MICROSOFT_CLIENT_SECRET` (the secret value you just created)

---

### 3.3 Zoom Developer Portal

**Used for:** Creating a unique Zoom meeting link for every booking

**Steps:**

1. Go to [marketplace.zoom.us/develop/create](https://marketplace.zoom.us/develop/create)
2. Choose **OAuth** app type
3. App name: `Schedica`
4. Choose: **User-managed** app
5. Redirect URL: `http://localhost:3000/api/video/zoom/callback`
6. Add scopes:
   - `meeting:write:admin`
   - `meeting:write`
   - `user:read:admin`
7. Copy and save:
   - `ZOOM_CLIENT_ID`
   - `ZOOM_CLIENT_SECRET`
   - `ZOOM_REDIRECT_URI` = `http://localhost:3000/api/video/zoom/callback`

> **Note:** Zoom apps start in development mode. For production you submit for review. Development mode is fine for local testing — only the app owner's Zoom account can connect.

---

### 3.4 S3-Compatible Storage

**Used for:** Storing profile photos, organisation logos, and banner images via presigned upload URLs.

**Choose one provider** (all use the same `@aws-sdk/client-s3` package):

| Provider | Free Tier | Best For | Extra Config |
|----------|----------|---------|-------------|
| **AWS S3** | 5GB / 12 months | Standard choice | Set `S3_ENDPOINT` to blank |
| **Cloudflare R2** | 10GB free forever | No egress fees | Set `S3_ENDPOINT` to R2 URL |
| **Backblaze B2** | 10GB free | Cheapest at scale | Set `S3_ENDPOINT` to B2 URL |
| **MinIO** | Unlimited (self-hosted) | Full control | Set `S3_ENDPOINT` to localhost |

**Steps (example: AWS S3):**

1. Create AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Go to **S3 → Create bucket**
   - Name: `schedica-uploads-dev`
   - Region: closest to your users
   - Block all public access: **ON** (files accessed via presigned URLs only)
3. Go to **IAM → Users → Create user**
   - Username: `schedica-s3-dev`
   - Attach policy: **AmazonS3FullAccess** (or create a custom policy scoped to only your bucket)
4. Go to **Security credentials → Create access key**
5. Copy and save:
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_REGION` (e.g. `us-east-1`)
   - `S3_BUCKET_NAME` (e.g. `schedica-uploads-dev`)
   - `S3_ENDPOINT` — leave blank for AWS; set for other providers

**Add CORS policy to the bucket** (required for browser direct uploads):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

---

### 3.5 SMTP Email

**Used for:** All transactional emails — booking confirmations, reminders, password resets, magic links, welcome emails.

**Choose one option:**

| Option | Cost | Best For | Config |
|--------|------|---------|--------|
| **Gmail SMTP** | Free (500/day) | Development + small scale | Enable 2FA → create App Password |
| **Outlook SMTP** | Free | Same as Gmail | Similar app password setup |
| **Mailhog** (local) | Free | Local dev only — captures emails without sending | `smtp://localhost:1025` |
| **Postfix** (self-hosted) | Free | Full control | Complex setup |
| **Mailtrap** | Free tier | Development testing | Catches all emails, shows in inbox |

**Gmail App Password (recommended for dev):**

1. Google Account → Security → 2-Step Verification (must be enabled)
2. Google Account → Security → App passwords
3. Select app: **Mail** | Device: **Other** → name it `Schedica Dev`
4. Copy the 16-character password

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   ← the 16-char app password
SMTP_FROM_EMAIL=yourname@gmail.com
SMTP_FROM_NAME=Schedica
```

**Mailhog for local dev (zero config — emails never actually send):**
```bash
# Mac
brew install mailhog && mailhog

# Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
# View caught emails at http://localhost:8025
```

---

## 4. Complete Package List

### 4.1 Create the Next.js Project First

```bash
npx create-next-app@latest schedica \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd schedica
```

### 4.2 Install All Dependencies — One Command

**Production dependencies:**
```bash
npm install \
  drizzle-orm postgres \
  better-auth \
  pg-boss \
  nodemailer \
  @react-email/components react-email \
  date-fns date-fns-tz \
  ical-generator \
  zod \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  googleapis \
  @microsoft/microsoft-graph-client \
  tsdav
```

**Development dependencies:**
```bash
npm install -D \
  drizzle-kit \
  @types/nodemailer \
  @microsoft/microsoft-graph-types \
  @types/pg
```

### 4.3 Shadcn/UI Setup

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then add all needed components:
```bash
npx shadcn@latest add \
  button input label form \
  dialog sheet drawer \
  dropdown-menu select \
  checkbox radio-group switch \
  calendar date-picker \
  card badge avatar \
  table tabs \
  toast sonner \
  separator scroll-area \
  skeleton \
  accordion \
  tooltip popover \
  command
```

### 4.4 Full Package Reference Table

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | Framework — App Router, Server Components, Server Actions, ISR |
| `react` / `react-dom` | 18.x | Included with Next.js |
| `typescript` | 5.x | Type safety across full stack |
| `tailwindcss` | 3.x | Utility-first CSS |
| `drizzle-orm` | latest | TypeScript ORM — schema-as-code, type-safe queries |
| `drizzle-kit` | latest | Dev tool — migration generation and Drizzle Studio |
| `postgres` | latest | PostgreSQL client driver (used by Drizzle) |
| `better-auth` | latest | Auth — email/password, Google OAuth, magic link, sessions |
| `pg-boss` | latest | PostgreSQL-backed job queue — no Redis required |
| `nodemailer` | latest | SMTP email delivery |
| `@react-email/components` | latest | Email template component library |
| `react-email` | latest | Email template dev server + renderer |
| `date-fns` | latest | Date arithmetic (add, subtract, format) |
| `date-fns-tz` | latest | Timezone-aware date arithmetic using IANA names — DST-safe |
| `ical-generator` | latest | RFC 5545-compliant `.ics` calendar invite file generator |
| `zod` | latest | Runtime validation for API inputs, forms, env vars |
| `@aws-sdk/client-s3` | latest | S3-compatible storage client (AWS, R2, MinIO, B2) |
| `@aws-sdk/s3-request-presigner` | latest | Generate presigned upload/download URLs |
| `googleapis` | latest | Google Calendar API + Google Meet link generation |
| `@microsoft/microsoft-graph-client` | latest | Microsoft Graph — Outlook calendar + Teams meetings |
| `tsdav` | latest | CalDAV client — Apple iCloud calendar *(Phase 2 only)* |

---

## 5. Environment Variables — Full Template

Create a `.env.local` file in the project root. **Never commit this file to git.**

```bash
# .env.local
# ─────────────────────────────────────────────────────────────
# CORE
# ─────────────────────────────────────────────────────────────

# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/schedica_dev

# Better Auth — generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=

# The full URL of your app (no trailing slash)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─────────────────────────────────────────────────────────────
# GOOGLE — OAuth sign-in + Calendar API + Google Meet
# From: console.cloud.google.com → APIs & Services → Credentials
# ─────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ─────────────────────────────────────────────────────────────
# MICROSOFT GRAPH API
# Used for: Outlook calendar sync + Teams meeting creation
# NOT used for user sign-in — calendar integration only
# From: portal.azure.com → App registrations
# ─────────────────────────────────────────────────────────────
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# ─────────────────────────────────────────────────────────────
# ZOOM — meeting link generation
# From: marketplace.zoom.us → Your App
# ─────────────────────────────────────────────────────────────
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=http://localhost:3000/api/video/zoom/callback

# ─────────────────────────────────────────────────────────────
# SMTP EMAIL DELIVERY
# Dev: use Mailhog (smtp://localhost:1025) or Gmail App Password
# Prod: use Gmail SMTP, Outlook SMTP, or self-hosted Postfix
# ─────────────────────────────────────────────────────────────
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=noreply@schedica.com
SMTP_FROM_NAME=Schedica

# ─────────────────────────────────────────────────────────────
# S3-COMPATIBLE STORAGE — profile photos, logos, banners
# Compatible providers: AWS S3, Cloudflare R2, MinIO, Backblaze B2
# From: your chosen storage provider dashboard
# ─────────────────────────────────────────────────────────────
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=us-east-1
S3_BUCKET_NAME=schedica-uploads-dev
# Leave blank for AWS S3. Set for other providers:
#   Cloudflare R2: https://<accountid>.r2.cloudflarestorage.com
#   MinIO local:   http://localhost:9000
#   Backblaze B2:  https://s3.<region>.backblazeb2.com
S3_ENDPOINT=
```

**How to generate `BETTER_AUTH_SECRET`:**
```bash
openssl rand -base64 32
```

**Add `.env.local` to `.gitignore`** (Next.js does this automatically, but double-check):
```
.env.local
.env*.local
```

---

## 6. Project Folder Structure

Create this folder structure manually or let the phases build it. Having it mapped out prevents confusion about where files go.

```
schedica/
│
├── src/
│   │
│   ├── middleware.ts                     ← Route protection (auth check on every request)
│   │
│   ├── app/                              ← Next.js App Router
│   │   │
│   │   ├── (auth)/                       ← Unauthenticated auth pages
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── verify-email/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/                  ← Host dashboard — protected (requires auth)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── event-types/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── availability/
│   │   │   │   └── page.tsx
│   │   │   ├── integrations/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       ├── profile/
│   │   │       │   └── page.tsx
│   │   │       ├── timezone/
│   │   │       │   └── page.tsx
│   │   │       ├── notifications/
│   │   │       │   └── page.tsx
│   │   │       └── security/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (admin)/                      ← Platform admin — protected by admin role
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       ├── bookings/
│   │   │       │   └── page.tsx
│   │   │       ├── jobs/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   │
│   │   ├── onboarding/                   ← First-run wizard (5 steps)
│   │   │   └── page.tsx
│   │   │
│   │   ├── [username]/                   ← Public booking pages — no auth required
│   │   │   ├── page.tsx                  ← Profile overview (lists all event types)
│   │   │   └── [eventSlug]/
│   │   │       ├── page.tsx              ← Event type booking calendar
│   │   │       └── confirmed/
│   │   │           └── page.tsx          ← Post-booking confirmation page
│   │   │
│   │   ├── api/                          ← Next.js API routes
│   │   │   ├── auth/
│   │   │   │   └── [...all]/
│   │   │   │       └── route.ts          ← Better Auth universal handler
│   │   │   ├── bookings/
│   │   │   │   └── route.ts              ← POST: create booking
│   │   │   ├── bookings/
│   │   │   │   └── [token]/
│   │   │   │       └── route.ts          ← GET/POST: cancel or reschedule
│   │   │   ├── calendars/
│   │   │   │   ├── google/
│   │   │   │   │   └── callback/
│   │   │   │   │       └── route.ts      ← Google Calendar OAuth callback
│   │   │   │   └── microsoft/
│   │   │   │       └── callback/
│   │   │   │           └── route.ts      ← Microsoft Calendar OAuth callback
│   │   │   ├── video/
│   │   │   │   └── zoom/
│   │   │   │       └── callback/
│   │   │   │           └── route.ts      ← Zoom OAuth callback
│   │   │   └── slots/
│   │   │       └── route.ts              ← GET: available time slots for a date
│   │   │
│   │   ├── layout.tsx                    ← Root layout
│   │   ├── page.tsx                      ← Landing page (/)
│   │   ├── privacy/
│   │   │   └── page.tsx
│   │   ├── terms/
│   │   │   └── page.tsx
│   │   └── cookies/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── booking/                      ← Booking page UI
│   │   │   ├── BookingCalendar.tsx
│   │   │   ├── TimeSlotGrid.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   └── ConfirmationScreen.tsx
│   │   ├── dashboard/                    ← Dashboard UI
│   │   │   ├── MeetingList.tsx
│   │   │   ├── EventTypeCard.tsx
│   │   │   └── StatsBar.tsx
│   │   ├── onboarding/                   ← Wizard step components
│   │   │   ├── StepProfile.tsx
│   │   │   ├── StepCalendar.tsx
│   │   │   ├── StepTimezone.tsx
│   │   │   ├── StepEventType.tsx
│   │   │   └── StepShare.tsx
│   │   └── ui/                           ← Shadcn/UI components (auto-generated)
│   │
│   └── lib/
│       │
│       ├── auth/
│       │   ├── config.ts                 ← Better Auth instance — providers, plugins, session
│       │   └── client.ts                 ← Better Auth client (used in Client Components)
│       │
│       ├── db/
│       │   ├── schema/                   ← Drizzle schema — one file per domain
│       │   │   ├── users.ts              ← users, sessions, accounts, verifications, user_profiles, user_branding, username_redirects
│       │   │   ├── event-types.ts        ← event_types, event_type_durations, cancellation_policies, availability_schedules, availability_windows, availability_overrides, event_type_questions
│       │   │   ├── bookings.ts           ← bookings, booking_answers, booking_guests
│       │   │   ├── calendars.ts          ← connected_calendars, calendar_events_cache
│       │   │   ├── video.ts              ← video_connections
│       │   │   ├── notifications.ts      ← notification_preferences, workflow_jobs
│       │   │   └── index.ts              ← exports all schema tables for Drizzle
│       │   ├── index.ts                  ← Drizzle client + db connection
│       │   └── queries/                  ← Reusable typed query helpers
│       │       ├── bookings.ts
│       │       ├── event-types.ts
│       │       └── slots.ts
│       │
│       ├── email/
│       │   ├── client.ts                 ← Nodemailer SMTP transporter singleton
│       │   ├── send.ts                   ← send() wrapper — render template → sendMail()
│       │   └── templates/                ← React Email components
│       │       ├── booking-confirmation.tsx
│       │       ├── booking-notification.tsx
│       │       ├── reminder.tsx
│       │       ├── cancellation.tsx
│       │       ├── reschedule.tsx
│       │       ├── welcome.tsx
│       │       └── verification.tsx
│       │
│       ├── storage/
│       │   ├── client.ts                 ← S3Client singleton
│       │   └── upload.ts                 ← getPresignedUploadUrl(), deleteFile(), getPublicUrl()
│       │
│       ├── jobs/
│       │   ├── client.ts                 ← pg-boss instance singleton
│       │   ├── workers/
│       │   │   ├── send-reminder.ts      ← 24h / 1h reminder email jobs
│       │   │   ├── send-confirmation.ts  ← Booking confirmation email job
│       │   │   ├── send-followup.ts      ← Post-meeting follow-up job
│       │   │   ├── sync-calendar.ts      ← Calendar free/busy sync job
│       │   │   ├── generate-video.ts     ← Zoom / Teams link generation job
│       │   │   └── gdpr-export.ts        ← Data export ZIP + S3 upload job
│       │   └── scheduler.ts              ← Job registration + cron definitions
│       │
│       └── types/
│           ├── booking.ts
│           ├── event-type.ts
│           └── calendar.ts
│
├── drizzle/                              ← Auto-generated migration files
│   └── meta/
│
├── features/                             ← Feature specification docs (16 files)
├── drizzle.config.ts                     ← Drizzle Kit config (MUST include schemaFilter)
├── next.config.ts
├── tsconfig.json
├── .env.local                            ← Never commit — all secrets here
├── .env.example                          ← Commit this — template with blank values
├── .gitignore
├── package.json
├── README.md
├── development-plan.md
└── pre-development-setup.md              ← This file
```

---

## 7. Database Setup

### 7.1 Create the PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE schedica_dev;
CREATE USER schedica_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE schedica_dev TO schedica_user;
\q
```

Your `DATABASE_URL`:
```
postgresql://schedica_user:your_password@localhost:5432/schedica_dev
```

### 7.2 Key Configuration — drizzle.config.ts

```typescript
// drizzle.config.ts — MUST include schemaFilter
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["public"],  // ← REQUIRED: prevents pg-boss pgboss schema from being touched
});
```

> **Why `schemaFilter: ["public"]` is required:**
> pg-boss creates its own `pgboss` schema automatically when the app starts. Without this filter, `drizzle-kit generate` detects those tables and tries to drop or alter them — breaking the job queue.

### 7.3 Run Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate

# Apply migration to database
npx drizzle-kit migrate

# Open Drizzle Studio to inspect tables
npx drizzle-kit studio
```

---

## 8. Pre-Development Checklist

Complete every item below before starting Phase 0 of [development-plan.md](./development-plan.md).

### Machine Setup
- [ ] Node.js 20+ installed (`node -v`)
- [ ] PostgreSQL 16+ installed and running (`pg_isready`)
- [ ] Git configured (`git config --global user.email`)

### Credentials Collected
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- [ ] Google Calendar API enabled in Google Cloud project
- [ ] Google OAuth consent screen configured with correct scopes
- [ ] Your email added as test user in Google OAuth consent screen
- [ ] `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` — from Azure App registration
- [ ] Microsoft Graph permissions granted (`Calendars.ReadWrite`, `OnlineMeetings.ReadWrite`, `User.Read`)
- [ ] `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_REDIRECT_URI` — from Zoom Developer Portal
- [ ] `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET_NAME` — from storage provider
- [ ] S3 CORS policy applied to bucket (allows PUT from localhost:3000)
- [ ] SMTP credentials ready (Mailhog running, or Gmail app password generated)
- [ ] `BETTER_AUTH_SECRET` generated (`openssl rand -base64 32`)

### Project Init
- [ ] Next.js 15 project created with TypeScript + Tailwind + App Router + src dir
- [ ] All npm packages installed (see [Section 4](#4-complete-package-list))
- [ ] Shadcn/UI initialized + all components added
- [ ] `.env.local` file created and all values filled in
- [ ] `.env.example` file created with blank values (safe to commit)
- [ ] `.env.local` confirmed in `.gitignore`
- [ ] PostgreSQL database created
- [ ] `drizzle.config.ts` configured with `schemaFilter: ["public"]`
- [ ] `npm run dev` runs without errors on `http://localhost:3000`
- [ ] Git repository initialized with first commit

### Verify External Services Work
- [ ] Google OAuth: click "Sign in with Google" → redirects to Google consent → returns to app
- [ ] Mailhog / SMTP: trigger a test email → appears in Mailhog at `http://localhost:8025`
- [ ] S3 upload: upload a test file via presigned URL → appears in bucket
- [ ] PostgreSQL: Drizzle Studio opens and shows tables (`npx drizzle-kit studio`)

---

> **Once all items above are checked, start [development-plan.md](./development-plan.md) from Phase 0.**
> Each phase in that document assumes everything in this file is already in place.
