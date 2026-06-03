# User Profile & Settings

The User Profile & Settings page is where hosts manage their personal identity, preferences, and account configuration. It is the control center for everything that defines who the user is within Schedica — their name, photo, timezone, connected calendars, and security settings.

---

## Overview

After onboarding, users need a persistent place to:
- Update their name or profile photo (shown on booking pages)
- Change their timezone (critical for correct availability display)
- Manage which calendars are connected
- Update notification preferences
- Handle security (password, 2FA)

This page is accessed from the top-right user menu → "Profile & Settings" or "Account Settings".

---

## Profile Section

The personal identity that represents the host on all booking pages and emails.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| Full Name | Yes | Displayed on booking page and in confirmation emails |
| Display Name | No | Shorter name shown instead of full name (e.g., "Jake" instead of "Jakesh Dholakia") |
| Profile Photo | No | Circular avatar on booking page and emails |
| Job Title / Role | No | Shown under name on booking page (e.g., "Senior Account Executive") |
| Company / Organization | No | Company name shown on booking page |
| Bio | No | Short description (up to 200 characters) shown on booking page |
| Website URL | No | Linked from booking page |

### Profile Photo Upload
- Accepted formats: JPG, PNG, WebP
- Maximum file size: 5MB
- Recommended size: 400×400px (square)
- Auto-cropped to circle for display
- Cropping tool available in upload flow (drag to position)
- Remove photo option (reverts to initials avatar)

### Booking Page Preview
- Live preview of booking page shown on right side as user edits profile
- Changes reflect in preview instantly before saving
- "View your booking page" link to open public page in new tab

---

## Timezone Settings

Controls the timezone used for all of the user's availability and scheduling.

### Timezone Field
- Searchable dropdown: type city name or UTC offset
- Shows current time in selected timezone as preview: "Currently 3:45 PM in your timezone"
- Full IANA timezone database (600+ timezones)
- Common timezones grouped at top for quick access

### Change Timezone Warning
When user changes their timezone after having existing availability configured:

> ⚠️ "Changing your timezone will affect how your availability is shown to invitees. Your schedule (e.g., Mon–Fri 9am–5pm) will now be interpreted in the new timezone. Existing confirmed bookings will not change."

User must confirm before saving.

### Auto-Detect Option
- "Use my browser's timezone" button
- Re-detects and pre-fills the field
- Useful if user moved and needs to update

---

## Connected Calendars

Manage which calendars are connected for availability syncing and booking writes.

### Connected Calendar List
Shows all currently connected calendars with:
- Calendar provider icon (Google, Outlook, Apple)
- Account email address
- Calendars being checked for conflicts (toggles per calendar)
- Calendar where new bookings are added (radio selection)
- Last synced timestamp
- Reconnect button (if disconnected)
- Disconnect button

### Add New Calendar
- "+ Connect Calendar" button
- Opens provider selection: Google Calendar | Outlook | Apple Calendar | CalDAV
- OAuth flow for Google/Outlook; app password for Apple
- After connecting: select which calendars to check + which to write bookings to

### Calendar Sync Status
Each connected calendar shows a sync status indicator:

| Status | Meaning |
|--------|---------|
| 🟢 Synced | Connected and syncing normally |
| 🟡 Syncing | Currently updating |
| 🔴 Disconnected | Token expired or revoked — action required |
| ⚠️ Partial | Connected but some calendars inaccessible |

### Conflict Detection Settings
Per connected calendar:
- **Check for conflicts**: Toggle on/off per calendar
  - On: Busy events on this calendar block Schedica availability
  - Off: Calendar is ignored for availability (still connected)
- Use case: Connect personal calendar to prevent booking conflicts without showing personal event names

### Add Bookings To
- Single radio selection across all connected calendars
- "Add new bookings to: [selected calendar]"
- Example: Connect work Google Calendar + personal iCloud; add bookings to work Google only

---

## Notification Preferences

Control which email notifications the host receives.

### Notification Toggles

| Notification | Default | Description |
|-------------|---------|-------------|
| New booking confirmation | On | Email when someone books a meeting |
| Cancellation notification | On | Email when invitee cancels |
| Reschedule notification | On | Email when invitee reschedules |
| Daily digest | Off | Morning email with today's meeting summary |
| Weekly summary | Off | Monday email with past week's meeting stats |
| Product updates | Off | Schedica feature announcements |

### Notification Delivery Channel
- Email (always available)
- Browser push notifications (opt-in via browser permission)
- Mobile push notifications (after mobile app install)

### Email Notification Format
- Choose between: Detailed (full invitee info) or Summary (compact)
- Language: follows account language setting (future feature)

---

## Account Settings

General account configuration.

### Email Address
- Shows current login email
- "Change email" button → requires current password + email verification on new address
- New email must be verified before it becomes active

### Password
- "Change password" button
- Requires: current password, new password, confirm new password
- Password requirements: 8+ chars, 1 uppercase, 1 number

### Two-Factor Authentication (2FA)
- Enable / disable 2FA
- Methods: Authenticator app (TOTP — Google Authenticator, Authy) or SMS
- Setup flow: scan QR code with authenticator app → enter 6-digit code to verify
- Backup codes: download 8 one-time backup codes on setup

### Login Sessions
- List of active sessions: device type, browser, IP address, last active
- "Sign out" individual sessions
- "Sign out all other devices" button

---

## Booking Page URL

### Username / URL Slug
- Current booking URL shown: `schedica.com/yourusername`
- "Change username" option
- New username validation: 3–30 chars, letters/numbers/hyphens only
- Availability check (real-time: "✓ available" or "✗ taken")
- Warning: "Changing your username will break existing shared links. A redirect will be active for 30 days."
- After change: old URL redirects to new URL for 30 days

---

## Appearance / Display Preferences

Personal preferences for the Schedica dashboard interface.

### Theme
- Light mode (default)
- Dark mode
- System (follows OS setting)

### Date Format
- MM/DD/YYYY (US format)
- DD/MM/YYYY (UK/EU/IN format)
- YYYY-MM-DD (ISO format)

### Time Format
- 12-hour (3:30 PM)
- 24-hour (15:30)
- Auto (based on browser locale)

### Language
- English (default for MVP)
- Other languages: post-MVP
- Affects dashboard UI text, not booking page (booking page language is separate)

---

## Danger Zone

Irreversible account actions, separated and clearly marked.

### Delete Account
- "Delete my account" button in red-bordered section
- Confirmation: type "DELETE" to confirm
- What happens:
  - All event types deactivated immediately
  - Existing confirmed bookings: invitees receive cancellation emails
  - Account data deleted within 30 days
  - Option to download data before deletion (GDPR-compliant export)

### Data Export (GDPR)
- "Download my data" button
- Exports: all booking history, event type configurations, invitee data
- Delivered as ZIP file via email within 24 hours

---

## Reference Implementations

| App | Profile Photo & Branding | 2FA | Active Sessions Management | Username / Booking URL | Data Export (GDPR) | Dark Mode |
|-----|--------------------------|-----|---------------------------|----------------------|--------------------|-----------| 
| **Calendly** | ✅ Photo, name, job title | ❌ No 2FA | ❌ No session management | ✅ Can change username (redirect active) | ❌ No self-serve export | ❌ No |
| **Cal.com** | ✅ Photo, name, bio | ✅ TOTP 2FA | ✅ Via open-source admin | ✅ Yes | ✅ Yes | ✅ Yes |
| **SavvyCal** | ✅ Photo, name, company | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **HubSpot Meetings** | Via HubSpot profile — not standalone | ✅ Via HubSpot SSO | ✅ Via HubSpot security | ✅ Via HubSpot | ✅ Via HubSpot GDPR tools | ✅ Via HubSpot |
| **Chili Piper** | At org level; individual profile limited | ✅ Via SSO | ✅ Via admin | ❌ No personal URL | ❌ No | ❌ No |
| **Schedica** | ✅ Photo, display name, job title, company, bio, website | ✅ TOTP (Phase 2) + SMS (Phase 3) | ✅ Phase 2 — list all sessions, revoke any | ✅ Change username with 30-day redirect | ✅ ZIP export within 24h — GDPR compliant | ✅ Light / Dark / System |

---

## MVP Scope

**In MVP:**
- Full name and display name
- Profile photo upload with cropping
- Job title, company
- Timezone setting with auto-detect
- Connected calendars management (add, remove, toggle conflict check, select write-to calendar)
- Notification preferences (new booking, cancellation, reschedule)
- Email address display (change email — post-MVP)
- Password change
- Booking URL slug display and change
- Theme: light/dark/system
- Date and time format preferences
- Account deletion with data export

**Post-MVP:**
- 2FA (TOTP and SMS)
- Login sessions management
- Bio and website URL
- Language selection
- Social links on profile


---

## Tech Stack

- **Better Auth** — manages password changes, 2FA setup (TOTP via authenticator app), active session listing, and session revocation. The admin plugin lets Orbit Admin view, ban, or impersonate any user account.
- **Next.js App Router** — all settings pages are protected server components. They read the current session via Better Auth and load the user's profile data before rendering — no loading spinner on page open.
- **PostgreSQL + Drizzle ORM** — stores extended profile fields in a `user_profiles` table (display name, job title, company, bio, website, theme preference, date/time format) and notification preferences in a separate `notification_preferences` table.
- **Shadcn/UI** — provides the settings form components: inputs, toggles, dropdowns, avatar upload cropper, and confirmation dialogs (for dangerous actions like account deletion).
- **Orbit Admin** — the Better Auth admin plugin powers the admin-side user management panel where platform administrators can view any user's profile, sessions, and account status.
