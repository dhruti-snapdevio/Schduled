# User Onboarding

User Onboarding is the first-run experience that takes a brand-new user from signup to their first live booking page in the shortest possible time. A great onboarding removes friction, builds confidence, and delivers the "aha moment" — the point where the user first understands the product's value.

---

## Overview

Schedica's onboarding has one goal: get the user to a shareable booking link as fast as possible. Every step that doesn't serve that goal is removed.

The full onboarding sequence covers:
1. Account creation
2. Calendar connection
3. Timezone confirmation
4. First event type setup
5. Booking page preview and link share

Target completion time: **under 3 minutes** for a motivated user.

---

## Step 1 — Account Creation

### Sign-Up Methods

| Method | Description |
|--------|-------------|
| Google OAuth | One-click signup with Google account; no password needed |
| Microsoft OAuth | One-click signup with Microsoft / Office 365 account |
| Email + Password | Traditional email and password registration |

### Google / Microsoft OAuth Flow
1. User clicks "Sign up with Google" or "Sign up with Microsoft"
2. Redirected to provider's OAuth consent screen
3. User approves Schedica access
4. Returned to Schedica — account created instantly
5. Profile name and photo pre-filled from OAuth provider
6. No email verification step required (email already verified by provider)

### Email + Password Flow
1. User enters name, email address, and password
2. Schedica sends a verification email with a 6-digit code
3. User enters code on verification screen
4. Account created and onboarding continues

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number or special character
- Strength indicator shown in real-time

### Terms and Privacy
- Checkbox: "I agree to the Terms of Service and Privacy Policy"
- Required before account creation proceeds
- Links open in new tab (do not interrupt the onboarding flow)

---

## Step 2 — Calendar Connection

The most critical onboarding step. Without a connected calendar, Schedica cannot show real availability or write bookings.

### Calendar Provider Selection Screen
User sees a clean screen with calendar provider options:

| Provider | Notes |
|----------|-------|
| Google Calendar | Most common; recommended for Gmail users |
| Outlook / Office 365 | For Microsoft 365 work and school accounts |
| Apple Calendar / iCloud | For iPhone/Mac users using iCloud calendar |
| Skip for now | Allowed but discouraged — shows a warning |

### OAuth Connection Flow (Google / Outlook)
1. User clicks their calendar provider
2. Opens provider OAuth window
3. User logs in and approves calendar permissions
4. Returned to Schedica — connection confirmed
5. Schedica lists all calendars found on the account
6. User selects:
   - **Which calendars to check for conflicts** (toggle per calendar)
   - **Which calendar to add new bookings to** (radio selection)
7. Connection status shows green: "✓ Google Calendar connected"

### Apple Calendar (iCloud) Connection
1. User clicks "Apple Calendar"
2. Shown instructions: "Go to appleid.apple.com → Security → App-Specific Passwords → Generate"
3. User enters iCloud email and the generated app-specific password
4. Schedica connects via CalDAV and lists available calendars
5. User selects which calendars to check and write to

### Why Calendar Connection Matters (Shown to User)
A brief one-line explanation displayed during this step:
> "Schedica checks your calendar so invitees only see times when you're actually free — no more double bookings."

### Skip Option
- User can skip calendar connection and continue
- Warning shown: "Without a connected calendar, Schedica cannot prevent double-bookings. You can connect your calendar anytime in Settings."
- Booking pages will still work but availability won't reflect real calendar events

---

## Step 3 — Timezone Confirmation

### Auto-Detection
- Schedica detects the user's timezone from their browser automatically
- Shows detected timezone: "We detected your timezone as Asia/Kolkata (IST, UTC+5:30)"
- User confirms with "Yes, that's correct" or changes it

### Manual Selection
- If timezone is wrong or not detected, user selects from a searchable dropdown
- Dropdown includes all IANA timezones with city names
- Current time preview updates as user selects: "Your current time: 3:45 PM"

### Why It Matters (Shown to User)
> "Your timezone ensures your availability is shown correctly to people around the world."

---

## Step 4 — First Event Type Setup

Guided creation of the user's first event type. Keeps it simple — only the essential fields, with smart defaults pre-filled.

### Fields Shown in Onboarding (Simplified)

| Field | Default | User Action |
|-------|---------|-------------|
| Event name | "30-Minute Meeting" | Edit or keep |
| Duration | 30 minutes | Select from: 15 / 30 / 45 / 60 / Custom |
| Location | Google Meet (if Google connected) | Select location type |
| Available hours | Mon–Fri, 9:00 AM – 5:00 PM | Confirm or adjust |

### What Is Hidden During Onboarding
Advanced settings are hidden to avoid overwhelming new users:
- Buffer times
- Minimum notice period
- Custom questions
- Booking window
- Date overrides

These are accessible after onboarding from the Event Type settings.

### Availability Preview
After confirming hours, a mini calendar preview shows the first few available slots. This gives instant visual confirmation that the setup is working correctly.

---

## Step 5 — Booking Page Preview and Share

The final onboarding step shows the user their live booking page and gives them their link.

### Booking Page Preview
- Full-screen preview of the booking page as an invitee would see it
- Shows host name, profile photo, event type name, duration, and available slots
- "This is what your invitees will see" label

### Your Booking Link
- Displays the user's booking URL: `schedica.com/yourname/30-minute-meeting`
- **Copy Link** button — one click to copy to clipboard
- **Share via Email** — opens default email client with link pre-filled
- **Share on LinkedIn** — opens LinkedIn share dialog (optional)

### "You're all set!" Confirmation
- Checkmark animation and "You're ready to accept bookings!"
- Clear CTA: "Go to Dashboard" — takes user to the main Schedica dashboard

---

## Post-Onboarding: Dashboard First Visit

First time on the dashboard after onboarding, user sees a brief checklist of recommended next steps:

| Step | Status |
|------|--------|
| ✅ Connect your calendar | Done during onboarding |
| ✅ Create your first event type | Done during onboarding |
| ☐ Add a profile photo | Link to Profile Settings |
| ☐ Share your booking link | Link to copy booking URL |
| ☐ Set up a reminder email | Link to Notifications settings |

Checklist dismissible once all steps complete or manually dismissed.

---

## Re-Onboarding (Returning Incomplete Users)

If a user signed up but didn't finish onboarding (e.g., closed the tab after Step 2):
- On next login, shown a "Continue setup" banner on the dashboard
- Banner shows which step was last completed
- "Continue" button resumes from the incomplete step

---

## Onboarding Progress Indicator

Throughout onboarding, a progress bar or step indicator is shown:

```
Step 1 of 5: Connect your calendar
[●●●○○]
```

- Shows current step and total steps
- Clicking a previous step allows going back
- No skipping forward (steps must be completed in order, except the optional "skip calendar" path)

---

## Error States During Onboarding

| Error | Message Shown | Recovery |
|-------|--------------|----------|
| OAuth denied (user cancelled) | "Calendar not connected. You can connect later in Settings." | Continue without calendar |
| Google account already registered | "An account already exists with this Google account. Sign in instead." | Link to sign in |
| Email already registered | "That email is already registered. Sign in or reset your password." | Link to sign in / forgot password |
| Calendar connection failed (API error) | "We couldn't connect your calendar. Try again or skip for now." | Retry or skip |
| iCloud app-specific password wrong | "Incorrect app-specific password. Please try again." | Retry with correct password |

---

## Reference Implementation (Calendly)

Calendly's onboarding:
1. Sign up (Google / Microsoft / email)
2. Connect calendar (Google / Outlook prompt)
3. Set weekly availability
4. Name and duration for first event type
5. "Your link is ready" — copy and share

Schedica matches this flow and improves with:
- Apple Calendar connection during onboarding (Calendly removed this)
- Timezone auto-detection and confirmation as a dedicated step
- Post-onboarding checklist for next recommended actions
- "Skip" path with clear warning (vs. Calendly blocking without calendar)

---

## MVP Scope

**In MVP:**
- Google OAuth and Email + Password signup
- Google Calendar and Outlook connection during onboarding
- Apple Calendar / iCloud connection option
- Timezone auto-detection and confirmation
- First event type creation (simplified 4-field form)
- Booking page preview with copyable link
- Post-onboarding dashboard checklist

**Post-MVP:**
- Microsoft OAuth signup
- Re-onboarding flow for incomplete signups
- Animated "You're all set!" celebration screen
- Social share (LinkedIn, Twitter) of new booking page
- Team invitation during onboarding (for team accounts)
