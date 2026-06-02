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
| Sales Teams | Lead routing, CRM sync, round-robin assignment |
| Customer Success | Client onboarding, support call scheduling |
| Recruiters | Interview scheduling, multi-interviewer collective events |
| Consultants / Coaches | Paid sessions, package bookings |
| Enterprises | Team workspaces, SSO, compliance, advanced routing |

---

## Core Functionality

Schedica is organized around five core pillars:

### 1. Smart Scheduling
- Create event types (1-on-1, group, round-robin, collective)
- Connect calendars and sync availability in real-time
- Share booking links that auto-update as availability changes

### 2. Team Coordination
- Distribute meetings across team members (round-robin, priority, weighted)
- Require multiple hosts simultaneously (collective)
- Manage team workspaces with admin controls

### 3. Booking Experience
- Customizable booking pages with branding
- Custom intake questions before booking
- Calendar overlay so invitees see mutual availability (inspired by SavvyCal)

### 4. Automation & Workflows
- Automated email and SMS reminders
- Pre-meeting confirmations and post-meeting follow-ups
- Webhook and Zapier triggers for any event

### 5. Revenue & Growth
- Lead qualification routing forms
- Stripe / PayPal payment collection at booking
- CRM sync (HubSpot, Salesforce) with automatic contact creation
- Analytics dashboard to track meeting performance

---

## MVP Feature List

The MVP focuses on delivering a complete solo + small team scheduling experience.

### Phase 1 — Core MVP (Solo Users)

| # | Feature | Description |
|---|---------|-------------|
| 1 | User Onboarding | Sign up, connect calendar, set timezone — guided first-run experience |
| 2 | User Profile & Settings | Name, photo, timezone, connected calendars, notification preferences |
| 3 | Event Type Builder | Create unlimited event types (name, duration, location, description) |
| 4 | Availability Settings | Set weekly hours, buffer times, minimum notice, date overrides |
| 5 | Timezone Management | Auto-detect invitee timezone, manual override, both timezones in emails |
| 6 | Calendar Sync | Real-time free/busy sync with Google, Outlook, and Apple Calendar |
| 7 | Booking Page | Public-facing scheduling page with available time slots and host branding |
| 8 | Booking Engine | Core booking processor — slot selection, conflict check, calendar write, confirmation |
| 9 | Custom Questions | Add intake questions to booking form (text, dropdown, checkbox, multiple choice) |
| 10 | Video Conferencing | Auto-generate unique Zoom / Google Meet / Teams links per booking |
| 11 | Booking Confirmation | Instant confirmation email with calendar invite to both host and invitee |
| 12 | Notifications & Reminders | Automated 24-hour and 1-hour email reminders; post-meeting follow-up |
| 13 | Meetings Dashboard | View all upcoming and past meetings; search, filter, and manage bookings |
| 14 | Cancellation & Reschedule | Invitee-initiated cancellation and reschedule via email link |

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
| 3 | HubSpot Integration | Auto-create contacts; log meetings to deals |
| 3 | Salesforce Integration | Native CRM sync and lead routing |
| 3 | Zapier / Make | Connect to 1000+ apps via automation platforms |
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
| **Calendly** | Market leader, ease of use | Expensive for teams; dropped Apple Calendar support |
| **Cal.com** | Open source, generous free tier | Complex self-hosting; less polished UX |
| **Chili Piper** | Best-in-class B2B lead routing | Extremely expensive; Salesforce-only; steep learning curve |
| **HubSpot Meetings** | Native CRM integration | Tied to HubSpot; basic features on free tier |
| **SavvyCal** | Best booking UX (calendar overlay) | No free tier; small ecosystem |

**Schedica's positioning:** A polished, affordable scheduling platform with SavvyCal-quality UX, Calendly-level features, and Chili Piper-inspired lead routing — at a price accessible to growing teams.

---

## Tech Stack (Suggested)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React), Tailwind CSS |
| Backend | Node.js / TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Calendar API | Google Calendar API, Microsoft Graph API |
| Auth | NextAuth.js or Clerk |
| Video | Zoom API, Google Meet API, MS Teams API |
| Payments | Stripe |
| Email | Resend or SendGrid |
| SMS | Twilio |
| Background Jobs | BullMQ / Redis |
| Deployment | Vercel (frontend) + Railway / Render (backend) |

---

## Project Structure (Planned)

```
schedica/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Backend API server
├── packages/
│   ├── ui/               # Shared UI components
│   ├── db/               # Prisma schema and migrations
│   └── types/            # Shared TypeScript types
├── features/             # MVP feature documentation (14 files)
│   │
│   ├── — Account & Profile —
│   ├── user-onboarding.md
│   ├── user-profile-settings.md
│   │
│   ├── — Scheduling Setup —
│   ├── event-types.md
│   ├── availability-management.md
│   ├── calendar-integrations.md
│   ├── timezone-management.md
│   │
│   ├── — Booking Experience —
│   ├── booking-page-customization.md
│   ├── custom-questions.md
│   ├── video-conferencing.md
│   ├── booking-engine.md
│   ├── booking-confirmation.md
│   │
│   ├── — Management & Communication —
│   ├── meetings-dashboard.md
│   ├── notifications-reminders.md
│   └── booking-flow.md          # cancellation & reschedule
└── README.md
```

---

## Key Differentiators

1. **Apple Calendar Support** — Native iCloud/Apple Calendar sync; Calendly dropped this in August 2024
2. **Calendar Overlay Booking** — Invitees connect their own calendar and see real mutual availability (SavvyCal-style UX, mainstream reach)
3. **Cancellation Policy Enforcement** — Calendly only shows policy text; Schedica actually enforces cancellation windows
4. **Affordable B2B Lead Routing** — Chili Piper-grade routing (territory, CRM lookup, round-robin) at Calendly-level pricing
5. **AI Notetaker Built-In** — Auto-join, record, transcribe, and summarize every meeting; action items tracked
6. **Multi-CRM Without Lock-In** — HubSpot + Salesforce + Pipedrive natively; not tied to one vendor
7. **Meeting Overload Protection** — Daily/weekly limits, ranked availability, deep-work time blocking
8. **Transparent Pricing** — Per-feature tiers; key features not locked behind per-seat enterprise plans

---

## References

- [Calendly](https://calendly.com) — Market leader, benchmark for core scheduling UX
- [Cal.com](https://cal.com) — Open source reference implementation
- [Chili Piper](https://chilipiper.com) — B2B lead routing and sales scheduling
- [HubSpot Meetings](https://hubspot.com/products/sales/schedule-meeting) — CRM-native scheduling
- [SavvyCal](https://savvycal.com) — Calendar overlay UX inspiration
