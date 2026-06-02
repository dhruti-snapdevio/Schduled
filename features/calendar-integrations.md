# Calendar Integrations

Calendar integrations are the foundation of Schedica's scheduling intelligence. By connecting to external calendars, Schedica reads real-time busy/free data and writes new bookings back — ensuring availability is always accurate and meetings are never double-booked.

---

## Overview

A connected calendar serves two purposes:
1. **Read availability** — Schedica reads the calendar's events to know when the host is busy
2. **Write new bookings** — When a meeting is booked, Schedica adds it to the host's calendar automatically

Hosts can connect multiple calendars. All are read for availability, but new bookings are written to one designated calendar.

---

## Supported Calendars

### Google Calendar

The most widely used calendar integration.

**Features:**
- Full OAuth 2.0 authentication (no password sharing)
- Read all calendars in the Google account (primary + secondary)
- Sync events in real-time
- Write new bookings to the designated calendar
- Supports multiple Google accounts (connect work + personal)
- Reads recurring events
- DST-aware timezone handling

**Setup Flow:**
1. Click "Connect Google Calendar"
2. Redirected to Google OAuth consent screen
3. Authorize Schedica to read and write calendar events
4. Select which calendars to check for conflicts
5. Select which calendar to add bookings to

**Scopes Required:**
- `calendar.readonly` — read all calendars for availability
- `calendar.events` — create/update/delete booking events

---

### Microsoft Outlook / Office 365

For Microsoft 365 accounts (work or school) and personal Outlook.com accounts.

**Features:**
- OAuth 2.0 via Microsoft Graph API
- Connects to primary Outlook calendar and room calendars
- Supports Microsoft Exchange (via Microsoft 365)
- Real-time sync via Graph API subscriptions
- Write new events with Teams meeting links
- Supports shared calendars (view-only)
- Respects "Working Hours" set in Outlook

**Setup Flow:**
1. Click "Connect Outlook / Office 365"
2. Microsoft login and consent screen
3. Authorize Schedica access
4. Select calendars to sync

**Compatibility:**
- Office 365 personal and business accounts
- Outlook.com (free Microsoft accounts)
- Microsoft Exchange 2016+ (via Exchange Web Services bridge)

---

### Apple Calendar / iCloud

> Note: Calendly dropped iCloud support in August 2024. Schedica supports it natively — a meaningful differentiator.

**Features:**
- iCloud CalDAV integration
- Supports all iOS/macOS users with iCloud accounts
- Read busy/free from iCloud calendar
- Write new bookings to iCloud calendar (syncs to iPhone/Mac automatically)
- Requires app-specific password (Apple security requirement)

**Setup Flow:**
1. Click "Connect Apple Calendar"
2. Enter iCloud email
3. Generate app-specific password at appleid.apple.com
4. Enter app-specific password in Schedica
5. Schedica connects via CalDAV

**Why Apple Calendar Matters:**
- ~26% of mobile users in the US use iOS
- Many freelancers and creatives primarily use Apple Calendar
- Calendly's removal created a clear gap; Schedica fills it

---

### CalDAV (Generic)

Open standard for calendar sync. Connects to any CalDAV-compatible calendar server.

**Compatible Systems:**
- Fastmail Calendar
- Zoho Calendar
- SOGo
- Nextcloud Calendar
- Fruux
- DAViCal
- Any RFC 4791-compliant calendar server

**Setup:**
- Provide CalDAV server URL, username, and password (or token)
- Schedica polls for updates at regular intervals (no real-time webhook)

---

### Exchange (On-Premise)

For organizations running self-hosted Microsoft Exchange servers (not Office 365).

**Features:**
- EWS (Exchange Web Services) integration
- Reads and writes to Exchange calendar
- Requires Exchange 2013 or later
- May require IT admin configuration for app access

**Target Users:** Large enterprises with on-premise infrastructure who cannot use cloud Microsoft 365.

---

## Multi-Calendar Support

Hosts can connect multiple calendars simultaneously across different providers.

### Use Cases
- Personal Google Calendar + Work Outlook Calendar
- Two Google accounts (personal + client-facing)
- Google Calendar + iCloud Calendar

### How It Works
- All connected calendars are read for conflicts
- A busy event on ANY connected calendar blocks the slot
- Bookings are written to only ONE designated "add bookings to" calendar
- Host selects the primary booking calendar during setup

### Calendar Priority
- When multiple calendars are connected, all are checked for free/busy
- The "check for conflicts" selection is per calendar (toggle on/off per calendar)
- The "add bookings to" is a single-calendar selection

---

## Calendar Event Details Written on Booking

When a meeting is booked, Schedica creates a calendar event with:

| Field | Content |
|-------|---------|
| Title | Event type name + Invitee name (e.g., "30-Min Intro Call with Jane Smith") |
| Date/Time | Confirmed meeting time |
| Duration | Meeting length |
| Location | Video link (Zoom/Meet/Teams) or physical address |
| Description | Invitee details, custom question answers, booking notes |
| Attendees | Host email + Invitee email (both receive invites) |
| Video Link | Auto-embedded Zoom/Meet/Teams link |
| Organizer | Host's name and email |

---

## Real-Time Sync Architecture

### Read Path (Availability Check)
- Schedica queries calendars when invitee opens booking page
- Cached availability refreshed every 5 minutes (configurable)
- On booking confirmation: final check in real-time to prevent race conditions
- Uses push notifications (Google/Outlook) where available for instant refresh

### Write Path (New Booking)
- On booking confirmation: event created immediately via API
- Retries on failure with exponential backoff
- Booking shown as pending until calendar write confirmed

### Disconnect Handling
- If a calendar disconnects (token expires, revoked), host is notified
- Schedica disables booking pages until reconnected (to prevent double-booking)
- Warning shown in dashboard: "Calendar sync interrupted"

---

## Timezone Handling

- All events stored in UTC internally
- Displayed in host's timezone in dashboard
- Displayed in invitee's timezone on booking page
- Calendar events written with correct timezone metadata
- DST transitions handled automatically

---

## Room and Resource Calendars

For enterprise users scheduling physical meeting rooms:

- Connect room calendars (via Outlook/Exchange or Google Workspace)
- Add room as a required resource on event types
- Booking only shown when both host AND room are available
- Room automatically "reserved" when booking confirmed

---

## Integration Permissions and Security

| Permission | Why Needed |
|-----------|-----------|
| Read calendar events | Check free/busy for availability |
| Create calendar events | Add booking to calendar |
| Update calendar events | Update on reschedule |
| Delete calendar events | Remove on cancellation |
| Read attendee free/busy | Collective event scheduling |

**Security:**
- OAuth tokens stored encrypted at rest
- Tokens never exposed to frontend
- Scopes requested are minimal (principle of least privilege)
- Users can revoke access anytime from both Schedica and their calendar provider

---

## Reference Implementations

| App | Calendar Support |
|-----|-----------------|
| **Calendly** | Google, Outlook/Office 365, Exchange; **dropped Apple/iCloud in 2024** |
| **Cal.com** | Google, Outlook, Apple/iCloud, CalDAV, Zoho, Exchange; most comprehensive |
| **Chili Piper** | Google, Outlook; syncs with Salesforce calendar availability |
| **HubSpot Meetings** | Google, Office 365 only |
| **SavvyCal** | Google, Outlook, Apple (iCloud CalDAV) |

---

## MVP Scope

**In MVP:**
- Google Calendar (OAuth 2.0)
- Outlook / Office 365 (Microsoft Graph API)
- Apple Calendar / iCloud (CalDAV with app-specific password)
- Multi-calendar conflict detection (connect up to 3 calendars)
- Calendar event creation on booking
- Calendar event update on reschedule
- Calendar event deletion on cancellation

**Post-MVP:**
- CalDAV (generic servers)
- Exchange (on-premise EWS)
- Room and resource calendars
- Real-time push notification sync (vs polling)
- Calendar health monitoring dashboard
