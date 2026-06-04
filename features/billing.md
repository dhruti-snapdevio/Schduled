# Plans & Pricing

## Overview

Schedica offers tiered subscription plans. Plans control feature access and usage limits per **user account**. Plan configuration (pricing, limits, features) is fully managed by platform admins from the Admin Panel — no code change required to update pricing.

**Three surfaces this module covers:**

| Surface | Description |
|---------|-------------|
| Admin Panel — Plan Config | Platform admins configure plans, pricing, and limits |
| Landing Page — Pricing Section | Public-facing pricing page shown to visitors and logged-out users |
| App — Plan Enforcement | Limits enforced inside the app per host's active plan |

---

## User Stories

**Host**
- As a host on the free plan, I want to see exactly what I get for free, so that I can evaluate Schedica without hitting a surprise paywall mid-flow. *(MVP)*
- As a host hitting a plan limit, I want a clear upgrade prompt that explains what I gain by upgrading, so that I can make an informed decision instantly. *(MVP)*
- As a host, I want to upgrade my plan without contacting support, so that I can access paid features immediately. *(Phase 3)*
- As a host, I want to cancel my subscription and revert to the free plan without losing my data or bookings, so that I am never locked in. *(Phase 3)*

---

## 1. Plans

### Default Plans (MVP)

| Plan | Target | Price |
|------|--------|-------|
| **Free** | Freelancers and individuals getting started | $0 / month |
| **Standard** | Professionals who need full customization | Configurable by admin |
| **Pro / Teams** | Teams needing round-robin, routing, and analytics | Configurable by admin |

Plans are applied per **user account** — each host has their own plan. Team-level billing (per-workspace) is a Phase 2 feature aligned with Team Workspaces.

---

## 2. Plan Limits

Each plan has configurable limits. Limits are enforced server-side on every relevant action.

### Limit Categories

| Limit | Free | Standard | Pro / Teams |
|-------|------|----------|-------------|
| Custom questions per event type | 3 | 10 | 20 |
| Date overrides / blocked dates per month | 5 | Unlimited | Unlimited |
| Event types | Unlimited | Unlimited | Unlimited |
| Availability schedules | 1 (default) | 1 | Multiple *(Phase 2)* |
| Team members | 1 (solo only) | 1 | Up to plan limit *(Phase 2)* |
| Booking history retention | 1 year | Unlimited | Unlimited |

> All default values above are configurable from the Admin Panel — they are not hardcoded.

### Feature Flags per Plan

Some features are gated entirely (on/off) rather than limited by count:

| Feature | Free | Standard | Pro / Teams |
|---------|------|----------|-------------|
| Remove "Powered by Schedica" branding | ❌ | ✅ | ✅ |
| Custom from-name and reply-to on emails | ❌ | ✅ | ✅ |
| Full booking page customization (banner, redirect URL) | ❌ | ✅ | ✅ |
| Multiple availability schedules | ❌ | ❌ | ✅ *(Phase 2)* |
| Round-robin / collective event types | ❌ | ❌ | ✅ *(Phase 2)* |
| Routing forms | ❌ | ❌ | ✅ *(Phase 2)* |
| Analytics dashboard | ❌ | ✅ | ✅ *(Phase 2)* |
| Webhooks | ❌ | ✅ | ✅ *(Phase 2)* |
| Payment collection (Stripe) | ❌ | ❌ | ✅ *(Phase 3)* |
| Priority support | ❌ | Email | Email + chat |

> Feature flags are also configurable from the Admin Panel — not hardcoded.

---

## 3. Admin Panel — Plan Configuration

Platform admins can fully configure plans from `/admin/plans`.

### Plan List Screen

Shows all plans in a table:
- Plan name and display name
- Monthly price
- Annual price
- Status (Active / Hidden)
- Actions: Edit / Hide

### Edit Plan Screen

Each plan has a dedicated edit form with all configurable fields:

**Pricing:**
- Monthly price (USD) — number input
- Annual price (USD) — number input (typically ~20% discount)
- Currency (USD only for MVP)
- Show annual savings badge (toggle) — e.g. `"Save 20%"`

**Display (for landing page Pricing section):**
- Plan display name (e.g. `Standard`, `Pro / Teams`)
- Tagline (short line under plan name, e.g. `"For growing professionals"`)
- Highlighted / recommended (toggle) — marks this plan with a `"Most Popular"` badge on the pricing page
- CTA button label (e.g. `"Get Started"`, `"Start Free Trial"`, `"Contact Sales"`)
- CTA button action (enum: `signup` | `contact_sales`)
- Feature bullet list (ordered list of short feature highlights shown on the pricing card)
  - Each bullet: text + included (✅) or not included (❌)
  - Admins can add, edit, reorder, and remove bullets
  - These are display-only marketing bullets — separate from actual enforced limits

**Limits (enforced server-side):**
- Custom questions per event type (number or `unlimited`)
- Date overrides per month (number or `unlimited`)
- Availability schedules (number or `unlimited`)
- Team members per account (number or `unlimited`)
- Booking history retention days (number or `unlimited`)

**Feature Flags (enforced server-side):**
- Toggle on/off for each gated feature (branding removal, custom emails, analytics, webhooks, payments, etc.)

**Visibility:**
- Plan status: Active (shown on pricing page + available for assignment) / Hidden (existing users keep it, but new signups cannot choose it — useful for legacy plans)

### Save & Publish

- Changes to pricing and display take effect on the pricing page **immediately** after saving
- Changes to limits take effect for new actions — existing data is NOT retroactively deleted
  - e.g. if the question limit is lowered from 10 to 3, existing questions over the limit are preserved but the host cannot add more until they are within the new limit

---

## 4. Landing Page — Pricing Section

The public pricing page at `/pricing` (also a section on the main landing page).

### Layout

```
┌──────────────────────────────────────────────────────┐
│           Simple, transparent pricing                 │
│       [Monthly]  ●─────────  [Annual — Save 20%]     │  ← billing toggle
└──────────────────────────────────────────────────────┘

┌─────────────┐   ┌──────────────────┐   ┌─────────────┐
│    Free     │   │  ★ Standard      │   │ Pro / Teams │
│   $0/mo     │   │   $10/mo         │   │  $20/mo     │
│             │   │   Most Popular   │   │             │
│ For indiv-  │   │ For professionals│   │ For growing │
│ iduals      │   │                  │   │ teams       │
│             │   │                  │   │             │
│ ✅ 3 quest. │   │ ✅ 10 questions  │   │ ✅ 20 quest │
│ ✅ Unlim.   │   │ ✅ Unlimited     │   │ ✅ Unlimited │
│    event    │   │    event types   │   │    events   │
│    types    │   │                  │   │             │
│ ❌ Branding │   │ ✅ No branding   │   │ ✅ No brand │
│    removal  │   │ ✅ Custom emails │   │ ✅ Custom   │
│ ❌ Custom   │   │ ✅ Analytics     │   │ ✅ Round-   │
│    emails   │   │ ✅ Webhooks      │   │    robin    │
│ ...         │   │ ...              │   │ ✅ Payments │
│             │   │                  │   │             │
│[Get Started]│   │  [Get Started]   │   │[Get Started]│
└─────────────┘   └──────────────────┘   └─────────────┘

                       All plans include:
     ✅ Unlimited event types   ✅ Calendar sync (Google, Outlook, Apple)
     ✅ Booking confirmation    ✅ 24hr + 1hr email reminders
     ✅ Custom questions (3+)   ✅ Zoom / Meet / Teams video links
     ✅ Cancellation & reschedule links    ✅ Customer support
```

### Billing Toggle

- Monthly / Annual toggle at the top
- Switching to Annual updates all displayed prices to the annual monthly equivalent
- Annual savings badge shown (e.g. `"Save $24/year"`)
- Toggle state remembered in localStorage (persists on page refresh)

### Pricing Card

- One card per Active plan (in order: Free → Standard → Pro/Teams)
- Plan name, tagline, price (monthly or annual based on toggle)
- `"Most Popular"` badge on the highlighted plan
- Feature bullet list (configured in Admin Panel)
- CTA button — action based on plan config:
  - `signup` → redirects to `/sign-up?plan=standard`
  - `contact_sales` → opens a contact form modal or mailto link

### FAQ Section (below pricing cards)

Static list of common pricing questions — content managed from Admin Panel:
- Can I switch plans at any time?
- What happens when I hit a limit?
- Is there a free trial for Standard or Pro?
- Can I cancel my subscription anytime?
- Do you offer discounts for nonprofits or students?
- What happens to my bookings if I downgrade?

### Pricing Data Fetched from API

The pricing page is **not hardcoded** — it fetches plan data from:
```
GET /api/plans  (public, no auth required)
```
Updating pricing in the Admin Panel instantly updates the public pricing page without a deployment.

---

## 5. Plan Enforcement Inside the App

When a user hits a plan limit, the action is blocked with a clear upgrade prompt.

### Enforcement Points

| Action | Enforcement |
|--------|-------------|
| Add question (over question limit) | Block add. Show: `"You've reached the 3-question limit on your Free plan. Upgrade to Standard to add up to 10 questions."` |
| Add date override (over monthly limit) | Block add. Show remaining overrides + upgrade prompt. |
| Enable branding removal (not on plan) | Block toggle. Show upgrade prompt overlay. |
| Set custom from-name on emails (not on plan) | Block save. Show upgrade prompt. |
| Set custom reply-to email (not on plan) | Block save. Show upgrade prompt. |
| Access analytics dashboard (not on plan) | Show upgrade prompt instead of the dashboard. *(Phase 2)* |
| Create webhook (not on plan) | Block with upgrade prompt. *(Phase 2)* |
| Create round-robin event type (not on plan) | Block with upgrade prompt. *(Phase 2)* |
| Enable payment on event type (not on plan) | Block with upgrade prompt. *(Phase 3)* |

### Upgrade Prompt Format

```
┌──────────────────────────────────────────────┐
│  🔒  This feature is on the Standard plan    │
│                                              │
│  Upgrade to Standard to unlock:              │
│  ✅ Up to 10 custom questions                │
│  ✅ Remove "Powered by Schedica" branding    │
│  ✅ Custom from-name on reminder emails      │
│  ✅ Unlimited date overrides                 │
│  ✅ Analytics dashboard                      │
│                                              │
│        [View Plans →]    [Upgrade Now]       │
│        [Maybe later]                         │
└──────────────────────────────────────────────┘
```

- Only the account owner sees the `[Upgrade Now]` button (links to `/settings/billing`)
- Team members on a shared account see: `"Contact your account owner to upgrade"` *(Phase 2)*
- Prompt is shown as a modal or inline banner depending on context

### Usage Indicator

Hosts approaching limits (80%+ used) see a soft warning:

- Custom questions: shown in the event type builder questions panel (e.g. `"2 of 3 questions used on Free plan"`)
- Date overrides: shown in the availability settings (e.g. `"4 of 5 date overrides used this month"`)
- `/settings/billing` shows full usage summary across all limit categories *(Phase 2)*

---

## 6. Data Model

```
Plan
├── id                  (uuid, primary key)
├── name                (string — "free", "standard", "pro")
├── display_name        (string — e.g. "Standard", "Pro / Teams")
├── tagline             (string, nullable — e.g. "For growing professionals")
├── monthly_price_usd   (decimal — 0.00 for Free)
├── annual_price_usd    (decimal — monthly equivalent when billed annually)
├── is_highlighted      (boolean — "Most Popular" badge; only one plan at a time)
├── cta_label           (string — e.g. "Get Started")
├── cta_action          (enum: signup | contact_sales)
├── status              (enum: active | hidden)
├── order_index         (integer — display order on pricing page)
├── created_at          (timestamp)
└── updated_at          (timestamp)

PlanLimit
├── id                  (uuid, primary key)
├── plan_id             (foreign key → Plan)
├── limit_key           (string — e.g. "custom_questions", "date_overrides_per_month")
├── limit_value         (integer — -1 means unlimited)
└── updated_at          (timestamp)

PlanFeatureFlag
├── id                  (uuid, primary key)
├── plan_id             (foreign key → Plan)
├── feature_key         (string — e.g. "branding_removal", "custom_email_from", "analytics", "webhooks", "payments")
└── is_enabled          (boolean)

PlanBullet
├── id                  (uuid, primary key)
├── plan_id             (foreign key → Plan)
├── text                (string — e.g. "Up to 10 custom questions")
├── is_included         (boolean — ✅ or ❌)
└── order_index         (integer)

UserPlan
├── id                  (uuid, primary key)
├── user_id             (foreign key → User)
├── plan_id             (foreign key → Plan)
├── plan_override_id    (foreign key → PlanOverride, nullable — admin override takes precedence)
├── status              (enum: active | cancelled | past_due)
├── current_period_start (timestamp)
├── current_period_end  (timestamp)
├── stripe_customer_id  (string, nullable — Phase 3)
├── stripe_subscription_id (string, nullable — Phase 3)
├── created_at          (timestamp)
└── updated_at          (timestamp)

PlanOverride
├── id                  (uuid, primary key)
├── user_id             (foreign key → User)
├── plan_id             (foreign key → Plan — the override plan)
├── reason              (string — admin note e.g. "Beta tester", "Support case #123")
├── expires_at          (timestamp, nullable — null means never expires)
├── created_by_admin_id (foreign key → User)
└── created_at          (timestamp)
```

> **Effective plan resolution:**
> `user.plan_override_id` takes precedence over `user.plan_id` if a valid (non-expired) override exists. This lets admins temporarily grant a user a higher plan (e.g. for beta access or issue resolution) without changing their billing.

---

## 7. API Endpoints

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | Get all active plans with limits, feature flags, and bullets (for pricing page) |

### Authenticated

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/user/plan` | Get current user's active plan + usage stats | Any authenticated user |
| GET | `/api/user/usage` | Get current usage vs plan limits | Any authenticated user |
| POST | `/api/billing/checkout` | Create Stripe Checkout Session for plan upgrade | Account owner *(Phase 3)* |
| POST | `/api/billing/cancel` | Cancel active subscription | Account owner *(Phase 3)* |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/plans` | List all plans (including hidden) |
| GET | `/api/admin/plans/:id` | Get plan detail with all limits, flags, and bullets |
| PATCH | `/api/admin/plans/:id` | Update plan (pricing, display, limits, flags) |
| PATCH | `/api/admin/plans/:id/bullets` | Update feature bullets (reorder, add, remove) |
| GET | `/api/admin/plans/faq` | Get pricing FAQ items |
| PATCH | `/api/admin/plans/faq` | Update pricing FAQ items |
| GET | `/api/admin/users/:id/plan` | Get a user's plan + override status |
| POST | `/api/admin/users/:id/plan-override` | Set a plan override for a user |
| DELETE | `/api/admin/users/:id/plan-override` | Remove plan override (revert to assigned plan) |

### Stripe Webhooks *(Phase 3)*

| Method | Endpoint | Event |
|--------|----------|-------|
| POST | `/api/webhooks/stripe` | `checkout.session.completed` — activate new plan |
| POST | `/api/webhooks/stripe` | `customer.subscription.deleted` — revert to Free |
| POST | `/api/webhooks/stripe` | `invoice.payment_failed` — flag as past_due, send warning email |
| POST | `/api/webhooks/stripe` | `invoice.payment_succeeded` — reset past_due status |

---

## 8. UI Screens

| Screen | Route | Access |
|--------|-------|--------|
| Public Pricing Page | `/pricing` | Public |
| Pricing section on Landing Page | `/` (section) | Public |
| Current Plan & Usage | `/settings/billing` | Account owner |
| Payment method management | `/settings/billing/payment` | Account owner *(Phase 3)* |
| Admin — Plan List | `/admin/plans` | Platform Admin |
| Admin — Edit Plan | `/admin/plans/:id/edit` | Platform Admin |
| Admin — Pricing FAQ | `/admin/plans/faq` | Platform Admin |
| Admin — User Plan Override | `/admin/users/:id` (plan section) | Platform Admin |

---

## 9. Business Rules

1. Plans are applied per **user account** — individual hosts have their own plan (not per workspace; workspace-level billing is Phase 2).
2. Pricing page data is fetched from the API at runtime — not hardcoded in the frontend.
3. Lowering a plan limit does NOT retroactively remove existing data — it only blocks new actions once the limit is exceeded.
4. A platform admin's plan override takes precedence over the user's assigned plan for the duration of the override.
5. An expired plan override reverts the user to their base `plan_id` automatically.
6. Only the account owner sees the `[Upgrade Now]` CTA — team members see a "contact your account owner" message instead.
7. `limit_value = -1` in `PlanLimit` means unlimited — this is the sentinel value used across all limit checks.
8. `is_highlighted = true` on only one plan at a time — Admin Panel enforces this (selecting a new highlighted plan unsets the previous one).
9. Hidden plans are not returned by `GET /api/plans` — invisible to public pricing page and new signups but remain valid for existing users already on them.
10. Annual pricing is stored as the monthly equivalent (price per month when billed annually) — the actual annual charge is `annual_price_usd × 12`.
11. On plan downgrade, access continues until the end of the current billing period — the plan reverts to Free only when the period ends (Stripe webhook triggers the change).
12. On failed payment, a 3-day grace period applies before the plan reverts to Free — user receives an email prompt to update their payment method.

---

## 10. Out of Scope (MVP)

- Stripe payment integration (billing is admin-controlled / free during MVP beta)
- Per-seat pricing (current model is flat per user)
- Free trial period (e.g. 14-day Standard trial)
- Promo codes and discounts
- Invoice generation and download
- Automatic plan downgrade on payment failure (Phase 3 with Stripe)
- Multi-currency pricing
- Usage-based billing
- Team / workspace-level billing (Phase 2 — aligned with Team Workspaces feature)

---

## Tech Stack

- **Drizzle ORM** — `plans`, `plan_limits`, `plan_feature_flags`, `plan_bullets`, `user_plans`, `plan_overrides` tables
- **Orbit Admin** — platform admins configure plans, set user overrides, and view usage from the admin panel
- **Stripe** *(Phase 3)* — subscription billing, checkout session creation, webhook handling, payment method management
- **pg-boss** *(Phase 3)* — processes Stripe webhook events asynchronously to stay within Stripe's 5-second webhook response deadline
- **Resend + React Email** *(Phase 3)* — payment failure warning emails, subscription confirmation emails, downgrade notice emails
