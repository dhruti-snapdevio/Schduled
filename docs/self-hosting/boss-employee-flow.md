# Boss + Employee Flow — Open Source Self-Hosted Model

Status: **planning doc, nothing in this file has been implemented yet.**
Owner decision: Schduled ships as a **Calendly-style feature set** on a
**Cal.com-style hosting model** — one self-hosted instance, one admin (the
boss), many independent users (employees). This is not a "v2" feature; the
multi-user architecture already exists in the current codebase. Only the
invite mechanism and a handful of copy/content fixes are missing.

---

## 1. Why this model (context for future readers)

- **Calendly** is the reference for *features* (event types, availability
  rules, one booking link, buffers, reminders). Calendly itself cannot be
  self-hosted — there is nothing to copy from it for the hosting model.
- **Cal.com** is the reference for *hosting/account model*, because it's the
  only proven open-source self-hosted product in this space: one instance,
  one admin, N users, each with an isolated workspace and public page.
- Conclusion: multi-user is not optional or deferrable — a single-user-only
  build would not be a "Calendly-style" product at all, just a personal
  calendar widget.

---

## 2. End-to-end flow (target)

```
① Boss clones repo from GitHub
     git clone … && cp .env.example .env   (DB, APP_SECRET, SMTP, etc.)
     docker-compose up      (app + worker + Postgres come up)

② Boss opens the site → FIRST-RUN SETUP WIZARD (app/setup)
     Step 1: Appearance (theme)
     Step 2: Create the ADMIN account  ← this is the boss
     Step 3: Signing in…
     → wizard self-destructs once 1 user exists (lib/setup.ts hasAnyUser())

③ Boss lands in ONBOARDING (name, username, avatar) → /dashboard
     Boss now has his own booking page: yoursite.com/boss-username
     [If it's a solo instance, the flow stops here — this already works today.]

④ Boss opens ADMIN PANEL (/orbit) → Users → "Invite user"   ← NOT YET BUILT
     Types employee email → invite email sent (magic-link style)
     Public signup stays OFF (SIGNUP_ENABLED=false) — only invited people get in

⑤ Employee clicks invite link → sets up account → ONBOARDING
     → employee gets THEIR OWN dashboard + THEIR OWN page: yoursite.com/john

⑥ Each employee manages ONLY their own event-types, availability, bookings.
     Boss (admin) sees EVERYONE via /orbit. Employees never see each other.
```

Confirmed from the current schema: all core tables (`booking`, `event_type`,
`availability_schedule`, `contact`, `user_profile`) are already scoped by
`userId` / `hostUserId`. An invited employee's data is private by
construction — no schema change needed for isolation.

---

## 3. What already exists today (do not rebuild)

| Piece | File | Status |
|---|---|---|
| Role-based admin (`user.role`) | `db/schema/auth.ts`, `config/platform.ts` | ✅ done |
| `requireAdmin()` / `requireSession()` gates | `lib/authz.ts` | ✅ done |
| First-run setup wizard | `app/setup/page.tsx`, `app/setup/setup-wizard.tsx` | ✅ done |
| Per-user onboarding | `app/(onboarding)/onboarding/page.tsx` | ✅ done |
| Per-user public booking page | `app/(booking)/[username]/page.tsx` | ✅ done |
| Signup on/off toggle | `SIGNUP_ENABLED` env, gate in `lib/auth.ts:191-204` | ✅ done |
| Admin user list / suspend / delete / impersonate | `app/(orbit)/orbit/users/`, `app/actions/orbit-users.ts` | ✅ done |
| Orbit sidebar "Users" link | `components/admin/admin-sidebar.tsx:24` | ✅ done — already labeled "Users", not "Team" (correct, no rename needed) |

---

## 4. What to BUILD — the one real feature

### Why not Better Auth's `organization` plugin

Better Auth 1.6.18 (the installed version, confirmed in `package.json`) ships
a full `organization` plugin with `createInvitation`/`acceptInvitation`/
`listMembers`/etc. It was evaluated and **rejected for this product**:

- It is inherently multi-tenant — every operation is scoped to an
  `organizationId`, requiring new `organization`, `member`, `invitation`
  (and optionally `team`) tables plus a real Drizzle migration. This product
  has exactly one tenant per instance (the boss's company), so adopting it
  means creating one throwaway `Organization` row just to satisfy foreign
  keys, forever.
- It brings a full custom access-control/permissions system
  (`allowUserToCreateOrganization`, `organizationLimit`, teams, dynamic
  roles) that doesn't map to the existing simple `user.role: admin | user`
  column already used cleanly throughout the app (`db/schema/auth.ts`).
- **External validation** (see §11 below): none of the comparable
  single-tenant-per-instance open-source self-hosted products (Ghost,
  Plausible CE, Umami) model an "organization" either — they all invite
  directly into one flat user list, exactly like this plan. Multi-tenant
  building blocks are for products where one deployment serves many
  unrelated companies (which is not this app's model).

**Decision: hand-roll the invite using the existing `verification` table**,
gated by the existing `role` column and `admin` plugin already in use.

### Invite-user flow (`P1`, not built yet)

1. **"Invite user" button** in `/orbit/users` (`app/(orbit)/orbit/users/page.tsx`,
   `components/orbit/users-table.tsx`) → opens a dialog (shadcn `Dialog`,
   per CLAUDE.md component rule) asking for email (+ optional name).
2. **New server action** in a new `app/actions/orbit-invites.ts`: writes a
   pending invite row into the existing `verification` table
   (`db/schema/auth.ts:74-85`), then enqueues an invite email via the
   existing outbox (`enqueueEmail`, `lib/email/index.ts`).
   - **Identifier must be prefixed**, e.g. `identifier: \`invite:${token}\``.
     Confirmed by reading Better Auth 1.6.18's internal usage
     (`node_modules/better-auth/dist/`): magic-link tokens are stored
     **unprefixed** (`identifier: <raw 32-char token>`), while Better Auth's
     own password-reset (`reset-password:${token}`) and account-deletion
     (`delete-account-${token}`) flows already namespace their identifiers.
     `consumeVerificationValue` does a flat, un-namespaced lookup by
     `identifier` with no `type`/`purpose` column to disambiguate — so an
     invite implementation should follow the prefixed convention, not the
     magic-link one, to stay unambiguously outside Better Auth's own token
     space.
3. **Accept route** — new page, e.g. `app/(auth)/invite/[token]/page.tsx` —
   validates the token against `verification` (looking up
   `invite:<token>`), then creates the account as `role: "user"` (never
   `"admin"`) and routes into the existing onboarding flow
   (`app/(onboarding)/onboarding/page.tsx`).
4. **Recommended default**: keep `SIGNUP_ENABLED=false` once the boss has
   his admin account — invite-only becomes the supported path for adding
   employees, not public signup. (Plausible CE's `DISABLE_REGISTRATION=
   invite_only` env value is the same pattern under a different name — see
   §11.)
5. Audit log the invite send + invite accept via `lib/audit.ts` (`audit()`),
   same pattern already used for suspend/delete/impersonate in
   `app/actions/orbit-users.ts`.
6. **Email template**: new `lib/email/templates/invite.ts` +
   `lib/email/components/invite.tsx`, following the exact pattern of
   `lib/email/templates/magic-link.ts` / `lib/email/components/magic-link.tsx`
   — same `EmailLayout` wrapper (`lib/email/components/layout.tsx`) every
   other transactional email in this app already uses.

No schema migration is required — the `verification` table's shape
(`identifier`, `value`, `expiresAt`) already fits an invite token as-is.

---

## 5. Sidebar / navigation — reviewed, nothing to add

Full audit of `components/scaffold/` (main app) and
`components/admin/admin-sidebar.tsx` (orbit):

**Main app sidebar** (`components/scaffold/sidebar-nav.tsx`) — Dashboard,
Meeting Types, Availability, Bookings, Contacts, Settings, plus
Profile / Admin Panel (admin-only, conditional) / Sign out at the bottom.
**No "Team"/"Members" link exists, and none should be added** — an employee
must never see a roster of other users; that view belongs to the admin
panel only. Confirmed no team-scoping is missing here.

**Orbit admin sidebar** (`components/admin/admin-sidebar.tsx`) — Overview,
Users, Subscribers, Audit, Queues, Email, Settings. The "Users" link
(`/orbit/users`, line 24) is where the new "Invite user" button belongs —
**no new sidebar entry needed**, it's an addition to an existing page, not
a new nav item.

**Conclusion: zero sidebar/navigation changes required.** The invite flow is
a button + dialog on the existing Users page, not a new section.

---

## 6. Theme flow — reviewed, one accuracy gap found

Full audit of every `useTheme()` / `ThemeProvider` usage:

- `ThemeProvider` is mounted once in the root layout (`app/layout.tsx:37-41`,
  `attribute="class" defaultTheme="light"`) and wraps **every** route group
  — `(app)`, `(auth)`, `(booking)`, `(landing)`, `(onboarding)`, `(orbit)`,
  `(orbit-public)` — all share the same global theme value via `next-themes`.
- **Three separate UI entry points write to that same single theme value:**
  1. `components/theme-toggle.tsx` — light/dark toggle in the main app
     header (`components/scaffold/app-shell.tsx:57`), visible to every
     logged-in user (boss or employee) on every `(app)` page.
  2. `app/(orbit)/orbit/settings/_components/appearance-card.tsx` — 3-way
     Light/Dark/System picker in Orbit settings, labeled "Choose how the
     **Orbit admin panel** looks on this device."
  3. `app/setup/setup-wizard.tsx` — one-time theme step during first run.
- **Gap found**: the Orbit appearance card's copy claims it controls "the
  Orbit admin panel," but because there is only one global `next-themes`
  context, changing it there **also changes the main app theme for that
  same browser/user** (and vice versa — the header toggle also affects what
  Orbit shows). This is not a bug that breaks anything, but the copy is
  misleading. **Action for later**: either (a) reword the Orbit appearance
  card description to "Choose how Schduled looks on this device" (accurate,
  cheap fix), or (b) actually scope it to admin-only via a second
  `next-themes` storage key (real work, not needed for this flow). Fix (a)
  is a one-line copy change and can ride along with the other landing/copy
  fixes in this doc — not urgent, not blocking the invite flow.
- **Public booking pages** (`app/(booking)/`) use themable CSS variables
  (`bg-page`, `text-foreground`, etc.) and correctly follow whichever theme
  is active — no issue.
- **Landing page** (`app/(landing)/page.tsx`, `about/page.tsx`) uses
  hardcoded hex/oklch colors in the hero and product-preview sections
  (e.g. `page.tsx:426,621,624,985`, `about/page.tsx:331`) — it does **not**
  respond to theme changes at all, always renders the dark marketing look.
  This is a deliberate marketing-page design choice, not a bug — flagging
  only so it's not mistaken for a missed theme-wiring issue.

**Conclusion: theme flow is functionally consistent (one shared value
everywhere); only the Orbit appearance-card copy is misleading and worth a
cheap wording fix.**

---

## 7. Admin panel — keep vs. remove

| Page | Keep? | Reason |
|---|---|---|
| `/orbit` (dashboard) | ✅ Keep | Instance overview — boss needs this |
| `/orbit/users` + `[id]` | ✅ Keep | Core of boss+employee — gets the new Invite button |
| `/orbit/settings` | ✅ Keep | Sign-in methods, integrations, platform health |
| `/orbit/queues` | ✅ Keep | Self-hoster needs background-job visibility |
| `/orbit/email` | ✅ Keep | Self-hoster needs outbox/delivery debugging |
| `/orbit/audit` | ✅ Keep | Security log |
| `/orbit/subscribers` | ❌ Remove | Newsletter has no audience on a private company instance |
| Footer newsletter signup + `app/api/newsletter/route.ts` | ❌ Remove | Same — no mailing list use case in self-hosted. **Correction**: the original pass only flagged the footer form; the backing API route (`app/api/newsletter/route.ts`) must be removed too, or it becomes a dead unreachable POST endpoint. |

---

## 8. Landing page content — corrections needed

Confirmed against actual implemented features (grepped `lib/`, `db/schema`,
`app/(app)/event-types/_components/tab-location.tsx`):

| Claim | File:line | Verdict | Fix |
|---|---|---|---|
| "Microsoft Teams" in feature list | `app/(landing)/page.tsx:92` (`FEATURE_GROUPS`) | ❌ False. `locationTypeEnum` has a `'teams'` value used only for *displaying* legacy/label text in bookings list + emails (`app/(app)/bookings/page.tsx:48`, `lib/email/components/booking-email.tsx:104`); `LOCATION_OPTIONS` in `tab-location.tsx:101-109` only offers `google_meet` and `zoom` — a host cannot actually select Teams when creating an event type. | Remove "Microsoft Teams" from the feature list, or scope it down to "Zoom · Google Meet" only |
| "+28%" / "Analytics" floating label | `app/(landing)/page.tsx:594-602` | ❌ No analytics feature exists anywhere in the app | Remove this floating label entirely |
| "No credit card required" (×3: hero badge, hero sub-line, CTA checkmarks) | `page.tsx:221,271-275,1126` | ⚠️ Meaningless on self-hosted — nobody pays, there's no card to not-require | Replace with "Open source" / "Self-hosted" / "Your data stays yours" |
| "Start for free" (hero CTA) | `page.tsx:261` | ⚠️ Wrong verb once signup is invite-only | Change to "Sign in" |
| "Start free today" (feature-list CTA) | `page.tsx:940` | ⚠️ Same | Change to "Sign in" |
| "Sign up in 30 seconds… No credit card" (final CTA sub-line + checkmarks) | `page.tsx:1107,1126` | ⚠️ Same | Change to "Log in and share your link" |
| FAQ: "Is Schduled really free?" | `page.tsx:102` | ⚠️ SaaS-framed question, doesn't fit self-hosted | Replace with "How do I self-host this?" |
| FAQ: "How is Schduled different from Calendly?" | `page.tsx:106` | ⚠️ Same framing issue | Replace with "How do I add my team?" (answers the invite flow) |
| "Team · 4 active members" floating label | `page.tsx:584-591` | ✅ Accurate for multi-user — keep | No change |
| "Smart scheduling for modern teams" (title/meta) | `page.tsx:37` | ✅ Accurate | No change |

**Keep as-is (verified real):** Meeting Types, Availability Rules, Booking
Limits, Buffer Times, Google Meet, Zoom, Google Calendar, Email Reminders,
Reschedule & Cancel, Custom Questions, ICS Downloads.

---

## 9. CLAUDE.md alignment note

`CLAUDE.md` currently states *"Only one admin in the system — no 'Make
Admin / Remove Admin' UI."* The code is role-based and technically
multi-admin-capable (`user.role`), but the product decision for this flow
is **single admin = the boss**. No code conflict — just confirming the doc
and the chosen flow agree. No action needed unless the boss later wants
delegated admins (e.g. an office manager), which would be a separate,
larger decision.

---

## 10. Full change list (tracking table)

Update the **Status** column as work lands. Nothing below is implemented yet.

| # | Area | File(s) | Change | Status |
|---|---|---|---|---|
| 1 | Invite flow | `app/(orbit)/orbit/users/page.tsx`, `components/orbit/users-table.tsx` | Add "Invite user" button + dialog | ⬜ Not started |
| 2 | Invite flow | `app/actions/orbit-users.ts` or new `app/actions/orbit-invites.ts` | Server action: create invite row in `verification`, enqueue invite email | ⬜ Not started |
| 3 | Invite flow | New: `app/(auth)/invite/[token]/page.tsx` | Accept-invite page → create `role: "user"` account → onboarding | ⬜ Not started |
| 4 | Invite flow | Email template (new, alongside `lib/email/components/`) | "You've been invited to Schduled" email | ⬜ Not started |
| 5 | Invite flow | `lib/audit.ts` call sites | Log invite-sent / invite-accepted events | ⬜ Not started |
| 6 | Admin panel | `app/(orbit)/orbit/subscribers/`, `components/admin/admin-sidebar.tsx` | Remove Subscribers page + its sidebar entry | ⬜ Not started |
| 7 | Landing | `components/landing/landing-footer.tsx` | Remove newsletter signup form | ⬜ Not started |
| 8 | Landing | `app/(landing)/page.tsx:92` (`FEATURE_GROUPS`) | Remove "Microsoft Teams" | ⬜ Not started |
| 9 | Landing | `app/(landing)/page.tsx:594-602` | Remove "Analytics +28%" floating label | ⬜ Not started |
| 10 | Landing | `app/(landing)/page.tsx:221,271-275,1126` | Replace "No credit card" badges/lines | ⬜ Not started |
| 11 | Landing | `app/(landing)/page.tsx:261,940` | "Start for free" → "Sign in" | ⬜ Not started |
| 12 | Landing | `app/(landing)/page.tsx:1107,1126` | "Sign up in 30 seconds…" → "Log in and share your link" | ⬜ Not started |
| 13 | Landing | `app/(landing)/page.tsx:102,106` (`FAQ_ITEMS`) | Replace 2 SaaS-framed FAQ entries with self-host ones | ⬜ Not started |
| 14 | Theme copy | `app/(orbit)/orbit/settings/_components/appearance-card.tsx:37` | Reword description to not imply admin-only scope | ⬜ Not started |
| 15 | Sidebar / theme | — | **Reviewed — no changes needed** (see §5, §6) | ✅ Reviewed, no action |

---

## 11. External research — how comparable open-source self-hosted products do this

Checked four real single-tenant-per-instance open-source products for their
invite/admin model, to validate this plan isn't inventing a nonstandard
pattern:

| Product | Model | Matches this plan? |
|---|---|---|
| **Ghost** | Admin → Settings → Staff → "Invite people" (email + role) → recipient must accept the email invite before any user record is created. No direct staff creation exists — invite is the *only* path. | ✅ Same shape as §4 above |
| **Plausible CE** (Community Edition) | First user registers as owner/admin. `DISABLE_REGISTRATION=invite_only` env var then locks out public signup — only admin-issued invites can create new accounts. | ✅ Exactly the `SIGNUP_ENABLED=false` + invite-only pattern already planned |
| **Umami** | Ships with a single admin account (must be changed on first login). Additional users can only be added by an admin through the UI — no public signup at all in the default flow. | ✅ Same admin-gated addition pattern |
| **Outline** | Admin invites users and assigns roles (Admin/Editor/Viewer) from settings; SSO is recommended for larger teams but invite-by-admin is the base mechanism. | ✅ Same admin-gated addition pattern |

**Conclusion**: every comparable product uses admin-issued, email-based
invites into one flat user list — none of them model a multi-tenant
"organization" for a single self-hosted instance. This directly supports
the §4 decision to skip Better Auth's `organization` plugin.

Sources: [Ghost — Invite your team](https://ghost.org/help/managing-your-team/), [Ghost — Staff Users developer docs](https://docs.ghost.org/staff), [Plausible CE — Configure](https://github.com/plausible/community-edition/wiki/Configure), [Umami — self-hosting setup](https://pennyblacksolutions.com/how-to-self-host-umami/), [Outline — Users & roles](https://docs.getoutline.com/s/guide/doc/users-groups-cwCxXP8R3V), [Better Auth — Organization plugin docs](https://better-auth.com/docs/plugins/organization)

---

## References

- `docs/self-hosting/installation.md` — existing clone/Docker install steps (step ① above)
- `docs/self-hosting/configuration.md` — env vars including `SIGNUP_ENABLED`
- `docs/features/admin-panel.md` — existing Orbit feature documentation
- `docs/features/user-onboarding.md` — existing onboarding flow documentation
