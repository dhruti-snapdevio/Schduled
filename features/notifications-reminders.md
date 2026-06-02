# Notifications & Reminders

Notifications and reminders keep hosts and invitees informed before, during, and after every meeting. Automated workflows reduce no-shows, improve engagement, and eliminate the need to manually follow up after each booking.

---

## Overview

Schedica sends notifications through two channels:
1. **Transactional emails** — Booking confirmations, cancellations, reschedules (triggered instantly)
2. **Workflow automations** — Timed sequences of emails and SMS sent before or after meetings

Both types are customizable to match the host's brand and communication style.

---

## Transactional Notifications

These fire automatically at specific lifecycle events — no configuration required.

### Booking Confirmation (to Invitee)

Sent immediately when a meeting is booked.

**Default Contents:**
- "Your meeting is confirmed" subject line
- Meeting summary: date, time, timezone, duration, host name
- Location: video link (Zoom/Meet/Teams) or physical address or phone number
- Calendar download buttons: Google Calendar | iCal | Outlook
- Reschedule link
- Cancellation link
- Custom confirmation message from host (if set)

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
- "New meeting booked" subject line
- Invitee name, email, phone (if provided)
- Meeting date, time, and duration
- Event type name
- Answers to custom intake questions
- One-click cancel link (for hosts)
- Link to meeting in dashboard

**Use Case:** Host receives instant notification via email; can also receive Slack or push notification (if configured).

---

### Cancellation Confirmation (to Invitee)

Sent when an invitee cancels.

**Contents:**
- "Your meeting has been cancelled" subject line
- Meeting that was cancelled (date, time)
- Cancellation reason (if provided)
- Link to rebook
- Optional custom message from host ("Sorry we missed you!")

---

### Cancellation Notification (to Host)

Sent when an invitee cancels.

**Contents:**
- "Meeting cancelled by [invitee name]"
- Which meeting, when it was for
- Cancellation reason (if provided)
- Link to view in dashboard

---

### Reschedule Confirmation

Sent to both host and invitee when a meeting is rescheduled.

**Contents:**
- "Your meeting has been rescheduled"
- New date and time
- Updated calendar link
- Updated video/location link if changed
- Original meeting time shown for reference

---

### Host Cancellation Notification (to Invitee)

Sent when a host cancels a meeting.

**Contents:**
- Notification that host cancelled
- Optional reason from host
- Link to rebook at a new time

---

## Workflow Automations

Workflows are timed multi-step email and SMS sequences that fire before or after meetings. They are the "set and forget" layer of communication.

### What Is a Workflow?

A workflow is composed of:
- **Trigger** — When should this run? (e.g., 24 hours before meeting)
- **Condition** — Which event types does this apply to? (optional filter)
- **Action** — What should happen? (send email or SMS)

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

## Reconfirmation Workflow

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

## No-Show Tracking and Follow-Up

### Marking No-Shows
- When meeting time passes, host can manually mark the booking as "No-Show" in the Meetings Dashboard
- For group events: mark individual attendees as no-shows without cancelling the event for others
- No-show status visible in analytics and CSV exports

### Automated No-Show Follow-Up Workflow
After the host marks a meeting as no-show (or automatically after X hours if no activity):
1. Automated email sent to invitee: "Looks like we missed each other"
2. Email includes a direct link to rebook
3. Warm, non-blaming tone (configurable message)
4. Host receives notification that follow-up was sent

### No-Show Follow-Up Email Contents
- "Hi [Name], sorry we missed our call today"
- Brief note that the slot is available to rebook
- Direct booking link for the same event type
- Host contact info for alternative scheduling

### No-Show Analytics
- No-show rate tracked per event type
- No-show rate per team member (admin view)
- % of no-shows that rebooked after follow-up
- Shows in analytics dashboard to identify patterns

### Workflow Actions

| Action | Description |
|--------|-------------|
| Send email to invitee | Customizable email sent to the person who booked |
| Send email to host | Notification to the meeting host |
| Send email to other | Email sent to a CC'd third party |
| Send SMS to invitee | Text message to the invitee's phone number |
| Send SMS to host | Text message to the host |
| Send webhook | HTTP POST to external URL with meeting data |

---

## Pre-Meeting Reminders

The most impactful use of workflows — reducing no-shows by reminding invitees before the meeting.

### Recommended Reminder Sequence
1. **24 hours before** — Email reminder with meeting details and prep materials
2. **1 hour before** — Email reminder with direct video link
3. **15 minutes before** — SMS reminder with video link (highest open rate)

### Reminder Email Content
- Meeting details (date, time, duration)
- Video conference link (prominent, large button)
- Location details
- Host name and profile photo
- Custom message from host (agenda, preparation instructions)
- Reschedule / cancel links

### SMS Reminders
- Short, direct: "Reminder: Your call with Jane starts in 1 hour. Join here: [link]"
- Requires invitee phone number (asked in booking form)
- Uses Twilio or similar provider for delivery
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
- Advanced: Integrates with CRM deal stage updates

---

## Dynamic Variables in Emails and SMS

All templates support dynamic variables that auto-fill with meeting data.

### Available Variables

| Variable | Description |
|----------|-------------|
| `{invitee_name}` | Full name of the person who booked |
| `{invitee_email}` | Invitee's email address |
| `{host_name}` | Name of the meeting host |
| `{event_type}` | Name of the event type |
| `{date}` | Meeting date (formatted for invitee's locale) |
| `{time}` | Meeting start time (in invitee's timezone) |
| `{timezone}` | Invitee's timezone |
| `{duration}` | Meeting length (e.g., "30 minutes") |
| `{location}` | Video link or address |
| `{reschedule_link}` | Direct link to reschedule |
| `{cancel_link}` | Direct link to cancel |
| `{booking_id}` | Unique booking identifier |
| `{answer_1}` through `{answer_10}` | Answers to custom intake questions |

---

## In-App Notifications

Beyond email and SMS, notifications appear in the Schedica dashboard.

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

## Slack Integration

For teams using Slack, booking notifications can be sent to Slack channels.

### Slack Notifications
- New booking → post to `#sales-bookings` channel
- Cancellation → post alert to channel
- Round-robin assignment → notify assigned rep
- Custom message format with meeting details

---

## Notification Preferences

Both hosts and invitees can manage notification preferences.

### Host Preferences
- Toggle email/push/SMS for each event type (new booking, cancel, reschedule)
- Set SMS notification for urgent bookings only
- Enable/disable daily digest: summary of tomorrow's meetings

### Invitee Preferences
- Opt out of follow-up sequences via unsubscribe link
- CAN-SPAM and GDPR compliant opt-out
- Preference not stored beyond the booking (no account required)

---

## Reference Implementations

| App | Notification Approach |
|-----|-----------------------|
| **Calendly** | Workflows (email + SMS) on all paid plans; pre-built triggers; good variable support |
| **Cal.com** | Workflows on free tier; email + SMS; webhook actions; similar to Calendly |
| **Chili Piper** | Instant alerts to Slack/email for new leads; less focus on invitee reminders |
| **HubSpot Meetings** | Basic confirmations; follow-up via HubSpot email workflows (not native to meetings tool) |
| **SavvyCal** | Workflows on Premium plan; email reminders; limited SMS |

---

## MVP Scope

**In MVP:**
- Transactional emails: booking confirmation, cancellation, reschedule (to both parties)
- Booking notification to host (email)
- Pre-meeting reminder workflow (24hr and 1hr email)
- Dynamic variable support in all templates
- Custom confirmation message and subject lines
- From name and reply-to customization

**Post-MVP:**
- SMS reminders via Twilio
- Post-meeting follow-up workflows
- No-show detection and follow-up
- Slack integration for team notifications
- Browser and mobile push notifications
- Outcome-based follow-up workflows
- Unsubscribe management (GDPR-compliant)
