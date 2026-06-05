# Landing Page

The landing page is the first thing visitors, potential users, and search engines see. It communicates what Schedica is, why someone should use it, and how to get started — in under 10 seconds. It is the primary acquisition surface for new user sign-ups.

---

## Overview

The landing page is a public marketing page at `/`. It is entirely separate from the app (no sidebar, no dashboard layout). It is server-rendered with Next.js for fast initial load and SEO.

**Three jobs it must do:**
1. Explain the product clearly in one glance (headline + subheadline)
2. Build trust (features, differentiators, comparison)
3. Convert the visitor to a sign-up (multiple CTAs throughout)

---

## User Stories

**Visitor**
- As a visitor, I want to understand what Schedica does in the first 5 seconds, so that I know if it's relevant to me. *(MVP)*
- As a visitor, I want to see what makes Schedica different from Calendly, so that I have a reason to switch. *(MVP)*
- As a visitor, I want to sign up with a single click from the landing page, so that I can get started without hunting for the sign-up button. *(MVP)*
- As a visitor, I want the page to load fast on mobile, so that I don't wait or bounce. *(MVP)*

---

## Page Sections (in order)

### 1. Navigation Bar (Sticky)

| Element | Detail |
|---------|--------|
| Logo | Schedica wordmark — links to `/` |
| Nav links | Features, How It Works, About |
| Sign In | Links to `/sign-in` |
| Get Started | Primary CTA button — links to `/sign-up` |

- Sticky on scroll — stays visible as user scrolls down
- Hamburger menu on mobile (drawer)
- Background becomes solid white on scroll (transparent at top)

---

### 2. Hero Section

The most important section — must immediately communicate the product value.

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│      Stop the back-and-forth.                                      │
│      Let people book time with you — automatically.                │
│                                                                    │
│      Schedica gives you a smart scheduling link. Share it.         │
│      Your invitees pick a time that works. Done.                   │
│                                                                    │
│      [ Get Started Free ]    [ See How It Works ↓ ]               │
│                                                                    │
│      ┌──────────────────────────────────────────────────────┐     │
│      │  [Product screenshot / animated demo of booking page] │     │
│      └──────────────────────────────────────────────────────┘     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Headline:** Short, benefit-focused, no jargon
**Subheadline:** One sentence explaining the mechanism
**Primary CTA:** "Get Started Free" → `/sign-up`
**Secondary CTA:** "See How It Works" → scrolls to How It Works section
**Hero visual:** Screenshot or short looping animation of the booking flow

---

### 3. Social Proof Bar

A thin bar below the hero with a simple trust signal:

```
Used by freelancers, sales teams, coaches, and recruiters worldwide.
```

Optional: logos of companies using it (when available post-launch).

---

### 4. Features Section

Six cards highlighting the core capabilities.

| Feature Card | Icon | Headline | One-line description |
|-------------|------|----------|---------------------|
| Smart Booking Links | 🔗 | Share one link | Invitees self-schedule based on your real-time availability |
| Calendar Sync | 📅 | Never double-book | Syncs with Google and Outlook calendars automatically (Apple iCloud: Phase 2) |
| Both Timezones | 🌍 | No timezone confusion | Every email shows both your time and the invitee's time |
| Custom Questions | 📝 | Know who you're meeting | Collect info before the call — no intake form separate from booking |
| Automated Reminders | 🔔 | Fewer no-shows | 24hr and 1hr email reminders sent automatically |
| Cancellation Enforcement | 🛡️ | Protect your time | Actually block last-minute cancellations — not just display a policy |

Layout: 3-column grid on desktop, 1-column on mobile.

---

### 5. How It Works

Four simple steps — visual, numbered.

```
Step 1                Step 2                Step 3                Step 4
[ Sign Up ]    →    [ Connect Calendar ] →  [ Create Event ]  →  [ Share Link ]
Create your          Sync Google            Set your              Send your
free account         or Outlook             availability          booking URL
                     Calendar               and duration          to anyone
```

Each step has an icon, number badge, title, and one-line description.

---

### 6. Key Differentiators Section

Show what Schedica does that Calendly does not.

```
┌─────────────────────────────────────────────────────────────────┐
│  What makes Schedica different                                  │
│                                                                 │
│  ✅ Apple Calendar (Phase 2) — Calendly dropped it Aug 2024    │
│  ✅ Both timezones in every email — Calendly shows only one    │
│  ✅ Cancellation enforcement — Calendly only shows policy text  │
│  ✅ Unlimited event types — no artificial limits               │
│  ✅ Multi-duration booking — one link, invitee picks 15/30/60  │
│  ✅ Fully open source — self-host it, it's yours               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7. Comparison Table

Side-by-side comparison with Calendly and Cal.com.

| Feature | Schedica | Calendly | Cal.com |
|---------|----------|----------|---------|
| Apple Calendar | ✅ Phase 2 | ❌ (dropped Aug 2024) | ✅ |
| Both timezones in emails | ✅ | ❌ | ❌ |
| Cancellation enforcement | ✅ | ❌ | ❌ |
| Multi-duration event types | ✅ | ❌ | ✅ |
| Open source | ✅ | ❌ | ✅ |
| Custom intake questions | ✅ Unlimited | ❌ Paid only | ✅ |
| Automated reminders | ✅ | ❌ Paid only | ✅ |
| Self-hosting | ✅ | ❌ | ✅ |

---

### 8. Testimonials (Static Placeholders at Launch)

Three testimonial cards with name, role, and quote. Add real testimonials post-launch.

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ "Finally a scheduler │  │ "The dual timezone   │  │ "Apple Calendar sync │
│  that enforces my    │  │  emails saved me so  │  │  is the only reason  │
│  cancellation policy"│  │  much confusion"     │  │  I switched"         │
│  — Jane, Coach       │  │  — Mark, Consultant  │  │  — Priya, Recruiter  │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

### 9. General FAQ

Accordion — 6 to 8 common questions about the product.

| Question |
|---------|
| Is Schedica really free? |
| Can I connect my Apple / iCloud calendar? (Coming in Phase 2) |
| What happens when someone books a time I've already blocked? |
| Does Schedica work for teams? |
| How is Schedica different from Calendly? |
| Can I self-host Schedica? |
| Do I need a credit card to sign up? |
| Which video conferencing tools does Schedica support? |

---

### 10. Final CTA Banner

Full-width section at the bottom before the footer.

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│     Start scheduling in minutes.                           │
│     Free, open source, and no credit card required.        │
│                                                            │
│              [ Get Started Free → ]                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

### 11. Footer

```
┌────────────────────────────────────────────────────────────┐
│  Schedica                                                  │
│                                                            │
│  Product          Open Source      Legal                   │
│  Features         GitHub           Privacy Policy          │
│  How It Works     Self-Hosting     Terms of Service        │
│  Sign Up          Contributing     Cookie Policy           │
│  Sign In                                                   │
└────────────────────────────────────────────────────────────┘
```

---

## Additional Public Pages

These pages must be live before launch:

| Page | Route | Content |
|------|-------|---------|
| Privacy Policy | `/privacy` | GDPR-compliant — data collected, retention, rights |
| Terms of Service | `/terms` | Usage terms, liability, acceptable use |
| Cookie Policy | `/cookies` | What cookies are set and why |

Static content — written once, no CMS needed for MVP.

---

## SEO Requirements

| Element | Detail |
|---------|--------|
| `<title>` | "Schedica — Smart Scheduling, Free & Open Source" |
| `<meta description>` | "Share a booking link. Let anyone schedule time with you automatically. Syncs with Google, Outlook, and Apple Calendar. Open source." |
| Open Graph `og:title` | Same as title |
| Open Graph `og:description` | Same as meta description |
| Open Graph `og:image` | 1200×630px product screenshot |
| `sitemap.xml` | Auto-generated, includes all public routes |
| `robots.txt` | Allow all crawlers |
| Canonical URL | `https://schedica.com/` |

All page metadata managed via Next.js `generateMetadata()` API.

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| Lighthouse SEO | 100 |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Mobile-responsive | ✅ Required |

- Hero image served via Next.js `<Image>` (auto WebP, lazy load)
- No client-side JS on initial render (Server Components)
- Fonts loaded via `next/font` (no layout shift)

---

## MVP Scope

**In MVP:**
- Full landing page with all 11 sections above
- Mobile-responsive layout
- `/privacy`, `/terms`, `/cookies` pages with placeholder content (update before launch)
- `sitemap.xml` and `robots.txt`
- `<title>`, `<meta description>`, and Open Graph tags on all pages
- Sticky nav with Sign In + Get Started CTAs
- Comparison table (Schedica vs Calendly vs Cal.com)

**Post-MVP:**
- Real testimonials (Phase 2 — after first users)
- Blog / content pages (Phase 3)
- Company logos in social proof bar (Phase 2 — after traction)
- Localisation / multi-language landing page (Phase 4)

---

## Tech Stack

- **Next.js 15 App Router (Server Components)** — landing page is fully server-rendered; no client-side JS on first load; fast initial paint and full SEO crawlability.
- **Next.js Metadata API** — `generateMetadata()` on every public page for type-safe `<title>`, `<meta>`, and Open Graph tags.
- **Tailwind CSS** — all landing page styles; responsive utility classes for mobile/tablet/desktop breakpoints.
- **Shadcn/UI** — accordion component for FAQ, button components for CTAs.
- **Next.js `<Image>`** — hero screenshot and section images automatically converted to WebP, sized for viewport, lazy-loaded below the fold.
- **`next/font`** — self-hosted fonts (Inter or similar) loaded without external request; eliminates font-related layout shift.
