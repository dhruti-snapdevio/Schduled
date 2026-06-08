# Notifications & Reminders

Notifications and reminders keep hosts and invitees informed before, during, and after every meeting. Automated workflows reduce no-shows, improve engagement, and eliminate the need to manually follow up after each booking.

---

## Overview

Schedica sends notifications through two channels:
1. **Transactional emails** — Booking confirmations, cancellations, reschedules (triggered instantly) *(MVP)*
2. **Workflow automations** — Timed email sequences before or after meetings *(MVP)*; SMS sequences *(Phase 2)*

Both types are customizable to match the host's brand and communication style.

---

## User Stories

**Host**
- As a host, I want to receive an instant email when someone books, cancels, or reschedules, so that I am always up to date without checking the dashboard. *(MVP)*
- As a host, I want my invitees to automatically receive 24-hour and 1-hour reminder emails, so that no-shows are reduced without any manual effort from me. *(MVP)*
- As a host, I want to customize the from-name and reply-to on all emails, so that invitees see my name rather than "Schedica". *(MVP)*
- As a host, I want to add a custom message to confirmation and reminder emails, so that I can include meeting instructions or next steps. *(MVP)*
- As a host, I want post-meeting follow-up emails to be sent automatically after a meeting ends, so that I do not have to remember to follow up with every invitee. *(Phase 2)*

**Invitee**
- As an invitee, I want to receive a confirmation email immediately after booking, so that I have proof the meeting is scheduled and know how to join. *(MVP)*
- As an invitee, I want to receive a reminder email 24 hours before my meeting, so that I do not forget about it. *(MVP)*
- As an invitee, I want to receive a reminder email 1 hour before my meeting, so that I have time to prepare and find the join link. *(MVP)*
- As an invitee, I want cancellation and reschedule links in every email, so that I can update my booking at any time without contacting the host. *(MVP)*

---

## Transactional Notifications

These fire automatically at specific lifecycle events — no configuration required.

### Booking Confirmation (to Invitee)

Sent immediately when a meeting is booked.

**Default Contents:**
- "Your meeting is confirmed" subject line
- **Your time: [date] at [time] [invitee timezone]** — e.g., "Thursday, June 5 at 3:00 PM IST"
- **Host's time: [time] [host timezone]** — e.g., "That's 10:00 AM EST for Jane Smith"
- Duration
- Location: video link (Zoom/Meet/Teams) or physical address or phone number
- Calendar download buttons: Google Calendar | iCal | Outlook
- Invitee's own form answers (for their records)
- Reschedule link
- Cancellation link
- Custom confirmation message from host (if set)

> Calendly only shows the invitee's timezone in this email. Schedica also shows the host's equivalent time so the invitee is never uncertain about what time the host is expecting them.

**Customization:**
- Subject line with dynamic variables
- From name (e.g., "Jane from Acme Corp")
- Reply-to address
- Logo and brand colors
- Custom message in body

---

### Booking Notification (to Host)

Sent immediately when a new booking is created.

**Default Contents:**
- "New booking: [event type] — [invitee name]" subject line
- Invitee name, email, phone (if provided)
- **Your time: [date] at [time] [host timezone]** — e.g., "Thursday, June 5 at 10:00 AM EST"
- **Invitee's time: [time] [invitee timezone]** — e.g., "That's 3:00 PM IST for Jane Smith"
- Duration and event type name
- Answers to all custom intake questions
- One-click cancel link
- Link to meeting detail in dashboard

**Use Case:** Host receives instant notification via email. Slack integration is Phase 2.

---

### Cancellation Confirmation (to Invitee)

Sent when an invitee cancels.

**Contents:**
- "Your meeting has been cancelled" subject line
- **Cancelled meeting time in invitee's timezone** — e.g., "Thursday, June 5 at 3:00 PM IST"
- **Host's equivalent time** — e.g., "That was 10:00 AM EST for Jane Smith"
- Cancellation reason (if provided)
- Direct link to rebook (same event type)
- Optional custom message from host (e.g., "Sorry we missed you — feel free to rebook anytime")

---

### Cancellation Notification (to Host)

Sent when an invitee cancels.

**Contents:**
- "Meeting cancelled: [invitee name] — [event type name]" subject line
- Invitee name and email
- **Cancelled meeting time in host's timezone** — e.g., "Thursday, June 5 at 10:00 AM EST"
- **Invitee's local time** — e.g., "That was 3:00 PM IST for Jane Smith"
- Cancellation reason (if provided)
- Link to view in Meetings Dashboard

---

### Reschedule Confirmation

Sent to both host and invitee when a meeting is rescheduled.

**Contents (to invitee):**
- "Your meeting has been rescheduled" subject line
- **New time in invitee's timezone** — e.g., "New time: Friday, June 6 at 4:00 PM IST"
- **Host's new time** — e.g., "That's 10:30 AM EST for Jane Smith"
- Original time shown for reference (crossed out or labelled "was:")
- Updated calendar link (replaces old event)
- Updated video link if location changed

**Contents (to host):**
- **New time in host's timezone** — e.g., "New time: Friday, June 6 at 10:30 AM EST"
- **Invitee's new time** — e.g., "That's 4:00 PM IST for Jane Smith"
- Original time shown for reference
- Link to updated meeting in dashboard

---

### Host Cancellation Notification (to Invitee)

Sent when a host cancels a meeting.

**Contents:**
- "[Host name] has cancelled your meeting" subject line
- **Cancelled meeting time in invitee's timezone** — e.g., "Thursday, June 5 at 3:00 PM IST"
- **Host's equivalent time shown for reference** — e.g., "That was 10:00 AM EST"
- Optional reason from host
- Direct link to rebook with the same host (same event type booking page)

---

## Workflow Automations

Workflows are timed multi-step sequences that fire before or after meetings. **MVP:** email only. **Phase 2:** SMS added. They are the "set and forget" layer of communication.

### What Is a Workflow?

A workflow is composed of:
- **Trigger** — When should this run? (e.g., 24 hours before meeting)
- **Condition** — Which event types does this apply to? (optional filter)
- **Action** — What should happen? (send email *(MVP)*; send SMS *(Phase 2)*)

### Workflow Triggers

| Trigger | Description |
|---------|-------------|
| Before event starts | X minutes/hours/days before the meeting begins |
| After event ends | X minutes/hours/days after the meeting ends |
| On booking | When a new meeting is booked |
| On cancellation | When an invitee cancels |
| On reschedule | When an invitee reschedules |
| No-show detected | When meeting time passes without any activity |

---

## Reconfirmation Workflow *(Post-MVP — Phase 2)*

For meetings booked far in advance, a reconfirmation email verifies the invitee still plans to attend — reducing no-shows caused by forgotten bookings.

### How Reconfirmation Works
1. Reconfirmation email sent X days before the meeting (configurable — typically 48 hours before)
2. Email includes a prominent "Confirm Attendance" button
3. Invitee clicks the button → one-click confirmation on a simple web page
4. Host sees "Confirmed" status on that booking in the dashboard
5. If invitee does NOT confirm: host is notified; option to follow up or cancel proactively

### Reconfirmation Email Contents
- "Just checking in — your meeting is coming up"
- Meeting summary (date, time, location, host name)
- Large **"Confirm Attendance"** button
- Alternative: "Reschedule" and "Cancel" links if plans have changed

### Reconfirmation Configuration
- Enable/disable per event type
- Set timing: 72 hours before / 48 hours before / 24 hours before / custom
- Set what happens if invitee doesn't confirm: no action / notify host / auto-cancel

### When to Use Reconfirmation
- Meetings booked more than 1 week in advance
- High-value meetings (demos, consultations) where no-shows are costly
- Any meeting where pre-meeting preparation is required

---

## No-Show Tracking

### Marking No-Shows *(MVP)*
- When meeting time passes, host can manually mark the booking as "No-Show" in the Meetings Dashboard
- No-show status stored on the booking record
- Visible in the Meetings Dashboard past meetings list

### Automated No-Show Follow-Up Workflow *(Post-MVP — Phase 2)*
After the host marks a meeting as no-show (or automatically after X hours if no activity):
1. Automated email sent to invitee: "Looks like we missed each other"
2. Email includes a direct link to rebook
3. Warm, non-blaming tone (configurable message)
4. Host receives notification that follow-up was sent

### No-Show Follow-Up Email Contents *(Post-MVP)*
- "Hi [Name], sorry we missed our call today"
- Brief note that the slot is available to rebook
- Direct booking link for the same event type
- Host contact info for alternative scheduling

### No-Show Analytics *(Post-MVP — Phase 2)*
- No-show rate tracked per event type
- % of no-shows that rebooked after follow-up
- Visible in the Analytics Dashboard

### Workflow Actions

| Action | MVP / Post-MVP | Description |
|--------|---------------|-------------|
| Send email to invitee | ✅ MVP | Customizable email sent to the person who booked |
| Send email to host | ✅ MVP | Notification to the meeting host |
| Send email to other | ✅ MVP | Email sent to a CC'd third party (e.g., team member, manager) |
| Send SMS to invitee | Post-MVP Phase 2 | Text message to the invitee's phone number |
| Send SMS to host | Post-MVP Phase 2 | Text message to the host |
| Send webhook | Post-MVP Phase 2 | HTTP POST to external URL with booking data |

---

## Pre-Meeting Reminders

The most impactful use of workflows — reducing no-shows by reminding invitees before the meeting.

### Recommended Reminder Sequence
1. **24 hours before** — Email reminder with meeting details and prep materials *(MVP)*
2. **1 hour before** — Email reminder with direct video link *(MVP)*
3. **15 minutes before** — SMS reminder with video link (highest open rate) *(Post-MVP — Phase 2)*

### Reminder Email Content *(MVP)*
- **Your time: [date] at [time] [invitee timezone]** — e.g., "Tomorrow at 3:00 PM IST"
- **Host's time: [time] [host timezone]** — e.g., "That's 10:00 AM EST for Jane Smith" — repeated in every reminder so invitees never need to do timezone math
- Duration and event type name
- Video conference link (prominent, large "Join Meeting" button)
- Location details (address or call-in number if not video)
- Host name and profile photo
- Custom message from host (agenda, preparation instructions)
- Reschedule / cancel links

> **Calendly comparison:** Calendly reminder emails show only the invitee's timezone. Schedica shows both timezones in every reminder — the same differentiator as the confirmation email.

### SMS Reminders *(Post-MVP — Phase 2)*
- Short, direct: "Reminder: Your call with Jane starts in 1 hour. Join here: [link]"
- Also includes both times: "3 PM for you / 10 AM for Jane"
- Requires invitee phone number (asked in booking form)
- International numbers supported

---

## Post-Meeting Follow-Ups

Automated messages sent after the meeting to nurture the relationship.

### Thank You / Follow-Up Email
- Sent 30 minutes after meeting ends (configurable)
- "Thanks for meeting" message
- Links to next steps (book another call, review proposal, etc.)
- Feedback/rating request (1–5 stars or short survey)

### No-Show Follow-Up
- Triggered when the meeting time has passed with no activity
- "Looks like we missed each other" message
- Offer to reschedule directly
- Host can disable if not desired

### Outcome-Based Follow-Up
- Triggered by host marking a meeting outcome (e.g., "Qualified", "Not a fit")
- Sends different email based on outcome

---

## Dual Timezone Display in Every Email

This is a deliberate Schedica differentiator. Every email that mentions a meeting time shows **both the recipient's local time and the other party's local time**.

### Why This Matters

Calendly only shows one timezone per email — the recipient's own timezone. This causes a common failure:

> An invitee in India books a call with a host in New York. The invitee's confirmation says "3:00 PM IST". They assume the host is also on at 3 PM. They show up 10 hours early or miss the meeting entirely.

Schedica eliminates this by always showing both:

### What Each Person Sees

**Invitee (in India) receives:**
```
Your meeting time:   Thursday, June 5 at 3:00 PM IST (Asia/Kolkata)
Host's meeting time: Thursday, June 5 at 10:00 AM EST (America/New_York)
```

**Host (in New York) receives:**
```
Your meeting time:     Thursday, June 5 at 10:00 AM EST (America/New_York)
Invitee's local time:  Thursday, June 5 at 3:00 PM IST (Asia/Kolkata)
```

### Which Emails Show Both Timezones

| Email Type | Both Timezones Shown |
|-----------|---------------------|
| Booking confirmation to invitee | ✅ Yes |
| Booking notification to host | ✅ Yes |
| 24-hour reminder to invitee | ✅ Yes |
| 1-hour reminder to invitee | ✅ Yes |
| Reschedule confirmation (to both) | ✅ Yes |
| Cancellation confirmation | ✅ Yes — shows the cancelled time in both zones |
| Post-meeting follow-up | ✅ Yes — references the time of the meeting that just occurred |
| ICS calendar invite description | ✅ Yes — both times in plain text inside the description field |

### Edge Cases Handled

- **Same timezone:** When host and invitee are in the same timezone, only one time row is shown (no redundant "your time / their time" duplication)
- **Half-hour offset timezones:** IST (UTC+5:30), NPT (UTC+5:45) — displayed correctly, not rounded
- **Date boundary crossover:** If the host's time is "10 PM Monday" and the invitee's time is "8:30 AM Tuesday", the correct date is shown for each party — not the same date for both

---

## Dynamic Variables in Emails *(and SMS — Phase 2)*

All templates support dynamic variables that auto-fill with meeting data.

### Available Variables

| Variable | Description |
|----------|-------------|
| `{invitee_name}` | Full name of the person who booked |
| `{invitee_email}` | Invitee's email address |
| `{host_name}` | Name of the meeting host |
| `{event_type}` | Name of the event type |
| `{date}` | Meeting date (formatted for invitee's locale) |
| `{time}` | Meeting start time in **invitee's timezone** |
| `{timezone}` | Invitee's timezone name (e.g., "IST") |
| `{host_time}` | Meeting start time in **host's timezone** — for showing the other party's local time |
| `{host_timezone}` | Host's timezone name (e.g., "EST") |
| `{invitee_time}` | Meeting start time in **invitee's timezone** — for use in host-facing emails |
| `{invitee_timezone}` | Invitee's timezone name — for use in host-facing emails |
| `{duration}` | Meeting length (e.g., "30 minutes") |
| `{location}` | Video link or address |
| `{reschedule_link}` | Direct link to reschedule |
| `{cancel_link}` | Direct link to cancel |
| `{booking_id}` | Unique booking identifier |
| `{answer_1}` through `{answer_10}` | Answers to custom intake questions |

---

## In-App Notifications

Beyond email (and SMS in Phase 2), notifications appear in the Schedica dashboard.

### Dashboard Notification Feed
- New booking notifications
- Cancellation alerts
- Reschedule notifications
- Team booking activity (for admins)

### Browser Push Notifications
- Optional push notifications for new bookings
- Opt-in via browser permission prompt
- Works in Chrome, Firefox, Edge, Safari (iOS 16.4+)

### Mobile Push Notifications
- Instant push notification via Schedica mobile app
- Configurable: all bookings, cancellations only, or nothing

---

## Slack Integration *(Phase 2 — Post-MVP)*

For teams using Slack, booking notifications can be sent to Slack channels. Not included in MVP — requires team workspace feature and OAuth bot setup.

### Planned Slack Notifications (Phase 2)
- New booking → post to configured `#channel`
- Cancellation → post alert to channel
- Round-robin assignment → notify assigned rep
- Custom message format with meeting details

---

## Notification Preferences

Both hosts and invitees can manage notification preferences.

### Host Preferences
- Toggle email for each event type (new booking, cancel, reschedule) *(MVP)*
- Toggle push notifications *(Phase 2)*
- Toggle SMS notifications *(Phase 2)*
- Enable/disable daily digest: summary of tomorrow's meetings

### Invitee Preferences
- Opt out of follow-up sequences via unsubscribe link
- CAN-SPAM and GDPR compliant opt-out
- Preference not stored beyond the booking (no account required)

---

## Reference Implementations

| App | Email Reminders | SMS Reminders | Both Timezones in Email | Reconfirmation |
|-----|----------------|--------------|------------------------|----------------|
| **Calendly** | ✅ Paid plans; 24hr + 1hr pre-built; custom workflows | ✅ Paid plans | ❌ Only invitee's timezone | ❌ No native reconfirmation |
| **Cal.com** | ✅ Free tier; email + SMS; webhook actions | ✅ Free tier | ❌ Only invitee's timezone | ❌ No |
| **Chili Piper** | Instant alerts to Slack/email for new leads; less focus on invitee reminders | ❌ No | ❌ No | ❌ No |
| **HubSpot Meetings** | Basic confirmations only; follow-up via HubSpot workflows | ❌ No | ❌ No | ❌ No |
| **SavvyCal** | ✅ Premium plan; email reminders | Limited | ❌ No | ❌ No |
| **Schedica** | ✅ All users; 24hr + 1hr in MVP; full workflow builder (Phase 2) — open source, no plan gating | ✅ Phase 2 | ✅ **Both timezones in every email** — key differentiator | ✅ Phase 2 |

---

## MVP Scope

**In MVP:**
- Booking confirmation email to invitee — with both timezones (invitee's time + host's time)
- Booking notification email to host — with both timezones (host's time + invitee's time)
- Cancellation confirmation to invitee (with both timezones)
- Cancellation notification to host (with both timezones)
- Reschedule confirmation to both parties (with both timezones)
- Host cancellation notice to invitee
- Pre-meeting reminder: 24-hour email (with both timezones)
- Pre-meeting reminder: 1-hour email (with both timezones)
- Dynamic variables: `{invitee_name}`, `{host_name}`, `{date}`, `{time}`, `{host_time}`, `{invitee_time}`, `{timezone}`, `{host_timezone}`, `{invitee_timezone}`, `{location}`, `{reschedule_link}`, `{cancel_link}`, `{answer_1}` – `{answer_10}`
- Custom confirmation message and subject lines (per event type)
- From name and reply-to customisation

> **Comparison:** Calendly requires a paid plan for reminder workflows. Schedica includes 24hr and 1hr email reminders for all users — no plan required (open source).

**Post-MVP:**
- SMS reminders (Phase 2)
- Post-meeting follow-up workflow emails (Phase 2)
- No-show detection and automated follow-up email (Phase 2)
- Reconfirmation workflow — "Confirm Attendance" button for far-in-advance bookings (Phase 2)
- Slack integration for team booking notifications (Phase 2)
- Browser push notifications (Phase 2)
- Mobile push notifications (Phase 3 — mobile app)
- Outcome-based follow-up workflows (Phase 3)
- Unsubscribe management — GDPR-compliant opt-out (Phase 2)


---

## Tech Stack

- **pg-boss** — the primary engine for all timed notifications. At the moment a booking is confirmed, pg-boss schedules four future jobs with exact fire times: 24-hour reminder, 1-hour reminder, post-meeting follow-up (30 min after end), and no-show check (15 min after start). Each job uses a `singletonKey` tied to the booking ID, so it can be individually cancelled if the booking is cancelled or rescheduled — preventing reminders for meetings that no longer exist. **`singletonKey` format: `{bookingId}_{jobType}`** (e.g. `abc123_reminder_24h`, `abc123_reminder_1h`, `abc123_followup`, `abc123_noshow_check`) — this ensures each job type per booking is unique and individually cancellable.
- **Nodemailer (SMTP)** — delivers all transactional and reminder emails: booking confirmations, cancellation notices, reschedule confirmations, 24-hour reminders, 1-hour reminders, and post-meeting follow-ups. Each email uses the host's name as the sender and routes replies to the host's actual email address.
- **PostgreSQL + Drizzle ORM** — stores notification preferences per user in `notification_preferences` (which reminder types are enabled, daily digest on/off, etc.). pg-boss uses the same PostgreSQL database to store scheduled jobs, so no separate job-queue database is needed.
