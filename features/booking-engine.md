# Booking Engine

The Booking Engine is the core mechanism that processes every meeting booking end-to-end — from the moment an invitee selects a time slot to the moment both parties' calendars are updated and confirmation emails are sent. It is the technical heart of Schedica.

---

## Overview

The Booking Engine is not the booking page (what invitees see visually) — it is the processing layer underneath. It answers:
- "Is this time slot still available right now?"
- "Which host should be assigned to this round-robin booking?"
- "How do I add this event to Google Calendar?"
- "What do I send in the confirmation email?"

The Booking Engine runs on every single booking and must be fast, reliable, and race-condition-safe.

---

## User Stories

**Host**
- As a host, I want the booking engine to prevent double-bookings in real-time, so that two invitees can never claim the same slot simultaneously. *(MVP)*
- As a host, I want a booking to only be confirmed after all availability checks pass, so that I never receive a booking for a time I am unavailable. *(MVP)*
- As a host, I want all post-booking tasks (calendar write, email, video link) to run in the background, so that the invitee gets an instant response without waiting. *(MVP)*

**Invitee**
- As an invitee, I want to receive clear feedback if a slot is taken while I am booking, so that I can immediately pick another available time. *(MVP)*
- As an invitee, I want the booking process to complete quickly without page reloads, so that confirming my meeting feels fast and smooth. *(MVP)*
- As an invitee, I want payment and booking to be handled together atomically, so that I am never charged for a meeting that was not confirmed. *(Phase 3)*

---

## Booking Engine Flow (Step by Step)

### 1. Slot Selection
Invitee selects a date and time from the booking page.

**Engine Actions:**
- Validate that the selected slot is still within the booking window
- Validate that minimum notice period is satisfied
- Validate that the slot is not in a blocked date override
- Pass slot forward for real-time conflict check

---

### 2. Real-Time Conflict Check

Before showing the payment/form page, re-verify availability.

**Why Real-Time Check?**
- Availability on the booking page may be cached (up to 5 minutes old)
- Another invitee may have booked the same slot between page load and form submission
- Prevents double-booking

**Conflict Sources Checked:**
- Connected Google Calendar: any "Busy" event overlapping the slot
- Connected Outlook Calendar: any busy event overlapping
- Existing Schedica bookings for this host at this time
- Buffer time from adjacent bookings (before and after)
- Daily meeting limit (if host has reached cap for the day)

**On Conflict Detected:**
- Engine returns `SLOT_UNAVAILABLE` error
- Booking page shows: "Sorry, that time was just taken. Please choose another slot."
- Page refreshes available times and highlights alternative slots

---

### 3. Form Submission

Invitee submits name, email, and custom question answers.

**Engine Actions:**
- Validate required fields (name, email format)
- Validate required custom question answers
- Sanitize all input (strip HTML, prevent injection)
- Normalize phone number format (if collected)
- Check email against blocked domains (if host configured any)

---

### 4. Payment Processing (If Paid Event Type)

If the event type requires payment, the engine waits for payment confirmation before proceeding.

> **Note:** Payment collection (Stripe / PayPal) is a Phase 3 post-MVP feature. The engine is designed to support it via the steps below, but it is not active in the MVP.

**Engine Actions:**
- Create a Stripe PaymentIntent for the meeting price
- Wait for client-side Stripe.js to confirm payment
- On payment success: receive `payment_intent_id` from Stripe
- On payment failure: return error; booking not created; slot remains available
- Booking record stores `payment_id` and `payment_amount` once payments are active

---

### 5. Host Assignment (Round-Robin Only)

For round-robin event types, the engine assigns a host from the pool.

**Assignment Algorithm (Balanced mode):**
1. Get all active team members in the round-robin pool
2. Filter to members who are available at the selected time (re-check calendar)
3. Filter to members who have not hit their daily/weekly limit
4. From remaining candidates, select the one who was booked least recently
5. If tie: select randomly
6. If no available member found: return `NO_AVAILABLE_HOST` error

**Atomic Operation:**
- Assignment written to database in a transaction to prevent two concurrent bookings choosing the same host
- PostgreSQL advisory lock used to handle race conditions

---

### 6. Create Booking Record

The booking is written to the Schedica database.

**Booking Record Contains:**

| Field | Description |
|-------|-------------|
| booking_id | UUID, globally unique |
| event_type_id | Which event type was booked |
| host_user_id | Assigned host (from round-robin or direct) |
| invitee_name | Invitee's full name |
| invitee_email | Invitee's email address |
| invitee_phone | Phone number (if collected) |
| invitee_timezone | Timezone detected/selected by invitee |
| start_time | Meeting start (stored as UTC) |
| end_time | Meeting end (stored as UTC) |
| location_type | zoom / meet / teams / phone / in_person / custom |
| location_value | Generated video link or address |
| custom_answers | JSON map of question ID → answer |
| payment_id | Stripe PaymentIntent ID (if paid) |
| payment_amount | Amount charged in cents |
| status | confirmed / cancelled / rescheduled / completed |
| created_at | Booking creation timestamp (UTC) |
| cancel_token | Unique token for cancel link in email |
| reschedule_token | Unique token for reschedule link in email |

---

### 7. Generate Video Conference Link

If location type is Zoom, Google Meet, or Teams, generate a unique link.

**Zoom:**
- API call: `POST /v2/users/{userId}/meetings`
- Creates a new Zoom meeting with the booking time and duration
- Returns unique join URL and meeting ID
- Stored in `location_value` field

**Google Meet:**
- Included in the Google Calendar event creation (Step 8)
- `conferenceData.createRequest` parameter triggers Google Meet link generation
- No separate API call required

**Microsoft Teams:**
- API call: `POST /v1.0/users/{userId}/onlineMeetings`
- Creates Teams meeting at the booking time
- Returns unique joinWebUrl
- Stored in `location_value` field

**Fallback:**
- If video link generation fails: booking still created
- Host is notified: "Video link generation failed — please add manually"
- Invitee confirmation still sent; video field shows "Link will be sent separately"

---

### 8. Write to Calendar

Add the meeting to the host's calendar (and optionally invitee's calendar).

**Host Calendar (Google):**
```
POST /calendars/{calendarId}/events
{
  summary: "30-Min Call with Jane Smith",
  start: { dateTime: "2026-06-10T14:00:00", timeZone: "America/New_York" },
  end: { dateTime: "2026-06-10T14:30:00", timeZone: "America/New_York" },
  attendees: [{ email: "jane@example.com" }],
  location: "https://zoom.us/j/...",
  description: "Booking ID: abc123\n\nQuestion answers..."
}
```

**Host Calendar (Outlook):**
- Microsoft Graph API: `POST /me/events`
- Same data, Graph API format

**ICS File for Invitee:**
- Generate RFC 5545-compliant `.ics` file
- Attached to confirmation email
- Works with any calendar app (Apple Calendar, Outlook, Thunderbird, etc.)
- Contains VTIMEZONE component for DST-safe display

**Calendar Write Failure:**
- If Google/Outlook API returns error: retry up to 3 times with exponential backoff
- If still failing after retries: booking marked `calendar_sync_failed` 
- Host notified with manual add option
- Booking still confirmed for invitee

---

### 9. Send Confirmation Emails

Send confirmation emails to both host and invitee.

**Invitee Confirmation Email:**
- Subject: "[Confirmed] 30-Min Call with Jane on Thursday June 5"
- Body: meeting summary, video link, location, reschedule link, cancel link
- ICS attachment for calendar import
- Sent within 5 seconds of booking

**Host Notification Email:**
- Subject: "New booking: 30-Min Call — Jane Smith on June 5 at 10am"
- Body: invitee details, form answers, video link, cancel link
- Sent within 5 seconds of booking

**Email Delivery:**
- Transactional email via Resend or SendGrid
- Delivery confirmation tracked (open/bounce events)
- If delivery fails: retry once; log failure; host notified in dashboard

---

### 10. Booking Confirmation Response

The booking engine returns a success response to the browser.

**Response Payload:**
- Booking ID
- Confirmed start/end time (in invitee's timezone)
- Host name
- Video link (or location)
- Reschedule URL
- Cancel URL

**Browser Action:**
- Booking page transitions to confirmation screen
- "You're scheduled!" message shown
- Calendar import buttons displayed
- Meeting details summary

---

## Race Condition Handling

The most critical reliability concern: two invitees trying to book the same slot simultaneously.

### PostgreSQL Advisory Lock Strategy

Schedica uses **PostgreSQL advisory locks** — a pessimistic locking approach that prevents two concurrent booking requests from both succeeding for the same slot.

1. When an invitee submits the booking form, the engine calls `SELECT pg_advisory_xact_lock(slotHash)` where `slotHash` is a deterministic integer derived from `eventTypeId + startTime`
2. The lock is held for the duration of the database transaction — any second request for the same slot blocks until the first transaction completes
3. Inside the lock: perform the final availability check → if slot is free, insert booking record → commit
4. Lock is released automatically when the transaction commits or rolls back (no manual release needed, no TTL to manage, no extra table required)
5. If another session is waiting for the same lock: it runs its own check after the first commits — if the first succeeded, the slot is now taken and the second returns "slot unavailable"

### Database Transaction
All booking creation steps (lock acquisition → availability check → booking insert → job enqueue) run in a single database transaction. If any step fails, the entire transaction rolls back — no orphaned records, no double-bookings.

---

## Retry and Resilience

| Step | Failure Handling |
|------|-----------------|
| Conflict check | Fail-safe: return unavailable if check errors |
| Payment processing | Stripe handles retries; booking not created on failure |
| Host assignment | Return error to invitee if no host available |
| Calendar write | Retry 3× with backoff; notify host if all retries fail |
| Video link generation | Retry 2×; booking created without link if fails |
| Email sending | Retry 2×; log failure; dashboard alert to host |

---

## Booking Statuses

| Status | Description |
|--------|-------------|
| `confirmed` | Meeting booked and active |
| `cancelled` | Cancelled by host or invitee |
| `rescheduled` | Original booking replaced by new one |
| `completed` | Meeting time has passed (no cancellation) |
| `no_show` | Meeting time passed, marked as no-show by host |
| `pending_payment` | Awaiting payment confirmation (paid events) |

---

## Rate Limiting on Public Booking Endpoints

Booking pages are publicly accessible with no authentication required — making them a target for scraping, spam bookings, and slot-exhaustion attacks. Rate limiting must be applied at multiple layers.

### Limits Applied

| Endpoint | Limit | Scope | Action on Breach |
|----------|-------|-------|-----------------|
| `GET /[username]/[eventSlug]` — slot query | 60 requests / minute | Per IP | Return 429, show "Too many requests. Please wait." |
| `POST /api/bookings` — booking creation | 5 bookings / hour | Per IP | Return 429, "Too many bookings from this device. Try again later." |
| `POST /api/bookings` — booking creation | 3 bookings / hour | Per invitee email | Return 429, "You have recently made several bookings. Please wait before booking again." |
| `GET /api/slots` — available slot fetch | 30 requests / minute | Per IP | Return 429 silently; cache last response |

### Implementation
- Rate limiting via **@upstash/ratelimit** with a Redis-backed sliding window
- IP extracted from `x-forwarded-for` header (Vercel sets this behind the proxy)
- Email-based limits applied after form submission — email is extracted from request body before booking is processed
- Rate limit headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Spam Booking Protection
- Email format validated with Zod before any DB write
- Disposable email domain blocklist checked against known throwaway providers
- CAPTCHA (hCaptcha or Cloudflare Turnstile) shown after 2 failed or suspicious submissions from the same IP — not shown by default to keep the flow frictionless for legitimate users

---

## Performance Targets

| Operation | Target Time |
|-----------|------------|
| Conflict check | < 500ms |
| Full booking creation | < 3 seconds |
| Calendar write (async) | < 10 seconds |
| Confirmation email delivery | < 30 seconds |
| Booking page initial load | < 1.5 seconds |

---

## Reference Implementations

| App | Race Condition Protection | Real-Time Conflict Check | Post-Booking Jobs Async | Slot-Taken Error Message | Payment + Booking Atomic |
|-----|--------------------------|-------------------------|------------------------|--------------------------|--------------------------|
| **Calendly** | ✅ Industry benchmark; no double-bookings reported | ✅ Re-checks at form submit | Partial | Generic "time no longer available" | N/A — payments via redirect |
| **Cal.com** | ✅ Atomic booking via open-source engine | ✅ Yes | ✅ Queue-based | Generic message | ✅ Stripe PaymentElement |
| **SavvyCal** | ✅ Yes | ✅ Yes | ✅ Yes | Generic message | ❌ No payments |
| **Chili Piper** | ✅ Optimised for high-volume inbound leads | ✅ Near real-time | ✅ Yes | ✅ With alternative slot suggestion | N/A |
| **HubSpot Meetings** | ✅ Yes | ✅ Yes | ✅ Yes | Generic message | ❌ No payments |
| **Schedica** | ✅ PostgreSQL advisory lock — concurrent bookings for same slot cannot both succeed | ✅ Final check inside DB transaction before insert | ✅ All post-booking work (video link, calendar write, confirmation email, reminder scheduling) runs as pg-boss jobs after transaction commits — booking API responds instantly | ✅ Clear message + highlights alternative available slots on the same page | ✅ Phase 3 — payment and booking in single transaction (no orphaned charges) |

---

## MVP Scope

**In MVP:**
- Full 10-step booking flow (conflict check → calendar write → email)
- PostgreSQL advisory lock for race condition prevention (no extra table needed)
- Google Calendar and Outlook write support
- ICS file generation for invitees
- Zoom and Google Meet link generation
- Confirmation email to both parties within 5 seconds
- Booking record with all fields persisted
- All booking statuses tracked
- Retry logic for calendar write and email

**Post-MVP:**
- Apple Calendar write (CalDAV POST)
- Microsoft Teams link generation
- Async queue for calendar writes (improve response time)
- Booking engine webhook events (booking.created, etc.)
- Detailed engine logs for debugging


---

## Tech Stack

- **PostgreSQL** — the booking engine depends on two PostgreSQL features for reliability: (1) **advisory locks** (`pg_advisory_xact_lock`) to prevent two concurrent bookings from claiming the same slot, and (2) **transactions** to ensure the booking record, answer records, and all related writes either all succeed or all roll back together.
- **Drizzle ORM** — the `bookings` table holds all booking data (UTC times, status, cancel token, reschedule token, custom answer references, video link). Drizzle's transaction API is used for the atomic booking creation flow.
- **Next.js API Route** — `POST /api/bookings` is the single endpoint for the entire booking creation flow: Zod validation → conflict check → DB write → job dispatch.
- **Zod** — validates the complete booking form payload (invitee name, email, selected slot, answers) before any database operation. Strips HTML from all text inputs to prevent XSS.
- **pg-boss** — after the database transaction commits, four jobs are enqueued: video link generation, calendar event write, confirmation email to both parties, and reminder scheduling. Separating these from the transaction means the booking is confirmed instantly even if a downstream API (Zoom, Google) is slow.
