# Video Conferencing

Video Conferencing integration automatically generates a unique meeting link for every booking — no more manually creating Zoom meetings, copying links, or forgetting to add a video URL to calendar invites. The link is created the moment a booking is confirmed and included in every notification.

---

## Overview

When an invitee books a meeting, Schedica immediately calls the video platform's API to create a new meeting room. A unique join link is generated per booking and sent to both host and invitee in the confirmation email, the calendar invite, and all reminder emails.

This eliminates two major pain points:
1. Hosts forgetting to create a video meeting and scrambling before the call
2. Invitees using a shared "permanent" link that exposes previous meeting recordings or chat history

---

## Supported Platforms

### Zoom

The most widely used business video conferencing platform.

**Features:**
- Unique Zoom meeting created per booking via Zoom API
- Host receives "Start Meeting" link; invitee receives "Join Meeting" link
- Meeting ID and passcode auto-generated
- Waiting room settings respected (if enabled in host's Zoom account)
- Meeting title set to event type name + invitee name
- Meeting duration set to match the booking duration
- Auto-recording enabled if configured in host's Zoom settings

**Connection:**
- OAuth 2.0 — host connects their Zoom account once
- Requires a Zoom account (Free Zoom account is sufficient)
- One Zoom account per Schedica user

**Link Format:**
```
https://zoom.us/j/1234567890?pwd=AbCdEfGh
```

**Setup:**
1. Go to Profile & Settings → Integrations → Zoom
2. Click "Connect Zoom Account"
3. Authorize Schedica in Zoom OAuth window
4. Connection confirmed — Zoom available as location on all event types

---

### Google Meet

Auto-generates a Google Meet link as part of calendar event creation. No separate API call needed — the link is created when the Google Calendar event is written.

**Features:**
- Unique Meet link per booking
- No capacity limits (Google Meet supports up to 100 participants on free Google accounts)
- No additional connection step required — uses the existing Google Calendar connection
- Link generated only when Google Calendar is the connected calendar

**Requirement:**
- Host must have Google Calendar connected (see calendar-integrations.md)
- Works with both personal Google accounts and Google Workspace accounts

**Link Format:**
```
https://meet.google.com/abc-defg-hij
```

**How It Works:**
- When Schedica creates the Google Calendar event for the booking, it includes `conferenceData.createRequest` in the API call
- Google Calendar API auto-generates and attaches a unique Meet link
- Link returned in the API response and stored in the booking record

---

### Microsoft Teams

Auto-generates a Teams meeting link via the Microsoft Graph API.

**Features:**
- Unique Teams meeting created per booking
- Works with Microsoft 365 paid accounts and Teams Free
- Teams meeting appears in the host's Teams calendar
- In-meeting chat, recording, and transcription available (per Teams settings)
- Requires Microsoft Outlook / Office 365 calendar connection

**Requirement:**
- Host must have Outlook / Office 365 connected (see calendar-integrations.md)
- Microsoft 365 Business Basic or higher recommended for full features

**Link Format:**
```
https://teams.microsoft.com/l/meetup-join/...
```

**How It Works:**
- Schedica calls `POST /v1.0/users/{userId}/onlineMeetings` on the Microsoft Graph API
- Returns a `joinWebUrl` stored as the meeting location

---

### Webex *(Post-MVP — Phase 2)*

Integration with Cisco Webex for enterprises and teams using Webex as their video platform.

**Features:**
- Unique Webex meeting per booking via Webex REST API
- Requires Webex account (Free or paid)
- Meeting password auto-generated
- Host and co-host access controls respected

**Connection:**
- OAuth 2.0 via Webex developer app
- Connect once in Profile & Settings → Integrations → Webex

---

### GoTo Meeting *(Post-MVP — Phase 2)*

Integration with GoTo Meeting (formerly GoToMeeting by LogMeIn).

**Features:**
- Unique meeting room per booking via GoTo Meeting API
- Dial-in phone numbers included in meeting details
- Recording settings from GoTo account respected

**Connection:**
- OAuth via GoTo Meeting developer portal
- Connect once in Profile & Settings → Integrations → GoTo Meeting

---

### Custom Video Link (Any Platform)

For platforms not natively supported, hosts can use a permanent or custom link.

**Use Cases:**
- Whereby (permanent room links)
- Jitsi Meet (self-hosted)
- Around
- Any other platform with a shareable URL

**How It Works:**
- Host pastes a permanent meeting URL in the "Custom" location field on the event type
- Same URL included in every booking for that event type
- No API integration — host manages the video platform separately

**Limitation:** Same link shared for all bookings — no per-booking uniqueness.

---

## Invitee Choice of Video Platform

For event types with multiple location options enabled, the invitee can choose their preferred video platform at booking time.

**Example:**
Host has connected Zoom and Google Meet. Event type is set to "Invitee's Choice."

Invitee sees:
> "How would you like to meet?"
> ○ Zoom
> ○ Google Meet

Schedica creates a meeting on the selected platform and sends the appropriate link.

**Configuration:** Enable in event type settings → Location → "Let invitee choose" → select which platforms to offer.

---

## How the Link Reaches the Invitee

The video link is delivered in multiple places to ensure the invitee never loses it:

| Delivery Point | Details |
|---------------|---------|
| Confirmation email (immediate) | Prominently displayed as a large "Join Meeting" button |
| Calendar invite | In the Location field and event description |
| 24-hour reminder email | Meeting link repeated; "Join Meeting" button |
| 1-hour reminder email | Meeting link repeated; large prominent button |
| Meetings Dashboard (host) | "Join" button active 15 minutes before start |
| Booking confirmation page | Shown immediately after booking |

---

## Meeting Link in the Host's Calendar Invite

When Schedica writes the booking to the host's calendar:

**Google Calendar:**
- Conference data embedded (shows in Google Calendar UI as a "Join with Google Meet" button)
- Location field contains the video URL
- Description includes the full join link as text

**Outlook:**
- Location field contains the video URL
- Body of the meeting contains the formatted video link
- For Teams: Teams meeting card shown natively in Outlook

---

## Per-Booking Unique Links (Why It Matters)

Calendly and Schedica both create a new unique meeting room per booking. This is important because:

- **Privacy:** Previous attendees cannot re-join a meeting using an old link
- **Security:** No "room squatting" by someone who had a previous link
- **Recording isolation:** Each meeting has its own recording, not mixed with others
- **Cleaner history:** Each Zoom/Teams meeting shows the correct title and participant list

---

## Video Platform Connection Status

In Profile & Settings → Integrations, each connected video platform shows:

| Status | Meaning |
|--------|---------|
| 🟢 Connected | Active and working |
| 🔴 Disconnected | Token expired or revoked — click to reconnect |
| ⚠️ Error | API quota or permission issue — check platform account |

If a platform disconnects and a new booking comes in:
- Booking still created successfully
- Video link generation fails silently
- Host receives: "⚠️ Could not generate Zoom link for this booking. Please add the meeting link manually."
- Invitee confirmation email notes: "Video link will be sent separately"

---

## Video Conferencing and Recording Notice

When AI Notetaker is enabled (Phase 2 feature), a recording notice is automatically appended to the video meeting details in confirmation emails:

> "This meeting may be recorded and transcribed by Schedica Notetaker. You will be notified at the start of the meeting."

Hosts can disable this notice or the recording feature per event type.

---

## Reference Implementations

| App | Supported Platforms | Unique Link per Booking | Invitee Choice | Built-in Video |
|-----|---------------------|------------------------|----------------|----------------|
| **Calendly** | Zoom, Google Meet, Teams, Webex, GoTo Meeting | ✅ Yes — new room per booking | ✅ Yes — invitee picks platform | ❌ No |
| **Cal.com** | Zoom, Meet, Teams, Webex, Jitsi, Around, Daily.co | ✅ Yes | ✅ Yes | ✅ Cal Video (Daily.co powered) |
| **SavvyCal** | Zoom, Google Meet, Teams | ✅ Yes | ❌ No | ❌ No |
| **Chili Piper** | Zoom, Teams, Meet | ✅ Yes | ❌ No | ❌ No |
| **HubSpot Meetings** | Zoom, Teams | ✅ Via calendar event creation | ❌ No | ❌ No |
| **Schedica** | Zoom, Google Meet, Teams (MVP); Webex, GoTo (Phase 2) | ✅ Yes — unique room per booking; no shared permanent links | ✅ Yes — invitee selects if host has 2+ platforms connected | ❌ No — Phase 3 consideration |

---

## MVP Scope

**In MVP:**
- Zoom (unique link per booking via API)
- Google Meet (via Google Calendar API)
- Microsoft Teams (via Microsoft Graph API)
- Custom URL (permanent link for unsupported platforms)
- Invitee's choice (if host has 2+ platforms connected)
- Link in confirmation email, calendar invite, and reminder emails
- "Join" button on Meetings Dashboard (active 15 min before)
- Graceful failure handling (notify host if link generation fails)

**Post-MVP:**
- Webex
- GoTo Meeting
- Jitsi Meet (self-hosted option)
- Auto-reconnect if token expires before booking


---

## Tech Stack

- **Zoom API (OAuth 2.0)** — creates a unique Zoom meeting room per booking via `POST /v2/users/me/meetings`. The host connects their Zoom account once in Settings; Schedica stores the OAuth token (encrypted) and uses it for every future booking.
- **Microsoft Graph API** — creates Microsoft Teams meetings via `POST /v1.0/users/{userId}/onlineMeetings`. Reuses the same OAuth token already stored for the host's Outlook calendar connection — no separate Teams login needed.
- **Google Calendar API** — Google Meet links are generated automatically as part of Google Calendar event creation (no separate Meet API call). Available to any host with a Google Calendar connected.
- **PostgreSQL + Drizzle ORM** — stores Zoom and Webex OAuth tokens (AES-256-GCM encrypted) in `video_connections`. Teams tokens are reused from `connected_calendars`. The generated video link is stored in the `bookings` table under `location_value`.
- **pg-boss** — video link generation runs as an async background job after the booking is confirmed. This means the booking API responds instantly to the invitee while the Zoom/Teams API call happens in the background. If generation fails, pg-boss retries automatically and notifies the host.
