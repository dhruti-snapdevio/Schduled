# Custom Questions

Custom Questions allow hosts to collect information from invitees at the time of booking — before the meeting happens. This gives hosts the context they need to make every meeting more productive, and ensures no time is wasted on introductions that could have been answered in advance.

---

## Overview

Every booking form has two default system fields: **Name** and **Email**. Custom Questions let hosts add their own fields on top of these — up to 20 questions per event type — to gather anything from company name and role to specific agenda topics and technical requirements.

Answers are stored with the booking record, included in the host's notification email, visible in the Meetings Dashboard, and can be passed into CRM systems and reminder email templates.

---

## Default System Fields

These fields are always present on every booking form and cannot be removed:

| Field | Required | Notes |
|-------|----------|-------|
| Full Name | Yes | Invitee's full name |
| Email Address | Yes | Used for confirmation and reminder emails |

### Optional System Fields (Toggle On/Off)
| Field | Default | Notes |
|-------|---------|-------|
| Phone Number | Off | Required if SMS reminders are enabled; triggers phone call location fields |

---

## Question Types

### Short Text
- Single-line free-text input
- Best for: Name, company, job title, topic
- Character limit: 255 characters
- Example: "What company are you from?"

### Long Text (Paragraph)
- Multi-line textarea input
- Best for: Detailed descriptions, agenda items, background context
- Character limit: 2000 characters
- Example: "Please describe the main challenge you'd like to discuss on this call"

### Phone Number
- Phone number input with country code selector
- Auto-formats to international format (e.g., +91 98765 43210)
- Validates format before submission
- Example: "Your phone number (in case we need to reach you)"

### Single Select (Radio Buttons)
- Invitee picks exactly one option from a list
- Best for: Category selection, routing-compatible field
- Example: "What is the purpose of this call?" → Sales / Support / Partnership / Other
- Can be used in routing form logic (see routing-forms.md)

### Multiple Select (Checkboxes)
- Invitee picks one or more options
- Best for: Topics of interest, features to discuss
- Example: "Which features would you like to discuss?" → Pricing / Integrations / Security / Compliance

### Dropdown
- Single selection from a dropdown list
- Best for: Longer option lists (5+ items); saves visual space
- Example: "How did you hear about us?" → Google / LinkedIn / Referral / Webinar / Other
- Can be used in routing form logic

### Number
- Numeric input only
- Best for: Team size, budget, number of users
- Min/max validation optional
- Example: "How many people are on your team?"

### Date Picker
- Calendar date selector
- Best for: Project start dates, deadlines, preferred start dates
- Example: "When are you hoping to launch?"

### URL / Website
- URL input with format validation (must start with http/https)
- Best for: LinkedIn profile, company website, project URL
- Example: "Please share your company website"

---

## Question Configuration

For each question, the host can configure:

| Setting | Description |
|---------|-------------|
| Question text | The label shown to the invitee |
| Help text | Smaller description shown below the question (optional context) |
| Required / Optional | Whether invitee must answer before booking |
| Placeholder text | Greyed-out hint inside the input field |
| Default value | Pre-filled answer (invitee can change it) |
| Options list | For single/multiple select and dropdown — list of answer choices |
| Min/Max | For number fields — acceptable range |
| Character limit | For text fields — max length |

---

## Question Limits

| Plan | Max Questions per Event Type |
|------|------------------------------|
| Free | 3 |
| Standard | 10 |
| Pro / Teams | 20 |

The default system fields (Name, Email) do not count toward this limit.

---

## Question Order and Layout

- Questions are displayed in the order set by the host
- Drag-and-drop reordering in the event type editor
- Host can preview the booking form at any time to see exactly what invitees see
- Questions appear on a separate form step after the invitee selects a time slot

---

## Pre-Filling Questions

Hosts can pre-fill question answers for specific invitees — useful for embed forms where the host already knows the invitee's data.

### Via URL Parameters
Append question values to the booking URL:
```
https://schedica.com/yourname/30-min-call?a1=Acme+Corp&a2=CEO
```
- `a1` through `a20` correspond to custom question answer fields
- Pre-filled values are editable by the invitee

### Via JavaScript (Embed)
```javascript
window.schedica = {
  url: 'https://schedica.com/yourname/30-min-call',
  prefill: {
    name: 'Jane Smith',
    email: 'jane@acme.com',
    customAnswers: {
      a1: 'Acme Corp',
      a2: 'CEO'
    }
  }
};
```

### Auto-Remember for Repeat Invitees
- If an invitee has booked before and uses the same email, their previous answers are pre-filled
- Invitee can update their answers before submitting
- Stored locally in browser (no account required)

---

## Where Answers Appear

### Host Notification Email
All question answers are included in the booking notification email sent to the host:

```
New booking: 30-Min Call
Invitee: Jane Smith (jane@acme.com)

Company: Acme Corp
Job Title: CEO
Purpose of call: Product demo
Team size: 45
```

### Meetings Dashboard
- Full question/answer pairs visible in the meeting detail view
- Answers displayed with the original question label for context

### Confirmation Email to Invitee
- Invitee's own answers are included in their confirmation email
- Confirms what they submitted and gives a record for their reference

### Reminder Emails
- Custom question answers can be inserted into reminder email templates via variables:
  - `{answer_1}` through `{answer_20}`
  - Example: "Looking forward to discussing {answer_3} with you tomorrow at {time}!"

### Calendar Invite Description
- Host's calendar invite includes a summary of all question answers in the description field
- Gives host full context when viewing the meeting in Google Calendar / Outlook

---

## Routing-Compatible Questions

Single Select (radio buttons) and Dropdown questions can be used in routing logic (Phase 2 feature):
- Answer maps to a routing destination (specific event type, team member, or rejection)
- Example: "Company size: 1–10" → routes to SMB team; "Company size: 500+" → routes to Enterprise team

---

## Question Answer Validation

Client-side and server-side validation:

| Question Type | Validation |
|--------------|-----------|
| Email | Valid email format (RFC 5322) |
| Phone Number | Valid international format |
| URL | Must begin with http:// or https:// |
| Number | Within configured min/max range; numeric only |
| Required fields | Cannot submit form with blank required field |
| Text fields | Stripped of HTML/script tags before saving (XSS prevention) |

---

## Editing Questions After Bookings Exist

- Host can add, edit, or remove questions at any time
- Removing a question: answers from past bookings are preserved in the booking record; question just no longer shown on form
- Changing a question label: old answers remain but are now associated with the new label
- Adding a required question: only applies to new bookings; past bookings unaffected

---

## Reference Implementations

| App | Custom Questions Approach |
|-----|--------------------------|
| **Calendly** | Up to 10 questions; types: text, phone, radio, checkbox, dropdown; routing on radio/dropdown; pre-fill via URL params |
| **Cal.com** | Same types; unlimited questions; more field types (date, number, URL) |
| **SavvyCal** | Basic questions; fewer types; no routing integration |
| **Chili Piper** | Questions used primarily for routing qualification; CRM field mapping |
| **HubSpot Meetings** | Questions map to HubSpot contact properties; auto-update CRM on booking |

---

## MVP Scope

**In MVP:**
- Question types: Short Text, Long Text, Phone Number, Single Select, Multiple Select, Dropdown, Number
- Up to 10 questions per event type
- Required / optional toggle per question
- Help text and placeholder text per question
- Drag-and-drop reordering
- Pre-fill via URL parameters
- Answers in host notification email, meeting detail view, and calendar invite
- Answer variables in reminder email templates (`{answer_1}` through `{answer_10}`)
- Auto-remember answers for repeat invitees (browser local storage)

**Post-MVP:**
- Date picker question type
- URL / website question type
- Up to 20 questions (Pro/Teams plans)
- Pre-fill via JavaScript embed
- Routing-compatible questions (routing forms — Phase 2)
- CRM field mapping (Phase 3 — HubSpot / Salesforce)
