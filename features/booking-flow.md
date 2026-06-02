# Booking Flow

The booking flow is the heart of Schedica. It defines the end-to-end journey from a user creating an event type to an invitee successfully scheduling a meeting.

---

## Overview

The booking flow eliminates the email back-and-forth of "when are you free?" by giving every user a shareable booking link. The invitee visits the link, sees real-time availability, picks a slot, and both parties receive a calendar invite — all in under two minutes.

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

## Group Booking Flow

For event types that allow multiple invitees per slot:
- Host sets maximum capacity (e.g., 10 people per slot)
- Invitees independently book the same slot
- Each invitee gets their own confirmation
- Slot hidden once capacity is reached
- All invitees receive same video conference link

---

## Multi-Host Collective Booking Flow

For events requiring multiple hosts to be present:
- System checks availability of ALL required hosts simultaneously
- Only shows slots when every host is free
- All hosts receive calendar invites
- All hosts can see the booking in their dashboard

---

## Reference Implementations

| App | Booking Flow Approach |
|-----|----------------------|
| **Calendly** | Clean step-by-step: date → time → form → confirm |
| **Cal.com** | Similar to Calendly; cleaner open-source UX |
| **SavvyCal** | Calendar overlay: invitee connects calendar for mutual availability view |
| **Chili Piper** | Inline form routing: form fills → instant calendar popup on same page |
| **HubSpot Meetings** | Minimal: embedded directly in HubSpot portal, auto-creates contact |

---

## MVP Scope

**In MVP:**
- Full solo user booking flow (steps 1–5)
- Confirmation email to both parties
- ICS calendar invite generation
- Cancellation and reschedule via email link
- Timezone auto-detection
- Custom intake questions

**Post-MVP:**
- Calendar overlay (invitee connects own calendar)
- Group booking with capacity limits
- Collective multi-host booking
- QR code sharing
