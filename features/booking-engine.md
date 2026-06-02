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

**Engine Actions:**
- Create a Stripe PaymentIntent for the meeting price
- Wait for client-side Stripe.js to confirm payment
- On payment success: receive payment_intent_id from Stripe
- On payment failure: return error; booking not created; slot remains available
- See [payments.md](payments.md) for full detail

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
- Optimistic locking used to handle race conditions

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

### Optimistic Locking Strategy
1. When invitee submits booking form, engine creates a "pending reservation" with 5-minute TTL
2. Slot is temporarily locked for this session
3. If payment/form processing takes > 5 minutes, lock expires and slot is released
4. On booking completion: reservation upgraded to confirmed booking (atomic transaction)
5. If another session tries to book same slot while reserved: receives "slot unavailable"

### Database Transaction
All booking creation steps (write booking record + calendar write trigger) run in a single database transaction. If any step fails, the entire transaction rolls back — no orphaned records.

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

## Performance Targets

| Operation | Target Time |
|-----------|------------|
| Conflict check | < 500ms |
| Full booking creation | < 3 seconds |
| Calendar write (async) | < 10 seconds |
| Confirmation email delivery | < 30 seconds |
| Booking page initial load | < 1.5 seconds |

---

## Reference Implementation (Calendly)

Calendly's booking engine is the industry benchmark:
- Real-time availability check on slot selection
- Atomic booking creation with calendar write
- Instant confirmation emails
- ICS attachment included
- Race condition protection (no double-booking)
- Graceful handling of calendar API failures

Schedica aims for feature parity with additional improvements:
- Better error messages to invitee when slot is taken
- Faster calendar sync (push notifications vs polling)
- Atomic payment + booking creation (no orphaned payments)

---

## MVP Scope

**In MVP:**
- Full 10-step booking flow (conflict check → calendar write → email)
- Optimistic locking for race condition prevention
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
