# Booking Page Customization

The booking page is the invitee's first impression of Schedica. Customization allows hosts and organizations to make booking pages feel like a natural extension of their brand — not a third-party tool.

---

## Overview

Every event type has a publicly accessible booking page. Above that, every host also has a **Profile Overview Page** listing all their event types. Customization ranges from basic (logo, colors) to advanced (custom domain, full white-labeling). The booking page must communicate trust and professionalism while remaining simple and fast to use.

---

## Profile Overview Page

The profile overview page is the host's "home" page — it shows all active event types in one place. Every host gets a URL like `schedica.com/yourname` that lists all their available event types.

### What Is On the Profile Page
- Host's name and profile photo
- Job title and company (optional)
- Short bio or welcome message
- All **active** (non-hidden) event types displayed as cards
- Each card shows: event type name, duration, brief description, color
- Hidden/secret event types are never shown here

### Profile Page Customization
- **Introductory text / headline:** Short welcome message shown above event types (e.g., "Thanks for visiting — pick a meeting type below")
- **Event type order:** Drag-and-drop reorder; appears in the same order for invitees
- **Color coding:** Each event type shows its assigned color as a visual accent
- **Branding:** Logo and brand color applied across the profile page
- **Remove Schedica branding:** "Powered by Schedica" badge removed on paid plans

### Event Type Card Contents (Profile Page)
Each card on the profile page shows:
- Color indicator (left border or card accent)
- Event type name
- Duration (e.g., "30 min")
- Location type icon (camera icon for video, phone icon for call, pin for in-person)
- Short description (first 80 characters of the event description)
- "Book" or "Select" CTA button

### Profile Page Behavior
- Clicking an event type card opens that event type's booking calendar
- Back button returns to the profile overview
- Profile page is publicly accessible — no login required for invitees
- If the host has only one active event type: profile page can redirect directly to that event type (optional setting)

---

## Profile and Branding

### Profile Photo
- Upload a personal profile photo shown on the booking page
- Recommended: 400×400px minimum, square crop
- Displayed in:
  - Booking page header
  - Confirmation emails sent to invitees
  - Reminder and follow-up emails

### Organization Logo
- Upload company or team logo
- Displayed in:
  - Booking page header (alongside or instead of profile photo)
  - Email notifications
  - Calendar invite descriptions
- Recommended: 440×240px minimum, transparent PNG preferred

### Banner / Cover Image
- Optional banner image across the top of the booking page
- Creates a more polished, brand-consistent experience
- Recommended: 1200×300px, landscape

### Brand Colors
- Primary color: Used for CTA buttons, selected date highlights, active states
- Text color: Customizable for contrast
- Background color: White, light gray, or custom
- Accent color: Secondary elements (hover states, borders)

### Color Presets
- Pre-built color schemes (Professional Blue, Warm Gray, Forest Green, etc.)
- Custom hex color input
- Preview updates in real-time as host changes colors

---

## Booking Page Layout

### Profile Section
- Host name (required)
- Job title / company name (optional)
- Short bio or description (up to 200 characters)
- Social links (LinkedIn, Twitter/X, website)

### Event Type Display
- Event type name prominently displayed
- Duration shown (e.g., "30 minutes")
- Location type shown (Zoom, Phone Call, In-Person, etc.)
- Description text (supports markdown: bold, links, lists)
- Meeting agenda or preparation instructions

### Calendar Display Options
- **Month view** (default): Monthly calendar with available days highlighted
- **Week view**: 7-day view showing all available slots
- **Compact list view**: Text-based list of available times (accessible, fast to load)

---

## Custom Intake Questions

Hosts add questions to the booking form to collect information before the meeting.

### Supported Question Types

| Type | Description | Example |
|------|-------------|---------|
| Short Text | Single-line free text | "What company are you from?" |
| Long Text | Multi-line textarea | "Describe what you'd like to discuss" |
| Phone Number | Phone input with country code | "Your phone number (for call backup)" |
| Email | Additional email field | "CC someone else on this meeting?" |
| Checkbox | Single true/false checkbox | "I've read the pre-meeting materials" |
| Multiple Choice | Select one from a list | "What's the purpose of this call?" |
| Multi-Select | Select many from a list | "Which topics interest you?" |
| Dropdown | Select one from dropdown | "How did you hear about us?" |
| Number | Numeric input | "How many people on your team?" |

### Question Configuration
- Mark each question as required or optional
- Set placeholder text for text fields
- Set default selection for dropdowns/radio
- Add help text below the question (context for invitee)
- Reorder questions via drag-and-drop

### Routing-Ready Questions
- Multiple choice and dropdown questions can be used in routing forms
- Answers automatically flow into routing logic to assign the right host
- CRM-mapped fields: answers sync to HubSpot/Salesforce contact fields

### Limits
- Up to 20 custom questions per event type
- Name and email are always required system fields (cannot be removed)
- Phone number is an optional system field that can be toggled on

---

## Confirmation Page

Shown to invitees immediately after successfully booking a meeting.

### Default Confirmation Page
- "You're scheduled!" confirmation message
- Meeting summary: date, time, duration, location
- Host name and profile photo
- Add to Google Calendar / Outlook / Apple Calendar buttons
- Link to reschedule or cancel
- Option to schedule another meeting

### Custom Confirmation Message
- Replace default text with custom message
- Supports basic HTML and emoji
- Example: "Thanks for booking! Please review our intake form before the call: [link]"

### Redirect to External URL
- Instead of showing Schedica's confirmation page, redirect invitees to a custom URL
- Use cases:
  - Redirect to onboarding page
  - Redirect to payment page (before Stripe integration is active)
  - Redirect to a "next steps" landing page
  - Trigger marketing pixel events

---

## Email Notifications Branding

Confirmation, reminder, and follow-up emails can be customized.

### Email Customization
- From name: Show as "Jane Smith" instead of "Schedica Notifications"
- Reply-to address: Direct replies go to host's email
- Logo in email header
- Brand color in email header and CTA buttons
- Footer text (custom disclaimer or contact info)

### Default Email Templates
- Booking confirmation (to invitee)
- Booking notification (to host)
- Cancellation confirmation (to invitee)
- Reschedule confirmation (to invitee)
- Reminder email (to invitee)
- Follow-up email (to invitee)

### Custom Subject Lines
- Customize email subject lines per event type
- Use dynamic variables: `{invitee_name}`, `{event_type}`, `{date}`, `{time}`
- Example: "Your call with Jane on {date} at {time} is confirmed"

---

## White-Labeling (Advanced)

For agencies, enterprises, and tools built on Schedica.

### Remove Schedica Branding
- "Powered by Schedica" badge removed from booking pages and emails
- Available on paid plans

### Custom Domain
- Host booking pages on your own domain
- Example: `meetings.yourcompany.com/team` instead of `schedica.com/yourname`
- DNS CNAME record setup required
- SSL/TLS certificate provisioned automatically

### Subdomain Routing
- Organization gets a branded subdomain: `yourcompany.schedica.com`
- All team members' pages live under this subdomain
- Available without full custom domain setup

### Embed Without Attribution
- Embedded booking widgets show no Schedica branding
- Fully branded experience within your website

---

## Booking Page URL Structure

| URL Type | Example |
|----------|---------|
| Personal | `schedica.com/username` |
| Specific Event | `schedica.com/username/event-slug` |
| Team Page | `schedica.com/org/team-name` |
| Custom Domain | `meetings.company.com/john` |
| Custom Domain + Event | `meetings.company.com/john/30-min-call` |

### URL Customization
- Choose username slug during onboarding
- Customize event-type slug per event type
- Both username and event slug can be changed (with redirect from old URL)

---

## Booking Page Preview

Before publishing, hosts can preview their booking page:
- See exactly what invitees will see
- Preview across device sizes (desktop, tablet, mobile)
- Test the form without creating a real booking
- Check email templates with "Send Preview Email" option

---

## Responsive Design

All booking pages are fully responsive:
- Optimized for mobile (iPhone, Android)
- Tablet-friendly layout
- Fast load times (< 1 second target)
- Accessible: WCAG 2.1 AA compliant
- Works with screen readers

---

## Booking Page Language

The booking page UI (button labels, date/time formatting, system text) can be displayed in different languages for international invitees.

### Supported Languages
- English (default)
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Portuguese (Português)
- Italian (Italiano)
- Dutch (Nederlands)
- Japanese (日本語)
- Chinese Simplified (中文)
- Hindi (हिन्दी)
- Arabic (عربي) — RTL layout supported

### What Gets Translated
- All system-generated UI text: button labels, date picker, timezone selector, confirmation message
- Default email confirmation text
- Error messages

### What Does NOT Get Translated
- Event type name (set by host — must be translated manually)
- Event type description (set by host)
- Custom intake questions (set by host)
- Any custom text entered by the host

### Language Configuration
- Set per event type (not globally, to allow different event types in different languages)
- Example: One event type in English for US clients, clone in Spanish for LATAM clients
- No automatic language detection — language is fixed per event type
- Invitee cannot manually switch language on the booking page

### Multi-Language Strategy
To support multiple languages:
1. Create the event type in primary language
2. Clone the event type
3. Change language setting on the clone
4. Translate all custom text (name, description, questions) manually
5. Share the appropriate language link with the relevant audience

---

## Reference Implementations

| App | Customization Approach |
|-----|-----------------------|
| **Calendly** | Logo, colors, profile photo; custom domain (Enterprise); remove branding (Standard+); language per event type |
| **Cal.com** | Full white-labeling; custom apps for organizations; open source enables unlimited custom theming |
| **SavvyCal** | Colors, banner images, avatars; clean modern design out of the box |
| **Chili Piper** | Minimal visual customization; focus is on routing and conversion, not branding |
| **HubSpot Meetings** | Inherits HubSpot portal branding; limited standalone customization |

---

## MVP Scope

**In MVP:**
- Profile photo upload
- Organization logo upload
- Brand primary color
- Event type name, description (with markdown)
- Custom intake questions (text, dropdown, checkbox, multiple choice)
- Default confirmation page with reschedule/cancel links
- Custom confirmation message
- Email from-name and reply-to customization
- Remove Schedica branding (paid plan)

**Post-MVP:**
- Banner/cover image
- Custom domain support
- Redirect to external URL on confirmation
- Full email template customization
- White-label embeds
- Organization subdomain
- Booking page language (per event type)
- Profile page single-event-type redirect
