# Meetings Dashboard

The Meetings Dashboard is the host's central hub for managing all booked meetings — past, present, and upcoming. Without it, a host has no single place to see what's on their calendar through Schedica, making booking management impossible.

---

## Overview

Every host needs to answer these questions at a glance:
- "Who am I meeting today?"
- "What did that client say in their booking form?"
- "Did that meeting yesterday actually happen?"
- "Show me all meetings I had last month"

The Meetings Dashboard answers all of these. It is the first screen a returning host sees after logging in.

---

## Upcoming Meetings

A chronological list of all confirmed future bookings.

### Default View
- Sorted by soonest first
- Shows today's meetings at the top
- Infinite scroll or pagination (25 per page)

### Meeting Card (Each Item Shows)

| Field | Description |
|-------|-------------|
| Invitee name | Full name of the person who booked |
| Event type | Name of the event type (e.g., "30-Min Intro Call") |
| Date & Time | Meeting date and start time (host's timezone) |
| Duration | Meeting length |
| Location | Video link (Zoom/Meet/Teams) or address |
| Status badge | Confirmed / Pending / Rescheduled |
| Join button | One-click join for video meetings (active 15 min before) |

### Today's Meetings
- Highlighted section at top of upcoming list
- "Next meeting in X minutes" countdown banner
- Join button becomes active 15 minutes before start time
- Quick copy of video link

### Tomorrow and Beyond
- Grouped by date: "Tomorrow", "Wednesday, June 4", etc.
- Clear date separators between groups

---

## Past Meetings

A record of all meetings that have already occurred.

### What Shows in Past Meetings

| Field | Description |
|-------|-------------|
| Invitee name | Who was the meeting with |
| Event type | What kind of meeting it was |
| Date & Time | When it occurred |
| Duration | How long it was |
| Status | Completed / Cancelled / No-Show |
| Meeting notes | Optional post-meeting notes (host can add) |

### Status Types

| Status | Meaning |
|--------|---------|
| **Completed** | Meeting time passed, not cancelled — assumed occurred |
| **Cancelled** | Cancelled by host or invitee before meeting |
| **No-Show** | Meeting time passed after no activity (no join/cancel) |
| **Rescheduled** | Was rescheduled; shows the final outcome |

### Post-Meeting Notes
- Host can add private notes to any past meeting
- Notes are internal — not visible to invitee
- Useful for logging outcomes, follow-up tasks, or CRM notes
- Character limit: 500

---

## Meeting Detail View

Clicking any meeting (upcoming or past) opens the full detail view.

### Detail View Sections

#### Meeting Summary
- Event type name and description
- Date, time, timezone, duration
- Location (video link, phone number, address)
- Booking ID (unique reference)
- Booked on (when the invitee scheduled it)

#### Invitee Information
- Full name
- Email address
- Phone number (if collected)
- Link to email invitee directly (mailto)

#### Booking Form Answers
- All custom question answers displayed with the question label
- Example: "What's the purpose of this call?" → "Product demo"

#### Meeting Actions
- **Copy video link** — copy join URL to clipboard
- **Reschedule** — trigger reschedule flow for this booking
- **Cancel** — cancel the meeting with optional reason
- **Send email** — compose email to invitee
- **Add to notes** — internal meeting notes (past meetings)

#### Timeline / Activity Log
- When the meeting was booked
- If it was rescheduled, when and by whom
- If cancelled, when and by whom and the reason
- Payment status (if paid event type)

---

## Cancelled Meetings

A separate tab or filter for all cancelled meetings.

### Shows
- Who cancelled (host or invitee)
- When it was cancelled
- Cancellation reason (if provided)
- Original meeting date/time
- Option to reach out to re-book (link to email invitee)

---

## Search

Find any meeting quickly across all statuses and dates.

### Search Scope
- Invitee name (partial match)
- Invitee email address
- Event type name
- Meeting notes content

### Search Behavior
- Results appear as user types (debounced, 300ms delay)
- Highlights matched term in results
- Shows meeting date alongside each result for context
- Empty state: "No meetings found for '[query]'"

---

## Filters

Narrow the meeting list by specific criteria.

### Available Filters

| Filter | Options |
|--------|---------|
| Status | All, Upcoming, Completed, Cancelled, No-Show |
| Event Type | All, or select specific event type(s) |
| Date Range | Today, Last 7 days, Last 30 days, Custom range |
| Location | All, Zoom, Google Meet, Teams, Phone, In-Person |
| Host (teams) | All team members, or specific member |

### Filter Behavior
- Filters apply instantly (no submit button)
- Active filters shown as removable chips above the list
- "Clear all filters" resets to default view
- Filter state preserved when navigating away and returning

---

## Sorting

Control the order meetings are displayed.

### Sort Options
- Date (newest first / oldest first) — default
- Invitee name (A–Z / Z–A)
- Event type name (A–Z)
- Duration (shortest / longest)

---

## Bulk Actions (Teams / Admin)

For users with multiple team members' meetings visible.

### Bulk Select
- Checkbox on each meeting card
- "Select all" on current page
- Bulk cancel selected meetings
- Bulk export selected meetings to CSV

---

## Dashboard Stats Summary

At the top of the dashboard, a quick-stats bar shows:

| Stat | Description |
|------|-------------|
| Today's meetings | Count of meetings scheduled today |
| This week | Count of meetings this calendar week |
| Upcoming (total) | All future confirmed bookings |
| Cancelled this month | Number of cancellations |

---

## Empty States

Clear messaging when there are no meetings.

### No Upcoming Meetings
> "No upcoming meetings. Share your booking link to get started."
> [Copy Booking Link] button

### No Past Meetings
> "You haven't had any meetings yet. Your completed meetings will appear here."

### No Search Results
> "No meetings found for '[query]'. Try a different name or email."

---

## Notifications from Dashboard

The dashboard is also the anchor for in-app notifications.

### Notification Bell
- Unread count badge on bell icon
- Dropdown shows recent booking events:
  - "New booking: Jane Smith — 30-min call on Thursday 3pm"
  - "Cancelled: John Doe cancelled his meeting"
  - "Rescheduled: Sarah Lee moved her meeting to Friday 2pm"
- Mark all as read
- Click notification → jumps to that meeting's detail view

---

## Reference Implementations

| App | Upcoming / Past List | Search | Filter | No-Show Tracking | Post-Meeting Notes | One-Click Join |
|-----|---------------------|--------|--------|------------------|--------------------|----------------|
| **Calendly** | ✅ Upcoming + past tabs | ✅ By invitee email only | ✅ Event type, date range | ❌ No — past meetings just show as "occurred" | ❌ No | ❌ No — must open event detail to find link |
| **Cal.com** | ✅ Upcoming + past | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **SavvyCal** | ✅ Yes | ✅ Yes | ✅ Basic filters | ❌ No | ❌ No | ❌ No |
| **Chili Piper** | ✅ Pipeline-style lead view | ✅ Via CRM search | ✅ CRM + event type filters | ❌ No | ❌ No | ❌ No |
| **HubSpot Meetings** | ✅ Via HubSpot activity feed | ✅ Via HubSpot CRM | ✅ Via HubSpot filters | ❌ No | ✅ Via HubSpot deal notes | ❌ No |
| **Schedica** | ✅ Upcoming + past + cancelled tabs with date grouping | ✅ By name or email — partial match, results appear as you type | ✅ Status, event type, date range, location type | ✅ No-show status tracked; host marks manually in MVP; auto-detected in Phase 2 | ✅ Private internal notes per meeting — not visible to invitee | ✅ Join button appears 15 min before meeting — one click from the list |

---

## MVP Scope

**In MVP:**
- Upcoming meetings list with date grouping
- Past meetings list (last 90 days)
- Meeting detail view (invitee info, form answers, timeline)
- Cancelled meetings view
- Cancel meeting action from dashboard
- Basic search by invitee name/email
- Filter by status (upcoming / past / cancelled)
- Quick stats bar (today count, this week count)
- In-app notification bell

**Post-MVP:**
- No-Show status auto-detection
- Post-meeting notes
- Bulk actions (export, bulk cancel)
- Sort options
- Team-level dashboard (all members' meetings)
- Advanced date range filters


---

## Tech Stack

- **Next.js App Router server components** — the dashboard page fetches all booking data directly on the server at render time using Drizzle queries. No client-side data fetching for the initial page load — the full meeting list renders immediately.
- **Better Auth** — all dashboard routes are protected. The server component reads the current session using `auth.api.getSession()` and redirects unauthenticated users to the sign-in page. Orbit Admin can access all users' meeting data via the admin role.
- **PostgreSQL + Drizzle ORM** — all dashboard queries (upcoming list, past list, cancelled list, search, filter, stats) run directly against the `bookings` table with joins to `event_types` and `booking_answers`. Pagination, status filtering, and date range filtering are handled at the database level for efficiency.
- **pg-boss** — when a host cancels a meeting from the dashboard, the corresponding pg-boss reminder jobs for that booking are cancelled immediately to prevent sending reminders for a meeting that no longer exists.
- **Shadcn/UI** — provides the meeting list cards, filter chips, search input, status badges, date grouping layout, and the meeting detail drawer/modal.
