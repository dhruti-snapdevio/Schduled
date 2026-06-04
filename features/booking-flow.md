# Booking Flow

The booking flow is the heart of Schedica. It defines the end-to-end journey from a user creating an event type to an invitee successfully scheduling a meeting.

---

## Overview

The booking flow eliminates the email back-and-forth of "when are you free?" by giving every user a shareable booking link. The invitee visits the link, sees real-time availability, picks a slot, and both parties receive a calendar invite — all in under two minutes.

---

## User Stories

**Host**
- As a host, I want to create a booking link in under 3 minutes, so that I can start accepting meetings immediately after signing up. *(MVP)*
- As a host, I want to share a single link that reflects my real-time availability, so that invitees always see accurate open slots without me updating anything manually. *(MVP)*
- As a host, I want to add my booking link to my email signature and LinkedIn, so that anyone can book me directly without asking for my availability. *(MVP)*
- As a host, I want to embed my booking page on my website, so that visitors can schedule a meeting without leaving my site. *(Phase 2)*

**Invitee**
- As an invitee, I want to book a meeting without creating an account, so that scheduling is fast and friction-free. *(MVP)*
- As an invitee, I want to see available time slots in my own timezone, so that I do not have to manually convert times. *(MVP)*
- As an invitee, I want to fill in a short booking form before confirming, so that the host has the context they need before we meet. *(MVP)*
- As an invitee, I want to reschedule or cancel my booking via a link in my email, so that I do not need to contact the host directly. *(MVP)*

---

## Host Journey (Setting Up)

### Step 1 — Connect Calendar
- Connect one or more calendars (Google Calendar, Outlook, Apple/iCloud, CalDAV)
- Schedica reads busy/free data from connected calendars in real-time
- Prevents double-booking across all connected calendars
- User selects which calendar new bookings are added to

### Step 2 — Create an Event Type
- Give the event type a name (e.g., "30-Minute Intro Call")
- Set meeting duration (15, 30, 45, 60 min — or custom)
- Set meeting location: Zoom, Google Meet, Teams, phone call, custom location, or in-person address
- Add a description shown to invitees on the booking page
- Set booking URL slug (e.g., `schedica.com/yourname/intro-call`)

### Step 3 — Configure Availability
- Set weekly recurring hours (e.g., Mon–Fri, 9am–5pm)
- Add buffer time before and after meetings
- Set minimum notice (e.g., 24-hour advance booking required)
- Set booking window (how far in advance invitees can book)
- Block specific dates or override hours for holidays

### Step 4 — Customize Booking Page
- Upload profile photo and banner image
- Add custom intake questions
- Set confirmation page message or redirect URL
- Configure cancellation and reschedule policies

### Step 5 — Share the Link
- Copy direct booking link
- Add to email signature, LinkedIn, website
- Embed on website (inline, pop-up, or floating widget)
- Share via QR code

---

## Invitee Journey (Booking a Meeting)

### Step 1 — Visit Booking Page
- Invitee opens the booking link
- Sees host's name, event type, duration, location type
- Sees a calendar with available time slots highlighted

### Step 2 — Select Date and Time
- Calendar shows current month with available days
- Click a date to see available time slots for that day
- Time slots shown in invitee's local timezone (auto-detected)
- Option to manually change timezone

### Step 3 — Calendar Overlay (Optional — Advanced UX)
- Invitee can optionally connect their own calendar
- Their existing events appear as an overlay on the host's available slots
- Mutual free times are highlighted, busy times shown in context
- Makes it immediately obvious which slot works for both parties
- Inspired by SavvyCal's overlay UX

### Step 4 — Fill Booking Form
- Required fields: Name, Email
- Optional: Phone number
- Custom questions (pre-configured by host): text, dropdown, checkbox, radio
- Pre-fill via URL parameters for embedded forms

### Step 5 — Confirmation
- Instant confirmation screen shown
- Confirmation email sent to both host and invitee
- Calendar invite (.ics) attached and added to both parties' calendars
- Video conferencing link (Zoom / Meet / Teams) included in invite
- Option for invitee to schedule another meeting

---

## Booking Conflict Prevention

- **Real-time availability check** — Schedica re-checks calendar at the moment of booking to prevent race conditions
- **Buffer enforcement** — Buffer times before/after are factored into available slots
- **Daily meeting limits** — If host has set a cap (e.g., max 5 meetings/day), slots beyond that cap are hidden
- **Minimum notice enforcement** — Same-day or same-hour bookings blocked if notice period not met

---

## Cancellation Policy Enforcement

Schedica goes beyond Calendly by not just displaying a policy — it can **actively enforce** cancellation rules.

### Policy Text (All Plans)
Hosts can add cancellation policy text shown on the booking page and in confirmation emails:
> "Cancellations must be made at least 24 hours before the meeting."

This is informational only; the invitee can still cancel at any time via their email link unless enforcement is enabled.

### Enforcement Window (Configurable)
Per event type, hosts can set a **cancellation window** that blocks invitees from cancelling within a set period before the meeting.

| Setting | Description |
|---------|-------------|
| No enforcement (default) | Invitee can cancel any time up to the meeting |
| Block cancellations within X hours | Invitee's cancel link shows an error if within window |
| Block cancellations entirely | Cancel link disabled; invitee must contact host |

**Behavior when invitee tries to cancel within the blocked window:**

The cancel link is always active (invitee should never see a dead link). When clicked inside the blocked window, the invitee reaches a **Cancellation Blocked** page that shows:

| Element | Content |
|---------|---------|
| Heading | "This booking can no longer be cancelled online" |
| Explanation | "Cancellations for this meeting are not accepted within [X hours] of the start time." |
| Meeting details | Date, time, host name — so invitee knows which booking this is |
| Host contact | "To discuss this booking, please contact: **[host reply-to email]**" |
| Calendar reminder | "Add to calendar" button still visible so invitee can ensure they attend |

- Host is **not automatically notified** when the blocked page is shown — the invitee must reach out directly
- Booking status remains `confirmed` — no change on the host's dashboard
- The reschedule link follows the same logic independently: if reschedule window is also blocked, the reschedule link shows a similar page with the host email

**Enforcement Scope:**
- Applies to invitee-initiated cancellations via email link only
- Host can always cancel from the dashboard regardless of the enforcement window
- If the host cancels inside the window: invitee receives a cancellation email with an apology note

### Reschedule Policy (Separate from Cancel)
- Reschedule window can be set independently from cancellation window
- Example: Allow rescheduling up to 4 hours before, block cancellations within 24 hours
- If rescheduling is disabled entirely: reschedule link leads to contact message

### Reschedule Limits
- **Maximum reschedules per booking** — Hosts can cap how many times a single booking can be rescheduled (e.g., maximum 2 reschedules per invitee per event)
- If limit is reached: reschedule link shows: "This meeting has been rescheduled the maximum number of times. Please contact [host] to make further changes."

### Cancellation Reason (Optional)
When an invitee cancels (within policy), they can optionally provide a reason:
- Reason is free text or selectable from a dropdown (host configures options)
- Example options: "Schedule conflict", "No longer needed", "Need to reschedule", "Other"
- Reason is stored with the cancellation record and visible in the host's Meetings Dashboard
- Reason included in the host's cancellation notification email

### Configuration (Per Event Type)
Event type settings → Cancellation & Reschedule tab:

| Option | Values |
|--------|--------|
| Cancellation policy text | Free text (shown on booking page) |
| Enforce cancellation window | Off / 1h / 2h / 4h / 8h / 24h / 48h / 72h |
| Allow rescheduling | On / Off |
| Enforce reschedule window | Off / 1h / 2h / 4h / 8h / 24h |
| Max reschedules per booking | Unlimited / 1 / 2 / 3 |
| Require cancellation reason | Off / Optional / Required |
| Cancellation reason options | Custom dropdown list (host-defined) |

---

## Cancellation & Reschedule Flow

### Invitee Cancels
1. Invitee clicks "Cancel" link in confirmation email
2. Shown cancellation form (optional reason field)
3. Cancellation confirmed; both parties notified
4. Calendar event removed from both calendars
5. Host can trigger post-cancellation workflows (e.g., offer to reschedule)

### Invitee Reschedules
1. Invitee clicks "Reschedule" link in confirmation email
2. Taken back to booking page with original time slot highlighted
3. Selects new time
4. Original calendar invite updated for both parties
5. Confirmation email sent with updated details

### Host Cancels
- Host can cancel any booking from their dashboard
- Invitee is notified automatically
- Optional: host provides a reason or rescheduling prompt

---

## Group Booking Flow *(Post-MVP — Phase 2)*

For event types that allow multiple invitees per slot:
- Host sets maximum capacity (e.g., 10 people per slot)
- Invitees independently book the same slot
- Each invitee gets their own confirmation
- Slot hidden once capacity is reached
- All invitees receive same video conference link

---

## Multi-Host Collective Booking Flow *(Post-MVP — Phase 2)*

For events requiring multiple hosts to be present:
- System checks availability of ALL required hosts simultaneously
- Only shows slots when every host is free
- All hosts receive calendar invites
- All hosts can see the booking in their dashboard

---

## Reference Implementations

| App | Booking Steps | Cancel / Reschedule (no login) | Cancellation Enforced | Calendar Overlay | Group Booking |
|-----|--------------|-------------------------------|----------------------|-----------------|---------------|
| **Calendly** | Date → time → form → confirm | ✅ Token links in email | ❌ Policy text shown only — never enforced | ❌ No | ✅ Paid plans |
| **Cal.com** | Same as Calendly | ✅ Token links | ❌ Policy text only | ❌ No | ✅ Yes |
| **SavvyCal** | Date → time (with calendar overlay) → form → confirm | ✅ Token links | ❌ No | ✅ **Yes** — invitee connects their calendar to see mutual free times | ❌ No |
| **Chili Piper** | Embedded form → instant calendar popup → confirm | ✅ Via email link | ❌ No | ❌ No | ✅ Yes |
| **HubSpot Meetings** | Minimal — date → time → confirm; no custom form | ✅ Via email link | ❌ No | ❌ No | ✅ Basic |
| **Schedica** | Date → time → form → confirm; dual-timezone shown at every step | ✅ Secure token links — no Schedica account needed | ✅ **Configurable enforcement window** — cancel link blocked within X hours before meeting (Calendly gap filled) | ✅ Phase 3 (SavvyCal-inspired) | ✅ Phase 2 |

---

## MVP Scope

**In MVP:**
- Full solo user booking flow (steps 1–5)
- Confirmation email to both parties (with dual timezone display)
- ICS calendar invite generation
- Cancellation via email link (token-based, no login required)
- Reschedule via email link (token-based, no login required)
- **Cancellation policy text** shown on booking page and in confirmation emails
- **Cancellation window enforcement** — block cancellations within a configurable number of hours before meeting (e.g., no cancellations within 24 hours) — this is a direct Calendly gap: Calendly only shows policy text, never enforces it
- **Reschedule window enforcement** — block reschedules within a configurable window
- **Cancellation reason capture** — optional or required reason dropdown on cancel page
- Timezone auto-detection for invitee
- Custom intake questions on booking form

> **Calendly comparison:** Calendly displays cancellation policy text but does not enforce it — any invitee can cancel at any time regardless of the stated policy. Schedica actually blocks the cancel link when the window has passed, which is a key differentiator for paid sessions, coaching calls, and high-value demos.

**Post-MVP:**
- Calendar overlay (invitee connects own calendar to see mutual free times)
- Group booking with capacity limits
- Collective multi-host booking
- QR code for sharing booking link
- Maximum reschedules per booking limit


---

## Tech Stack

- **Next.js App Router** — the full booking flow spans three pages: the public booking calendar (`/[username]/[eventSlug]`), the booking form (step 2 on the same page), and the confirmation screen (`/booking/confirmed`). Cancel and reschedule flows are token-based pages that work without any invitee login.
- **PostgreSQL** — cancel and reschedule operations use database transactions to ensure atomic state changes (no partial updates). Advisory locks prevent two concurrent reschedule requests from creating conflicting bookings for the same new slot.
- **Drizzle ORM** — stores a unique `cancelToken` and `rescheduleToken` on every booking record. These tokens are embedded in confirmation email links, allowing invitees to cancel or reschedule without an account. Token lookup is the only authentication needed for these flows.
- **pg-boss** — orchestrates all async work triggered by the booking flow. On new booking: enqueues video link generation, calendar write, confirmation email, and reminder scheduling. On cancellation or reschedule: cancels pending reminder jobs and enqueues cancellation/reschedule notification emails.
- **Better Auth** — protects host-side dashboard routes. The public booking and cancel/reschedule flows are intentionally unauthenticated — invitees use secure single-use tokens instead of requiring a Schedica account.
