# Calendar Integrations

Calendar integrations are the foundation of Schedica's scheduling intelligence. By connecting to external calendars, Schedica reads real-time busy/free data and writes new bookings back — ensuring availability is always accurate and meetings are never double-booked.

---

## Overview

A connected calendar serves two purposes:
1. **Read availability** — Schedica reads the calendar's events to know when the host is busy
2. **Write new bookings** — When a meeting is booked, Schedica adds it to the host's calendar automatically

Hosts can connect multiple calendars. All are read for availability, but new bookings are written to one designated calendar.

---

## User Stories

**Host**
- As a host, I want to connect my Google Calendar with OAuth, so that my availability is always accurate without sharing my password. *(MVP)*
- As a host, I want to connect multiple calendars (work and personal), so that Schedica checks all of them for conflicts before showing available slots. *(MVP)*
- As a host, I want new bookings to be automatically added to my chosen calendar, so that I never have to manually create calendar events after someone books me. *(MVP)*
- As a host, I want to connect my Outlook or Office 365 calendar, so that my work calendar is included in availability checks. *(MVP)*
- As a host, I want to connect my Apple iCloud calendar, so that my personal schedule is factored into my availability. *(MVP)*
- As a host, I want to disconnect a calendar at any time, so that I can switch providers or remove a calendar without losing my Schedica setup. *(MVP)*
- As a host, I want calendar sync to happen in real-time, so that a newly added personal event blocks my availability before the next person tries to book that slot. *(MVP)*

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

**Setup Flow (with guided UX for non-technical users):**
1. User clicks "Connect Apple Calendar"
2. Schedica shows an **inline step-by-step guide** (not just a link) with screenshots:
   - Step A: "Go to [appleid.apple.com/account/manage](https://appleid.apple.com) and sign in"
   - Step B: "Scroll to the **Sign-In and Security** section → click **App-Specific Passwords**"
   - Step C: "Click **+** (Generate Password) → name it 'Schedica' → click Create"
   - Step D: "Copy the 16-character password shown (it won't be shown again)"
3. User enters their iCloud email address
4. User pastes the app-specific password into the Schedica input field
5. Schedica connects via CalDAV and lists available iCloud calendars
6. User selects which calendars to check for conflicts and which to write bookings to

**Error Handling:**
- Wrong password: "Incorrect app-specific password. Please generate a new one and try again." — with link back to step-by-step guide
- 2FA block: "Your iCloud account requires additional verification. Complete it at appleid.apple.com, then try again."
- No iCloud calendars found: "No calendars found. Ensure iCloud Calendar is enabled on your Apple device."

**Why App-Specific Passwords Exist (shown to user):**
> "Apple does not allow third-party apps to use your main Apple ID password. An app-specific password is a one-time generated code that gives Schedica permission to read your calendar — without sharing your real password. You can revoke it at any time from appleid.apple.com."

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

| App | Google Calendar | Outlook / Office 365 | Apple / iCloud | CalDAV (generic) | Multi-Calendar (connect 2+) | Real-Time Sync |
|-----|----------------|---------------------|----------------|-----------------|----------------------------|----------------|
| **Calendly** | ✅ Yes | ✅ Yes | ❌ **Dropped Aug 2024** | ❌ No | ✅ Up to 6 calendars | ✅ Push notifications |
| **Cal.com** | ✅ Yes | ✅ Yes | ✅ iCloud CalDAV | ✅ Zoho, Nextcloud, etc. | ✅ Yes | ✅ Yes |
| **SavvyCal** | ✅ Yes | ✅ Yes | ✅ iCloud CalDAV | ❌ No | ✅ Yes | ✅ Yes |
| **Chili Piper** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **HubSpot Meetings** | ✅ Yes | ✅ Office 365 | ❌ No | ❌ No | ❌ One calendar only | ✅ Yes |
| **Schedica** | ✅ Yes — OAuth 2.0; also generates Google Meet links | ✅ Yes — Microsoft Graph; also creates Teams meetings | ✅ **Yes — iCloud CalDAV (MVP)** — direct differentiator vs Calendly | ✅ Phase 2 | ✅ Up to 3 calendars in MVP | ✅ 5-min polling in MVP; push notifications Phase 2 |

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


---

## Tech Stack

- **Google Calendar API (OAuth 2.0)** — reads free/busy events from all calendars on the host's Google account and writes new bookings as calendar events. Google Meet links are generated automatically as part of this event creation — no separate Zoom-style API call needed.
- **Microsoft Graph API (OAuth 2.0)** — connects Outlook and Office 365 calendars for free/busy sync and booking writes. The same OAuth token is also used to create Teams meeting links.
- **Apple CalDAV (iCloud)** — connects iCloud calendars using the CalDAV protocol. The host provides their iCloud email and an app-specific password (generated at appleid.apple.com). No OAuth flow required.
- **PostgreSQL + Drizzle ORM** — stores OAuth access and refresh tokens in `connected_calendars` (encrypted at rest using AES-256-GCM) and caches free/busy events in `calendar_events_cache` to avoid querying provider APIs on every slot request.
- **pg-boss** — runs a recurring sync job every 5 minutes per connected calendar to refresh the free/busy cache. Uses `singletonKey` so only one sync job per calendar runs at a time, preventing duplicate API calls.
