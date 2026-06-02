# Booking Confirmation

Booking Confirmation is the final step of the booking flow — the moment an invitee's meeting is locked in. It covers everything that happens immediately after a booking is created: the confirmation screen the invitee sees, the emails sent to both parties, the calendar invites, and the data recorded in the system.

---

## Overview

A confirmation is not just a "thank you" message. It is:
- **Proof** that the booking succeeded
- **Instructions** for how to join the meeting
- **A calendar event** that blocks time for both parties
- **A record** of what was agreed (time, location, invitee's form answers)
- **Links** to cancel or reschedule if plans change

Done well, a confirmation email makes both host and invitee feel confident the meeting is real and they know exactly what to do next.

---

## Confirmation Screen (Invitee Browser)

Immediately after the invitee clicks "Book" and the booking is processed, the booking page transitions to a confirmation screen — no page reload needed.

### Confirmation Screen Content

| Element | Description |
|---------|-------------|
| ✅ Success icon | Large green checkmark animation |
| Headline | "You're scheduled!" |
| Host name and photo | Reassures invitee they booked with the right person |
| Event type name | e.g., "30-Minute Intro Call" |
| Date and time | Full date, time, and timezone (invitee's timezone) |
| Duration | e.g., "30 minutes" |
| Location | Video link button (Join Zoom / Join Meet) or address |
| Invitee email | "A confirmation has been sent to jane@example.com" |

### Add to Calendar Buttons
Three prominent "Add to Calendar" buttons:

| Button | Action |
|--------|--------|
| Google Calendar | Opens Google Calendar with event pre-filled; one click to save |
| Outlook / iCal | Downloads `.ics` file; works with Apple Calendar, Outlook, any calendar app |
| Office 365 | Opens Outlook Web with event pre-filled |

These buttons ensure even invitees without a Schedica account get the meeting into their calendar.

### Manage Booking Links
Below the calendar buttons, two text links:
- "Reschedule this meeting" — opens rescheduling flow
- "Cancel this meeting" — opens cancellation confirmation

### Custom Confirmation Message
If the host has set a custom message for this event type, it appears below the meeting details:
> "Thanks for booking! Please review our intake guide before our call: [link]"
> Supports basic markdown: bold, links, line breaks.

### Schedule Another Meeting (Optional)
- Small link: "Need another time? View all my event types →"
- Routes back to host's profile overview page
- Useful for recurring clients or invitees who need multiple booking types

---

## Confirmation Email — To Invitee

Sent automatically within seconds of a successful booking. This is the invitee's primary record of their booking.

### Email Subject Line
```
[Confirmed] 30-Minute Intro Call with Jane Smith on Thursday, June 5
```
Customizable by host via dynamic variables:
- `{event_type}` — event type name
- `{host_name}` — host's name
- `{date}` — meeting date
- `{time}` — meeting start time

### Email Body Structure

**Section 1 — Header**
- Host's logo or profile photo
- "Your meeting is confirmed" headline
- Brand color applied to header bar

**Section 2 — Meeting Summary**

| Field | Content |
|-------|---------|
| Event | 30-Minute Intro Call |
| Date | Thursday, June 5, 2026 |
| Time | 3:00 PM – 3:30 PM IST (Asia/Kolkata) |
| Host time | 10:00 AM – 10:30 AM EST (for reference) |
| Location | [Join Zoom Meeting](https://zoom.us/j/...) |
| Host | Jane Smith |

**Section 3 — Calendar Buttons**
- Google Calendar | Download ICS | Office 365
- Same buttons as confirmation screen

**Section 4 — Your Answers** (if custom questions were asked)
Lists the invitee's own answers for their records:
```
Company: Acme Corp
Purpose of call: Product demo
Team size: 45
```

**Section 5 — Manage Booking**
- "Reschedule this meeting" link
- "Cancel this meeting" link
- Both use unique secure tokens (no login required to act on them)

**Section 6 — Footer**
- Host's reply-to email address
- "Powered by Schedica" (hidden on paid plans)
- Unsubscribe link (GDPR/CAN-SPAM compliant)

---

## Booking Notification Email — To Host

Sent to the host immediately when a new booking is created.

### Email Subject Line
```
New booking: 30-Min Call — Jane Smith on June 5 at 10:00 AM
```

### Email Body Structure

**Section 1 — New Booking Alert**
- "You have a new meeting!" headline
- Invitee name and email address prominently displayed

**Section 2 — Meeting Details**

| Field | Content |
|-------|---------|
| Event | 30-Minute Intro Call |
| Date | Thursday, June 5, 2026 |
| Time | 10:00 AM – 10:30 AM EST (host's timezone) |
| Location | [Start Zoom Meeting](https://zoom.us/s/...) — "Start" link for host |
| Invitee | Jane Smith (jane@acme.com) |
| Phone | +91 98765 43210 (if collected) |

**Section 3 — Invitee's Answers**
All custom question answers displayed with question labels:
```
Company: Acme Corp
Purpose of call: Product demo
Team size: 45
How they heard about us: LinkedIn
```

**Section 4 — Quick Actions**
- "View in dashboard" link → opens meeting detail in Schedica dashboard
- "Cancel this meeting" link (one-click from email)

---

## Calendar Invite

A calendar event is created on the host's calendar and an ICS file is sent to the invitee. Both represent the same meeting.

### Host Calendar Event (Google / Outlook)

| Field | Content |
|-------|---------|
| Title | "30-Min Call with Jane Smith" |
| Date/Time | Booking time in host's timezone |
| Duration | Meeting length |
| Location | Video URL (Zoom/Meet/Teams link) |
| Attendees | Host + invitee (invitee receives invite from calendar) |
| Description | Booking ID, invitee details, video link, form answers |
| Conference | Zoom/Meet/Teams meeting card (platform-native) |

When Schedica adds this event to Google Calendar, Google automatically sends the invitee a calendar invitation from the host's calendar — they receive a second email from Google/Outlook, separate from the Schedica confirmation email. The invitee can accept or decline this calendar invitation.

### Invitee ICS File (Attachment in Confirmation Email)
- RFC 5545-compliant `.ics` file
- Works with: Apple Calendar, Outlook (all versions), Thunderbird, any CalDAV client
- Contains VTIMEZONE component for DST-safe display
- One click: "Open with Calendar" adds the event

**ICS Contents:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Schedica//EN
BEGIN:VEVENT
SUMMARY:30-Min Call with Jane Smith
DTSTART;TZID=America/New_York:20260605T100000
DTEND;TZID=America/New_York:20260605T103000
LOCATION:https://zoom.us/j/1234567890
DESCRIPTION:Join link: https://zoom.us/j/1234567890\nBooking: abc-123
ORGANIZER;CN=Jane Smith:mailto:jane@company.com
ATTENDEE;CN=John Doe:mailto:john@acme.com
END:VEVENT
END:VCALENDAR
```

---

## Confirmation for Different Booking Types

### Group Event Confirmation
- Each invitee receives individual confirmation (same template as 1:1)
- All invitees share the same video conference link
- Invitee's confirmation shows: "X other people have also booked this session"
- Host notification shows all confirmed invitees as a list

### Round-Robin Confirmation
- Assigned host name shown in invitee's confirmation (if host reveal is enabled)
- If host reveal is disabled: event type name shown without host name
- Assigned host receives the host notification email

### Collective (Multi-Host) Confirmation
- All required hosts receive the host notification email
- Invitee's confirmation shows all host names: "You'll be meeting with Jane Smith and Mike Lee"
- All hosts added as attendees on the calendar event

### Paid Event Confirmation
- Payment receipt included in the confirmation email
- "Payment of $150.00 received" shown in confirmation screen and email
- Stripe/PayPal receipt also sent separately by the payment processor

---

## Confirmation Page for Redirect (Advanced)

Instead of Schedica's default confirmation screen, hosts can redirect invitees to a custom URL after booking.

**Use Cases:**
- Redirect to an onboarding page: "Now that you've booked, here's what to expect"
- Redirect to a payment page (before payment integration is live)
- Trigger a Pixel event on a custom page for ad tracking
- Redirect to a community or product portal

**Configuration:** Event type settings → Confirmation → "Redirect to URL after booking" → enter URL.

**Behavior:** As soon as booking is confirmed, browser is redirected. Confirmation email is still sent; only the screen is replaced.

---

## Confirmation Email Delivery

### Delivery Target
- Invitee confirmation: delivered within 30 seconds of booking
- Host notification: delivered within 30 seconds of booking

### Delivery Provider
- Transactional email via Resend or SendGrid
- Dedicated sending domain for deliverability (e.g., `notifications.schedica.com`)
- SPF, DKIM, and DMARC configured to prevent spam classification

### Delivery Tracking
- Open tracking (optional — privacy-aware; can be disabled)
- Bounce detection: if invitee email bounces, host notified
- Delivery failures logged; host sees alert in dashboard

### Retry on Failure
- Failed delivery retried 2 times with 5-minute spacing
- If all retries fail: logged in booking record; host notified via dashboard alert

---

## Customizing the Confirmation

### Custom Confirmation Message
- Set per event type
- Shown on confirmation screen and included in confirmation email
- Supports markdown: `**bold**`, `[link text](url)`, line breaks
- Use cases:
  - "Please fill out this prep form: [link]"
  - "Here's our meeting agenda template: [link]"
  - "Bring your last 3 months of data if you have it"

### Custom Email Subject Line
- Replace default subject with custom text
- Dynamic variables supported: `{invitee_name}`, `{date}`, `{time}`, `{event_type}`
- Example: "Your {event_type} with us is confirmed for {date}!"

### From Name and Reply-To
- Emails appear "from" the host's name, not "Schedica"
- Example: From: `Jane Smith <notifications@schedica.com>`
- Reply-to set to host's actual email so replies go directly to host

---

## Reference Implementations

| App | Confirmation Approach |
|-----|----------------------|
| **Calendly** | Confirmation screen with calendar buttons; email to both; ICS attachment; reschedule/cancel links |
| **Cal.com** | Same as Calendly; supports redirect to custom URL; open source so fully customizable |
| **SavvyCal** | Clean confirmation screen; email confirmation; ICS attachment |
| **Chili Piper** | Instant confirmation (sub-60 second response); CRM update on confirm; Salesforce activity logged |
| **HubSpot Meetings** | Confirmation email + calendar; HubSpot contact auto-created; deal timeline updated |

---

## MVP Scope

**In MVP:**
- Confirmation screen with success animation, meeting summary, add-to-calendar buttons
- Invitee confirmation email (within 30 seconds)
- Host notification email (within 30 seconds)
- ICS file attachment for invitees
- Google Calendar event creation (host's calendar)
- Outlook calendar event creation (host's calendar)
- Reschedule and cancel links in confirmation email
- Custom confirmation message (per event type)
- Custom email subject line
- From name and reply-to customization
- Invitee's form answers in both emails

**Post-MVP:**
- Confirmation page redirect to custom URL
- Pixel tracking on custom confirmation page
- Open/bounce tracking
- Group event invitee count display
- Paid event payment receipt in confirmation
