# Event Types

Event types define the structure of a meeting — its duration, format, participants, and rules. Schedica supports four fundamental event type categories, each suited to different scheduling scenarios.

---

## Overview

An event type is a reusable meeting template. Once created, it generates a booking link. Hosts can have many event types for different purposes (e.g., a "15-min Quick Sync" and a "60-min Strategy Session" are two separate event types with different links and settings).

---

## One-on-One Events

The most common meeting type. One host, one invitee.

### Use Cases
- Sales discovery calls
- Job interviews
- Client consultations
- Coaching sessions
- 1:1 team check-ins

### Configuration Options
- Meeting name and description
- Duration (preset: 15, 30, 45, 60 min; or custom)
- Location type: Zoom, Google Meet, Teams, phone, in-person address, custom
- Availability window (how far ahead bookings open)
- Minimum notice period
- Buffer time before / after
- Custom booking URL slug
- Custom questions (intake form)
- Cancellation / reschedule policy

### Behavior
- Single invitee books; host's calendar blocked for that slot
- Invitee receives confirmation with video link or location
- Host notified immediately upon booking

---

## Group Events

One host, multiple invitees in the same time slot. All invitees join the same meeting.

### Use Cases
- Webinars and workshops
- Group training sessions
- Info sessions (e.g., product demos for multiple contacts)
- Office hours with open seats

### Configuration Options
- All one-on-one options, plus:
- **Maximum capacity** — maximum number of invitees per slot
- **Slot visibility** — hide slot once full vs. show as "X seats remaining"
- **Shared video link** — all invitees receive the same conference link

### Behavior
- Slot stays available until capacity is reached
- Each invitee books independently and receives individual confirmation
- All invitees appear on host's calendar invite
- New invitees can book until capacity is met

### Capacity Display Options
- Show remaining seats: "3 of 10 seats remaining"
- Hide capacity: show slots as available/unavailable
- Show "Fully booked" message when capacity reached

---

## Round-Robin Events

One or more invitees, distributed among a pool of available hosts. The system automatically assigns each booking to a host based on availability and distribution rules.

### Use Cases
- Sales team inbound calls (leads distributed among reps)
- Support scheduling (tickets distributed among agents)
- Interview panels (candidates distributed among interviewers)
- Onboarding calls distributed across customer success team

### Distribution Modes

| Mode | Description |
|------|-------------|
| **Balanced (Least Recently Booked)** | Assigns to the team member who was booked least recently; equalizes workload |
| **Priority** | Assigns to highest-priority member first; moves down the list only when unavailable |
| **Weighted** | Assigns proportionally (e.g., senior reps get 60% of leads, junior reps 40%) |
| **Availability-First** | Assigns to whoever is available soonest regardless of past booking count |

### Configuration Options
- Select team members in the pool
- Choose distribution mode
- Set per-member priority or weight
- Vacation/absence overrides (exclude member from pool without removing from team)
- Re-assignment rules if original host cancels

### Behavior
- Invitee sees available slots based on collective team availability
- System assigns host at time of booking (not visible to invitee unless configured)
- Host receives booking notification
- Invitee's confirmation includes assigned host name and contact

### Smart Routing Integration
- Can be combined with routing forms to pre-filter before round-robin assignment
- Example: leads from Enterprise tier go to senior reps; SMB leads go to junior reps

---

## Collective Events

Multiple hosts required simultaneously. The booking slot is only shown when ALL required hosts are free at the same time.

### Use Cases
- Panel interviews (candidate + multiple interviewers)
- Multi-stakeholder demos (sales rep + solutions engineer)
- Contract reviews (legal + account manager)
- Co-facilitated workshops

### Configuration Options
- Select all required hosts
- Duration and location settings
- Invitee form and questions
- Confirmation and reminder workflows

### Behavior
- System checks ALL hosts' calendars simultaneously
- Slot only appears if every required host is free
- All hosts receive calendar invite upon booking
- Single video conference link generated for all participants
- Any host cancellation notifies all participants

### Difference from Group Events
| Feature | Group | Collective |
|---------|-------|-----------|
| Number of hosts | 1 | Multiple (all required) |
| Invitees | Multiple | Usually 1 invitee or small group |
| Availability check | Single host | All hosts must be free |

---

## Event Type Settings Reference

All event types share a common set of configuration options:

### Basic Settings

| Setting | Description |
|---------|-------------|
| Name | Display name shown to invitee (e.g., "30-Minute Intro Call") |
| Description | Optional explanation of what the meeting is for |
| Duration | Length of the meeting |
| URL Slug | Custom path for the booking link |
| Color / Icon | Visual identifier in dashboard |
| Status | Active / Draft / Archived |

### Location Options

| Location Type | Description |
|---------------|-------------|
| Zoom | Auto-generate unique Zoom link per booking |
| Google Meet | Auto-generate Google Meet link |
| Microsoft Teams | Auto-generate Teams meeting link |
| Webex | Auto-generate Webex meeting link |
| GoTo Meeting | Auto-generate GoTo Meeting link |
| Phone — Host calls Invitee | Collect invitee's phone number; host calls them at meeting time |
| Phone — Invitee calls Host | Host's phone number shown in confirmation; invitee calls in |
| In-Person | Physical address displayed to invitee in confirmation |
| Custom | Free-text location (e.g., permanent Zoom room link, "Ask for Jake at reception") |
| Invitee's Choice | Invitee selects from 2+ location options the host has configured |

### Phone Call Location — Detail

Two distinct phone call variants exist:

**Host calls invitee:**
- Invitee enters their phone number in the booking form (required field)
- Confirmation email does not expose host phone number
- Host sees invitee's number in their booking notification and dashboard
- Use case: Customer support, sales calls where host is initiating

**Invitee calls host:**
- Host's phone number stored in Schedica (not shown publicly)
- Invitee receives host's number in the confirmation email and calendar invite
- Use case: Inbound support lines, professional hotlines

### Scheduling Rules

| Setting | Description |
|---------|-------------|
| Booking Window | How many days ahead invitees can book (e.g., 60 days) |
| Minimum Notice | Minimum hours/days before booking (e.g., "24 hours ahead") |
| Buffer Before | Blocked time before meeting starts (preparation) |
| Buffer After | Blocked time after meeting ends (follow-up) |
| Daily Limit | Max number of this event type per day |
| Weekly Limit | Max number of this event type per week |
| Start Time Increment | Slot interval shown to invitee (e.g., every 30 min) |

---

## Event Type Management

### Active / Inactive Toggle
- Every event type can be set to **Active** or **Inactive**
- Inactive event types: booking link still exists but shows "This event type is unavailable" to invitees
- Active event types: fully bookable
- Use case: Pause a seasonal event type without deleting it; deactivate a sold-out workshop

### Secret / Hidden Event Types
- Event types can be set to **Hidden** (not shown on the public profile overview page)
- Hidden event types are still bookable via direct link
- Only accessible to people who have the exact URL
- Use cases:
  - VIP-only booking links shared privately
  - Internal scheduling links for team use
  - Event types for specific campaigns (shared in email only)

### Clone / Duplicate
- Any event type can be duplicated in one click
- Clone creates an identical copy with all settings preserved
- Clone is created in "Inactive" state by default (prevents accidental live duplicates)
- Cloned event type has a new URL slug (e.g., appended "-copy")
- Edit and activate when ready

### Color Coding
- Assign a color to each event type
- Colors shown:
  - On the host's profile overview page (color-coded cards)
  - On the Meetings Dashboard (colored dot next to each booking)
  - In analytics (color-coded charts)
- Helps hosts visually organize many event types at a glance

### Drag-and-Drop Reordering
- Event types on the profile overview page can be reordered by dragging
- Order set by host determines what invitees see first
- Most important or most popular event types placed at top

### Invitee Guests (Allow Additional Attendees)
- Per event type setting: allow invitees to add additional guests to the booking
- **Default:** Enabled on 1-on-1 event types
- **Max guests:** Up to 10 additional email addresses
- Guest experience:
  - Guests receive all confirmation, reminder, and follow-up emails
  - Guests appear on the host's calendar invite as additional attendees
  - Guests visible in the booking detail on the host's Meetings Dashboard
- **Disable this option:** Toggle off per event type for private meetings
- **Not available on:** Group event types (capacity is controlled differently)

### Multiple Durations per Event Type
- One event type can offer multiple duration choices
- Example: "Consultation Call — 30 min / 45 min / 60 min"
- Invitee selects duration on the booking page before seeing available slots
- Price can vary per duration (if payment is enabled)
- Availability windows recalculate based on selected duration

### Cancellation Policy Text
- Hosts can add a cancellation policy notice shown on the booking page and in confirmation emails
- Example: "Cancellations must be made at least 24 hours in advance"
- **Important:** This is informational text only — Schedica does not enforce the policy mechanically in the base version
- Enforcement (blocking cancellations within X hours) is available as a configurable option (see [booking-flow.md](booking-flow.md))
- To prevent invitees from cancelling at all: disable the cancel link in email notification settings

## Duplication and Templates

- Clone an existing event type to use as a template
- System default templates: "15-Minute Call", "30-Minute Meeting", "60-Minute Session"
- Template library (shared organization templates for teams)

---

## Reference Implementations

| App | Event Type Approach |
|-----|---------------------|
| **Calendly** | 4 types (1:1, Group, Round-Robin, Collective); Free = 1 event type only |
| **Cal.com** | Same 4 types; unlimited on free plan; supports managed events for orgs |
| **Chili Piper** | Instant Booker (1:1), Handoff (chained meetings); specialized for sales |
| **HubSpot Meetings** | 1:1 links, Group, Round Robin; tied to HubSpot deal pipeline |
| **SavvyCal** | Unlimited links per plan; supports multiple durations on single link |

---

## MVP Scope

**In MVP:**
- One-on-One event types (unlimited)
- Group event types (limited capacity per slot)
- Full configuration: name, duration, location, availability, questions

**Post-MVP:**
- Round-robin event types (requires teams feature)
- Collective event types (requires teams feature)
- Weighted distribution modes
- Template library
