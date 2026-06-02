# Timezone Management

Timezone management ensures every host and invitee sees meeting times in their own local timezone — automatically and accurately. Without this, an invitee in Tokyo booking a host in New York would see confusing or wrong times, leading to missed meetings.

---

## Overview

Timezone is one of the most error-prone aspects of scheduling. Schedica handles timezone conversion at every step — so neither the host nor the invitee ever has to manually calculate "what time is that for me?"

There are two timezone contexts to manage:
1. **Host timezone** — The timezone the host's availability is defined in
2. **Invitee timezone** — The timezone the booking page displays times in (auto-detected from the invitee's browser/device)

---

## Host Timezone

### Setting Host Timezone

During onboarding and in Profile & Settings, the host sets their local timezone.

**Timezone Selection:**
- Searchable dropdown with all IANA timezone identifiers
- Common timezones surfaced first (UTC, US/Eastern, US/Pacific, Europe/London, Asia/Kolkata, etc.)
- Search by city name (e.g., "Mumbai" → "Asia/Kolkata") or offset (e.g., "+5:30")
- Current local time preview updates as user selects: "Your current time: 3:45 PM IST"

**Where Host Timezone Is Used:**
- Availability schedule (Mon–Fri 9am–5pm is in host's timezone)
- Dashboard: all bookings shown in host's timezone
- Booking notification emails sent to host: show time in host's timezone
- Calendar invites for host: time written in host's timezone

### Changing Host Timezone
- Can be updated anytime in Profile & Settings
- On change: all future availability is recalculated
- Past bookings retain their original UTC timestamp (displayed converted to new timezone)
- Warning shown: "Changing your timezone will affect how your availability appears to invitees"

---

## Invitee Timezone

### Auto-Detection

When an invitee opens a booking page, Schedica automatically detects their timezone.

**Detection Method:**
- `Intl.DateTimeFormat().resolvedOptions().timeZone` — JavaScript browser API
- Returns IANA timezone string (e.g., `"Asia/Kolkata"`, `"America/New_York"`)
- Works on all modern browsers without any permission prompt
- Falls back to UTC if detection fails

**What Auto-Detection Changes:**
- All time slots on the booking page are shown in the detected timezone
- "Showing times in Asia/Kolkata (IST)" label appears on booking page
- Calendar invite and confirmation email show time in invitee's timezone

### Manual Timezone Selection

Invitees can manually change the timezone shown on the booking page.

**UI Element:**
- Timezone selector below the time slot grid
- Searchable dropdown (same as host setup)
- Changing timezone immediately recalculates all displayed slots
- Selection is ephemeral (not saved; next visit auto-detects again)

**Use Cases:**
- Invitee is booking on behalf of someone in a different timezone
- Auto-detection returned wrong timezone (e.g., VPN location mismatch)
- Invitee prefers seeing times in a different timezone for planning

---

## Timezone Conversion Logic

### How Conversion Works Internally

All times are stored in UTC internally. Display is always a conversion from UTC to a target timezone.

```
Host sets: Available 9am–5pm Mon–Fri (timezone: America/New_York, UTC-5)
Stored as: Available 14:00–22:00 UTC Mon–Fri

Invitee in Asia/Kolkata (UTC+5:30) opens booking page:
Displayed as: 7:30pm–3:30am IST (next day for late slots)
```

**Why UTC Storage:**
- DST changes are handled correctly (stored time doesn't change; only display changes)
- Cross-timezone teams work without conversion bugs
- Database queries are always in UTC (consistent ordering)

### DST (Daylight Saving Time) Handling

Daylight Saving Time shifts clocks by 1 hour seasonally in many countries.

**Schedica's Approach:**
- All availability windows stored in IANA timezone (not offset like UTC-5)
- IANA timezones know when DST applies (America/New_York knows to shift in March/November)
- Slot display adjusts automatically as DST transitions occur
- Calendar invites include DST-aware timezone info (no manual recalculation needed)

**Example:**
- Host sets "Available 9am New York time"
- In winter (EST, UTC-5): invitee in London sees 2pm
- In summer (EDT, UTC-4): invitee in London sees 2pm still (both shifted by 1 hour)
- Schedica handles this silently — no host action required on DST change

---

## Booking Page Timezone Display

### Timezone Label
Shown clearly on the booking page so invitees know what timezone is being used:

> "Times shown in Asia/Kolkata (IST, UTC+5:30)"
> [Change timezone ↓]

### Time Format
- 12-hour or 24-hour based on locale
  - US locale: 12-hour by default (3:00 PM)
  - UK/EU/IN locale: 24-hour by default (15:00)
  - User can toggle in manual timezone selector

### Date Format
- US: MM/DD/YYYY
- UK/EU/IN: DD/MM/YYYY
- ISO: YYYY-MM-DD
- Inferred from browser locale; manual override in settings

---

## Confirmation Email Timezone

Both host and invitee receive confirmation emails with times in their respective timezones.

### Invitee Confirmation Email
> "Your meeting is confirmed for:
> **Thursday, June 5 at 3:30 PM IST (Asia/Kolkata)**
> (This is 10:00 AM EST for your host)"

### Host Notification Email
> "New meeting booked:
> **Thursday, June 5 at 10:00 AM EST (America/New_York)**
> Invitee is in Asia/Kolkata (3:30 PM IST)"

Showing both timezones in emails eliminates confusion for cross-timezone meetings.

---

## Calendar Invite Timezone

Calendar invites (ICS files and Google Calendar events) include timezone metadata.

### Google Calendar
- Event created with host's timezone
- Invitee's Google Calendar converts to their local timezone automatically
- Both parties see the correct local time in their calendars

### iCal / Apple Calendar
- ICS file includes `TZID` property with IANA timezone identifier
- Apple Calendar, Outlook, and all RFC 5545-compliant clients handle conversion

### Outlook
- Calendar event created with UTC time + timezone offset
- Outlook converts to user's configured timezone

---

## Team Timezone Handling

When a team has members across multiple timezones (common in remote teams):

### Round-Robin with Distributed Timezones
- Each team member's availability is stored in their own timezone
- Available slots shown to invitee are the union of all members' free times
- Assignment notification to each member shows time in their timezone

### Collective Events Across Timezones
- System finds slots when ALL members are free simultaneously
- Displayed to invitee in invitee's timezone
- Each host's calendar invite is in their own timezone

---

## Timezone Edge Cases

### Midnight Crossover
- If a host's availability includes evening hours, some slots may show on the "next day" for an invitee in an earlier timezone
- Example: Host available until 10pm PST → invitee in India sees 11:30am next day
- Schedica handles this correctly; shows correct date for the invitee

### International Date Line
- Extreme timezone differences (e.g., +12 and -12) may result in a 2-day gap in display
- Calendar shows correct date in both parties' locales

### Half-Hour and Quarter-Hour Timezones
- Support for non-full-hour offsets: IST (UTC+5:30), NPT (UTC+5:45), IST Australia (UTC+9:30)
- All IANA timezones supported, including historical offset changes

---

## Reference Implementations

| App | Timezone Approach |
|-----|------------------|
| **Calendly** | Auto-detect invitee timezone; manual override; both parties see own timezone in emails; DST handled |
| **Cal.com** | Same as Calendly; explicit timezone label on booking page |
| **SavvyCal** | Prominent timezone display; invitee connects own calendar so timezone syncs automatically |
| **Chili Piper** | Timezone handled server-side; Salesforce timezone fields used for routing |
| **HubSpot Meetings** | Auto-detect; manual override; Google Calendar handles DST |

---

## MVP Scope

**In MVP:**
- Host timezone setting (onboarding + profile settings)
- Invitee timezone auto-detection (browser API)
- Manual timezone selector for invitees on booking page
- Timezone label shown on booking page ("Times shown in X")
- Confirmation email: both timezones shown (host's + invitee's)
- Calendar invites with correct TZID metadata
- DST-aware slot calculation (IANA timezone storage)
- 12/24-hour format based on locale

**Post-MVP:**
- Team timezone conflict visualization
- User preference to lock to specific format (12hr/24hr)
- Timezone suggestion based on country (IP-based fallback if JS detection fails)
