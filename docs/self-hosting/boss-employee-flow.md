# Workspace, Roles & Invite Flow — Implementation Spec (Open Source Self-Hosted)

Status: **Phase 1 implemented and verified — see §16 (tracking table) and
§17 (what shipped, including a live end-to-end smoke test). Sections 1–15
below are the original design spec, kept as-is for the reasoning trail;
read §16/§17 first for what's actually true of the code today.**
Branch: `feature/employee-invite-flow`.

Schduled ships as a **Calendly-style feature set** on a **self-hosted,
single-workspace** model — one instance = one **workspace** (the boss's company)
with **role-based access**: `owner` (exactly one, the setup-wizard account),
`manager` (delegated Admin Center access), `member` (own scheduling only).
Public signup is invite-only; new accounts come from `/orbit/users` → Invite,
never a public sign-up form. See `config/platform.ts`
(`OWNER_ROLE`/`MANAGER_ROLE`/`MEMBER_ROLE`/`PANEL_ROLES`) and `lib/invitations.ts`
for the implementation, and `CLAUDE.md` → "Auth & Roles" for the house rules.

**Phasing rule:** the whole workspace layer shipped in **Phase 1** (§7 / §11 /
§16); everything else is **Coming soon** (§12) — Managed Events (P2), Groups /
Team Manager (P3), and round-robin/routing/SSO/SCIM (later).

---

## 1. Terminology — Calendly → self-hosted Schduled

| Calendly | Schduled |
|---|---|
| **Organization** (top-level account) | **Workspace** — the single instance. One deployment = one workspace = one company. Created at first-run setup. |
| **Owner** | The boss (setup-wizard account). |
| **Manager / Member** | Managers / employees invited into the workspace. Our **Manager** = Calendly's **Admin** role, renamed so the middle tier doesn't sound like "Owner". |
| **Admin Center** | The existing **`/orbit`** panel. |
| Groups / Managed Events / SSO / SCIM / Billing / Seats | Adapted or dropped — §3. |

Not building multi-tenant SaaS: one instance = one company (§7 Option B if that changes).

---

## 2. Complete Calendly research (reference model — nothing omitted)

### 2.1 Roles (Calendly has five)
- **Owner** — all Admin powers + edit others' roles + **transfer ownership** (old owner → Admin). Exactly one.
- **Admin** — manage users (invite, assign roles, pending invites, bulk, **CSV export**), create groups, billing, org-wide settings & branding. Can't change existing roles (owner-gated).
- **Group Admin** — manage users/roles/invites **within assigned group(s)**; group reports. Limited Admin Center.
- **Team Manager** — manage team-level event types & workflows.
- **User (Member)** — personal scheduling page; own event types/availability; can *use* team/managed events, not change them.

### 2.2 Admin Center (complete)
Users (add/remove, roles, resend/pending invites, bulk, CSV export Active/Pending, transfer ownership, seats, per-user role + calendar-connection + activity) · Groups · Branding (org name + logo) · **Managed Events** (event-type templates: create, **lock** editable fields, assign, sync) · **Managed Workflows** (templates) · **Permissions** (who manages shared events/workflows/invites) · Login (SSO, SCIM, domain control) · Billing · Security (**data deletion** + **activity log**).

### 2.3 Activity log
90-day retention (SaaS); searchable by email/event/team; CSV export up to 10k events.

### 2.4 Data deletion / compliance
Delete an invitee's personal data by email; processed within 7 days (GDPR/CCPA).

### 2.5 Enterprise workspace features
SSO (SAML), **SCIM** provisioning, **domain control** (verify domain → see/invite domain users, auto-accept).

### 2.6 Scheduling product (for completeness)
Event types (one-on-one, **group**, **collective**, **round robin**); availability (hours, buffers, daily limits, up to 6 calendars); **Meeting Polls**; **one-off meetings**; **Workflows**; **Routing** forms; **Analytics**; integrations (Zoom/Meet/**Teams**, **Stripe/PayPal**, Salesforce/HubSpot, Zapier, embeds).

### 2.7 Plan gating
Free: 1 event type · Standard: unlimited events + integrations + group + collective + polls + payments · Teams: **round robin + routing + Salesforce + managed events (lock/sync) + admin controls + reporting** · Enterprise: **SSO + SCIM + audit/data-deletion + domain control + full routing + compliance**.

### 2.8 What Calendly lacks
**No custom/granular RBAC** (fixed roles; only Workflows have per-action control). Cal.com is the granular one.

---

## 3. Self-hosted adaptation (every capability mapped)

| Calendly capability | Self-hosted Schduled | Phase |
|---|---|---|
| Owner/Manager/Member roles | ✅ on `user.role` | **P1** |
| Role selection at invite | ✅ | **P1** |
| Admin Center | ✅ = `/orbit` | **P1** |
| Invite by email + accept + copy-link | ✅ hand-rolled | **P1** |
| Pending invites / resend / revoke | ✅ | **P1** |
| CSV export of members | ✅ plain CSV | **P1** |
| Transfer ownership | ✅ | **P1** |
| Workspace branding (name/logo) | ✅ on `app_setting` | **P1** |
| Activity log | ✅ reuse `/orbit/audit`; retention **configurable** (not 90-day) | **P1** |
| Data deletion (per invitee) | ✅ GDPR still applies | **P1** |
| Permissions (who manages what) | ⚠️ role-based only in P1 | **P1** |
| Managed Events / Workflows | ⏭ Coming soon | P2/P3 |
| Groups + Group Admin/Team Manager | ⏭ Coming soon | P3 |
| Team scheduling (round robin/collective) | ⏭ Coming soon (separate, large) | later |
| Routing / Meeting Polls / One-off / Analytics | ⏭ Coming soon | later |
| Billing / seats | ❌ Drop (self-hosted) | — |
| SSO / SAML | ❌ Optional later (Better Auth SSO plugin) | later |
| SCIM / domain control | ❌ Drop (SaaS-only) | — |
| Multiple workspaces per instance | ❌ Drop (multi-tenant) | — |

**Open-source principle:** no seats, no billing, no paywalled roles/admin
controls; data stays in the operator's Postgres; Calendly's SaaS limits (90-day
logs, 6-calendar cap, 10k export) become operator-configurable/unlimited.

---

## 4. Roles & permissions model (Phase 1)

**Naming:** we use **Owner / Manager / Member** — Calendly's structure with its
middle role renamed **Admin → Manager** so it doesn't overlap with "Owner". Our
**Manager** = Calendly's **Admin**. (The `/orbit` console keeps the name *Admin
Center* / admin panel — that's the area's name, not a role.) Stored `user.role`
values: `owner`, `manager`, `member`.

### 4.1 Definitions
- **`owner`** — the boss. **Exactly one.** Setup-created. Full control + the only role that changes others' roles / transfers ownership / edits infra.
- **`manager`** — trusted manager(s), zero or many. Day-to-day member management + workspace settings; **cannot** change roles, transfer ownership, or act on the owner. *(= Calendly's "Admin", renamed.)*
- **`member`** — host/employee, zero or many. Own scheduling only; **no `/orbit`**. Default invited role.

### 4.2 Permission matrix

| Capability | Owner | Manager | Member |
|---|:--:|:--:|:--:|
| Own event types / availability / bookings | ✅ | ✅ | ✅ |
| Own `/username` page + personal branding | ✅ | ✅ | ✅ |
| Access Admin Center (`/orbit`) | ✅ | ✅ | ❌ |
| Invite members (choose Member / Manager) | ✅ | ✅ | ❌ |
| Resend / revoke pending invites | ✅ | ✅ | ❌ |
| Change an existing member's role | ✅ | ⚠️¹ | ❌ |
| Suspend / remove a member | ✅ | ✅² | ❌ |
| Impersonate a member | ✅ | ✅² | ❌ |
| Export members CSV | ✅ | ✅ | ❌ |
| Workspace branding | ✅ | ✅ | ❌ |
| Activity log | ✅ | ✅ | ❌ |
| Data deletion (invitee) | ✅ | ✅ | ❌ |
| Sign-in methods / integrations / infra config | ✅ | ⚠️³ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |

¹ Owner-gated (matches Calendly) — §13 Q1. ² Members only, never the owner/other managers. ³ Recommend owner-only for infra — §13 Q2.

### 4.3 Reconciling with today's `admin`/`user`
- `config/platform.ts` currently: `ADMIN_ROLE="admin"`, `USER_ROLE="user"`.
- Add `OWNER_ROLE="owner"`, `MANAGER_ROLE="manager"`, `MEMBER_ROLE="member"`, `PANEL_ROLES=[OWNER_ROLE, MANAGER_ROLE]`. Retire `ADMIN_ROLE` as a role value (replace usages with `PANEL_ROLES`/`OWNER_ROLE`).
- **Data migration:** `admin → owner`, `user → member` (no existing `manager` rows).
- `lib/authz.ts`: `requireAdmin()` keeps its name (it gates the panel) but passes for any `PANEL_ROLES`; add `requireOwner()`.
- **Better Auth admin plugin** (`lib/auth.ts:145`): the role value is no longer `"admin"`, so set `admin({ adminRoles: [OWNER_ROLE, MANAGER_ROLE], … })` — otherwise its ban/impersonate APIs (which default to the `"admin"` role) would silently stop recognizing owners + managers.

---

## 5. End-to-end flow

```
① docker-compose up (app + worker + Postgres)
② SETUP WIZARD (app/setup) → creates WORKSPACE + OWNER (first account → role 'owner')
③ Owner → ONBOARDING → /dashboard; page yoursite.com/boss-username  [solo? stop here — works today]
④ Owner → /orbit → Members → "Invite": email + SELECT ROLE (Member|Manager); signup stays invite-only
     Pending row: Copy-link / Resend / Revoke
⑤ Invitee clicks /invite/<token> → signs up WITH THE INVITED EMAIL → role auto-assigned by the create hook → ONBOARDING → own page yoursite.com/john
⑥ Role-based access: Member = own scheduling only; Manager = Admin Center; Owner = all + infra + transfer
```

---

## 6. Current codebase state (verified — extend these)

| Piece | File(s) | Notes |
|---|---|---|
| Role column | `db/schema/auth.ts:9` (`user.role text notNull default 'user'`) | add owner/member values |
| Roles config | `config/platform.ts` (`ADMIN_ROLE`,`USER_ROLE`) | client-safe file (no `lib/env` import) |
| Authz guards | `lib/authz.ts` (`requireSession`, `requireAdmin`→`role===ADMIN_ROLE`, `getCurrentSession`) | generalize + add `requireOwner` |
| Better Auth | `lib/auth.ts` (admin+magicLink plugins; `databaseHooks.user.create.before` `:193-206`, `.after` `:207-239`) | invite-aware gate + role-on-accept |
| Signup gate env | `lib/env.ts` (`SIGNUP_ENABLED`, `INITIAL_ADMIN_EMAIL`, `NEXT_PUBLIC_PASSWORD_AUTH_ENABLED`) | keep invite-only via `SIGNUP_ENABLED=false` |
| Setup | `app/setup/`, `app/actions/setup.ts` (`createFirstAdmin`→`ADMIN_ROLE`), `lib/setup.ts` (`hasAnyUser`) | first account → `OWNER_ROLE` |
| Onboarding | `app/(onboarding)/onboarding/page.tsx`, `components/onboarding/*`, `app/actions/onboarding.ts`, `app/api/username-check/route.ts` | invited users flow through unchanged; add `invite` to RESERVED |
| Auth UI | `app/(auth)/login/page.tsx`, `_components/auth-form.tsx` (`AuthForm{googleEnabled,passwordEnabled,magicLinkEnabled}`, funnels to `/post-auth`) | new invite variant |
| Admin Users panel | `app/(orbit)/orbit/users/page.tsx`, `users/[id]/page.tsx`, `components/orbit/users-table.tsx`,`users-search.tsx`,`user-actions.tsx`,`user-detail-actions.tsx`,`booking-cancel-button.tsx`,`event-type-delete-button.tsx` | extend with invite/roles/pending/CSV |
| Admin actions | `app/actions/orbit-users.ts` (`toggleUserBanAction`,`deleteUserAction`,`bulkBanUsersAction`,`bulkDeleteUsersAction`,`cancelBookingAction`,`deleteEventTypeAction`,`recordImpersonationAction`,`nonAdminIds`) | update guards for owner/manager/member |
| Admin nav | `components/admin/admin-sidebar.tsx`,`admin-mobile-nav.tsx` (NAV_ITEMS incl. `/orbit/users` "Users") | rename label → "Members" (optional) |
| Admin settings | `app/(orbit)/orbit/settings/page.tsx` + `_components/{settings-nav,appearance-card,sign-in-methods-card}.tsx` | add Workspace-branding + Data-deletion sections |
| Activity log | `app/(orbit)/orbit/audit/page.tsx`, `app/actions/orbit-audit.ts`, `components/orbit/{audit-table,audit-filters}.tsx` | add CSV export + configurable retention |
| Email | `lib/email/index.ts` (`enqueueEmail(opts,{startAfter,idempotencyKey})`), `templates/*.ts`→`{html,text}`, `components/*.tsx`+`EmailLayout` | add invite template |
| Audit | `lib/audit.ts` (`audit({action,actorId?,actorEmail?,description,entityType,entityId?,metadata?})` — `action` is **free-text**) | new `invitation.*` actions |
| DB wiring | `db/schema/index.ts` (barrel; order: auth→enums→domain→relations), `db/schema/relations.ts`, `db/schema/enums.ts` (no role enum today; audit enum defined but column is `text`) | register `invitation` |
| Workspace singleton | `app_setting` (`db/schema/platform.ts:34`, "single-org, one admin") | store workspace branding |
| Middleware | `middleware.ts` (default fall-through **public**; `/invite/*` already public) | optionally pin `/invite/` public |

---

## 7. Architecture decision

**Option A — extend current stack (admin plugin + `invitation` table).** ✅ RECOMMENDED.
Roles on `user.role`; one new `invitation` table; workspace settings on
`app_setting`; reuse existing admin actions/components. No `workspaceId` threading.

**Option B — Better Auth `organization` plugin.** Only if you want **multiple
workspaces per instance** or Groups/RBAC out-of-box soon (multi-tenant, heavier).

Rest of spec assumes **Option A**.

---

## 8. 📦 Implementation manifest — file by file (Phase 1)

### 8.1 NEW files

| # | File | Purpose / key contents |
|---|---|---|
| N1 | `db/schema/invitation.ts` | `invitation` table. Cols: `id text pk $defaultFn(createId)`, `email text notNull`, `role text notNull default 'member'` (member\|manager — never `owner`), `token text notNull unique`, `status text notNull default 'pending'` (pending\|accepted\|revoked\|expired), `inviterId text notNull → user.id`, `acceptedBy text → user.id`, `expiresAt timestamptz notNull`, `createdAt/acceptedAt timestamptz`. Indexes (array form): partial-unique on `email WHERE status='pending'`, index on `token`. Follow `db/schema/platform.ts` conventions. |
| N2 | `lib/invitations.ts` | Shared helpers used by hooks + actions: `createInvitation({email,role,inviterId})` (generates token via `crypto.randomUUID()`/cuid, sets `expiresAt = now + INVITE_TTL_HOURS`), `findPendingInvitation(email)`, `validateInviteToken(token)` (pending + unexpired), `markInvitationAccepted(inviteId, userId)`, `expireStaleInvitations()`. Keeps the `lib/auth.ts` hook thin. |
| N3 | `app/actions/members.ts` | `'use server'`. `ActionResult<T>` union. All `requireAdmin()` first line. Exports: `inviteMemberAction(formData)` (email+role → `createInvitation` → `invitationTemplate` → `enqueueEmail` with `idempotencyKey`; audit `invitation.sent`; `revalidatePath('/orbit/users')`), `resendInviteAction`, `revokeInviteAction`, `changeRoleAction` (owner-gated per §4.2¹; guards: can't change owner, can't self-demote last panel role), `transferOwnershipAction` (`requireOwner`; atomic demote-old/promote-new), `exportMembersCsvAction(filter: 'active'|'pending')` (returns CSV string), `deleteInviteeDataAction(email)` (delete invitee bookings/contacts by email; audit `invitee.data_deleted`). |
| N4 | `lib/email/templates/invitation.ts` | `invitationTemplate({inviteeEmail, inviterName, workspaceName, acceptUrl, role})` → `{html,text}`, mirroring `templates/magic-link.ts` (render `InvitationEmail` via `renderEmailTemplate`). |
| N5 | `lib/email/components/invitation.tsx` | `InvitationEmail` React-email component wrapped in `EmailLayout`, teal-only per CLAUDE.md; CTA button → `acceptUrl`; plain-text fallback. |
| N6 | `app/(auth)/invite/[token]/page.tsx` | Server component. `await validateInviteToken(token)`; invalid → friendly "expired/used" screen (no account-existence leak). Valid → render `InviteAcceptForm` with the invited email + sign-in methods (`getEffectiveSignInMethods()`). Gets branded layout free (route group). |
| N7 | `app/(auth)/invite/[token]/_components/invite-accept-form.tsx` | `'use client'`. Variant of `AuthForm`: email **prefilled + read-only** (locked to invite), token prop; on success funnels to `/post-auth` (role is assigned by the create hook, so no token threading needed post-signup). Reuses `signUp.email` / `signIn.magicLink` / Google. |
| N8 | `components/orbit/invite-dialog.tsx` | `'use client'`. shadcn `Dialog` (per CLAUDE.md): email input(s) + **role `Select`** (Member default / Manager) → `inviteMemberAction`. Opened by an "Invite" button on the Users page. |
| N9 | `components/orbit/pending-invites-table.tsx` | `'use client'`. Lists pending invites (email, role, invitedBy, expiry) with **Copy link** (`/invite/<token>`), **Resend**, **Revoke** wired to actions. |
| N10 | `app/(orbit)/orbit/settings/_components/workspace-branding-card.tsx` | Workspace name + logo, saved to `app_setting` via a new `orbit-settings.ts` action. Mirrors `appearance-card.tsx`. |
| N11 | `app/(orbit)/orbit/settings/_components/data-deletion-card.tsx` | Email input → `deleteInviteeDataAction`; two-step confirm (AlertDialog). |
| N12 | Drizzle migration (generated) | `drizzle-kit generate` → creates `invitation` table + partial-unique index. Add a hand-written data step: `UPDATE "user" SET role='owner' WHERE role='admin'; UPDATE "user" SET role='member' WHERE role='user';` |

### 8.2 MODIFIED files

| # | File | Change |
|---|---|---|
| M1 | `config/platform.ts` | Add `OWNER_ROLE='owner'`, `MANAGER_ROLE='manager'`, `MEMBER_ROLE='member'`, `PANEL_ROLES=[OWNER_ROLE, MANAGER_ROLE]`, `INVITE_TTL_HOURS=24*7`, `ACTIVITY_LOG_RETENTION_DAYS` (nullable = unlimited). Retire `ADMIN_ROLE` as a role value. |
| M2 | `lib/authz.ts` | `requireAdmin()`: pass when `PANEL_ROLES.includes(role)` (owner or manager). Add `requireOwner()` (redirect unless `role===OWNER_ROLE`). Optional `isPanelRole(role)` helper. **Also** set the Better Auth admin plugin's `adminRoles: [OWNER_ROLE, MANAGER_ROLE]` in `lib/auth.ts` (role value is no longer `"admin"`). |
| M3 | `lib/auth.ts` | `databaseHooks.user.create.before` (`:193-206`): after the bootstrap-admin check, also `return` (allow) when `await findPendingInvitation(user.email)` exists. `.after` (`:207-239`): after bootstrap block, if a pending invite exists → set `user.role = invite.role`, `markInvitationAccepted`, audit `invitation.accepted`. |
| M4 | `app/actions/setup.ts` | `createFirstAdmin`: set first account to `OWNER_ROLE` (was `ADMIN_ROLE`); audit action string updated accordingly. |
| M5 | `db/schema/index.ts` | Add `export * from "@/db/schema/invitation"` in the domain-tables block (after enums, before relations). |
| M6 | `db/schema/relations.ts` | Add `invitationRelations` (`inviter: one(user)`, `acceptedByUser: one(user)`); add `invitations: many(invitation)` to `userRelations`. |
| M7 | `db/schema/enums.ts` | *(Optional/cosmetic)* add `invitation.sent/accepted/revoked/resent`, `user.role_changed`, `ownership.transferred`, `invitee.data_deleted` to `auditActionEnum`. Not required — `audit.action` column is free-text. |
| M8 | `app/(orbit)/orbit/users/page.tsx` | Add an **Invite** button → `InviteDialog`; render `PendingInvitesTable` above/below the users table (query `invitation WHERE status='pending'`); add **Export CSV** buttons (Active/Pending) → `exportMembersCsvAction`. Role filter already exists. |
| M9 | `components/orbit/users-table.tsx` | Add a role-change control per row (owner-gated visibility) → `changeRoleAction`; keep existing suspend/bulk. Show `owner` badge distinctly; exclude owner from bulk/select-all. |
| M10 | `components/orbit/user-actions.tsx`, `user-detail-actions.tsx` | Hide suspend/impersonate/role controls when target is `owner` or (for a manager actor) another `manager`. |
| M11 | `app/actions/orbit-users.ts` | Update `nonAdminIds` → `nonPanelIds` (exclude owner **and** managers from member-level bulk actions); `toggleUserBanAction`/`deleteUserAction` refuse to act on the owner; keep self-guards. |
| M12 | `components/admin/admin-sidebar.tsx`, `admin-mobile-nav.tsx` | Rename the `/orbit/users` label `"Users"` → `"Members"` (optional but matches Calendly). No route change needed. |
| M13 | `app/api/username-check/route.ts` + `app/actions/onboarding.ts` | Add `invite` (and `orbit`, `login`, `api`, `settings`, `setup` if missing) to the `RESERVED` username set so no member can take `/invite`. |
| M14 | `app/(orbit)/orbit/settings/_components/settings-nav.tsx` + `app/(orbit)/orbit/settings/page.tsx` | Add **Workspace** (branding) and **Data deletion** sections/anchors; render N10 + N11 cards. |
| M15 | `app/(orbit)/orbit/audit/page.tsx`, `app/actions/orbit-audit.ts`, `components/orbit/audit-filters.tsx` | Add **CSV export** of the activity log and honor `ACTIVITY_LOG_RETENTION_DAYS` (a scheduled prune job or a view filter). Search already exists via filters. |
| M16 | `app/(orbit)/orbit/settings/_components/appearance-card.tsx` | Copy fix: "Choose how **Schduled** looks on this device" (theme is global, not orbit-only — §14). |
| M17 | `middleware.ts` | *(Optional/defensive)* add `/invite/` to `PUBLIC_PREFIXES` (already public by fall-through). |
| M18 | `.env.example` + `lib/env.ts` | *(Optional)* document `ACTIVITY_LOG_RETENTION_DAYS`; reaffirm `SIGNUP_ENABLED=false` for invite-only. |

### 8.3 Auth-hook logic (the crux — pseudocode)

```
// lib/auth.ts  databaseHooks.user.create
before(user):
  if SIGNUP_ENABLED: return                      // allow
  if user.email == INITIAL_ADMIN_EMAIL: return   // bootstrap
  if await findPendingInvitation(user.email): return   // invited
  return false                                   // block

after(user):
  ...existing audit + INITIAL_ADMIN_EMAIL → OWNER promotion...
  inv = await findPendingInvitation(user.email)
  if inv:
    await db.update(user).set({ role: inv.role }).where(eq(user.id, user.id))
    await markInvitationAccepted(inv.id, user.id)
    await audit({ action: 'invitation.accepted', actorId: user.id, actorEmail: user.email,
                  description: `${user.email} accepted invite as ${inv.role}`,
                  entityType: 'invitation', entityId: inv.id })
```

Works for magic-link, password, **and** Google — role is decided by the invite,
matched on email. Invitees must sign up with the **invited email**.

---

## 9. Docs / MD updates — ✅ all done

| File | Change | Status |
|---|---|---|
| `docs/self-hosting/boss-employee-flow.md` | **This spec** (source of truth for the build). | ✅ |
| `CLAUDE.md` | Update *"Only one admin…"* → workspace model: "One workspace per instance; roles owner/manager/member; invite-only signup." | ✅ Confirmed present under "Auth & Roles" |
| `docs/self-hosting/configuration.md` | Document `SIGNUP_ENABLED=false` invite-only + the role model + `ACTIVITY_LOG_RETENTION_DAYS`. | ✅ Confirmed present |
| `docs/self-hosting/installation.md` | Note: first account = owner; invite teammates from `/orbit → Members`. | ✅ Confirmed present ("Adding teammates" section) |

---

## 10. Security checklist (must-do in P1)

- [x] **Query-scoping — spot-checked, not exhaustively audited.** Confirmed correctly scoped: `app/actions/event-types.ts` (27 `session.user.id` sites), `app/actions/availability.ts` (40), `app/actions/bookings.ts` (`hostUserId` filter). Confirmed `app/actions/contact.ts` has zero session references *by design* — it's the public marketing "Contact Us" form, not per-user data. **Not** individually re-checked: every remaining pre-existing action file (`profile.ts`, `security.ts`, `settings.ts`, `subscribers.ts`, etc.) — those predate this feature and weren't touched by it, but a full line-by-line sweep of the whole `app/actions/` directory was never actually run. If "audited" needs to mean *every* file, that step is still open.
- [x] Admin dashboard is **intentionally workspace-wide** (`app/(orbit)/orbit/page.tsx`) — confirmed still true; never reused those unscoped queries on member screens.
- [x] Invite tokens signed, single-use, time-boxed; invalid token leaks nothing about account existence. Verified live — an already-accepted invite token correctly shows "expired or used," not the accept form again (§17).
- [x] Role-escalation guards: a manager can't grant `owner`, can't edit the owner, can't self-promote; invites carry `member`/`manager` only (`isValidInvitationRole`, `lib/invitations.ts`).
- [x] Last-owner + self-lockout protection; ownership transfer atomic. There is no code path that can ever demote/delete/suspend the owner (`canActOnRole` in `lib/roles.ts` returns `false` whenever the target is `OWNER_ROLE`, full stop) — so "last owner" can't be lost, by construction, not by a special-cased guard.
- [x] **Rate-limit `inviteMemberAction` and `resendInviteAction`** — fixed. Both now call the existing Postgres-backed `checkRateLimit` (`lib/api/helpers.ts`) keyed per-actor (`members:invite:<userId>` / `members:resend:<userId>`, not per-IP — these are already authenticated behind `requireAdmin()`), capped at 20 sends per 10 minutes. Verified directly against the real rate-limit table: 20 calls allowed, the 21st and 22nd correctly blocked. See `docs/bugs/2026-07-16-*-invite-actions-unrate-limited.md`.
- [x] `invite` (+ orbit/login/api/settings/setup) reserved as usernames — added to all four `RESERVED` sets (`app/api/username-check/route.ts`, `app/actions/onboarding.ts`, `app/actions/settings.ts`, `lib/validators.ts`).
- [x] Ban re-check already enforced mid-session (`lib/authz.ts:19-28`) — pre-existing, re-confirmed still true.

---

## 11. ✅ PHASE 1 checklist (the whole workspace layer) — shipped

All items below are **done** (commit `1e977c7`) — see §16 for the file-by-file
tracking table and §17 for how each was verified live, not just typechecked.

- [x] **Roles**: M1 config + M2 authz + M12 nav + M4 setup owner.
- [x] **DB**: N1 table + M5/M6 wiring + M7 enum + N12 migration (incl. role data migration).
- [x] **Invite core**: N2 helpers + M3 auth hooks + N3 actions.
- [x] **Invite UX**: N6/N7 accept page+form + N8 invite dialog + N9 pending table + M8 users page.
- [x] **Members mgmt**: M9/M10/M11 role-aware guards + CSV export.
- [x] **Email**: N4/N5 invite template.
- [x] **Workspace settings**: N10 branding + M14 settings wiring — including making the branding actually *visible* (Admin Center sidebar + invite emails), added after the original manifest — see §17.
- [x] **Activity log & compliance**: M15 CSV+retention + N11 data-deletion.
- [x] **Guards/reserved**: M13 usernames + M17 middleware.
- [x] **Docs**: §9.
- [x] **Security checklist** (§10) — including the query-scoping-adjacent authorization fix in §16 item extension (shared `lib/roles.ts`, see `docs/bugs/2026-07-15-*-duplicated-role-guard-logic.md`).
- [x] `tsc --noEmit` clean; `pnpm build` clean; `pnpm test` 53/53. Live end-to-end verified (§17) rather than the originally-planned `verify` skill run.

---

## 12. 🔜 COMING SOON (later phases)

- **P2 — Standardization:** Managed Events (event-type templates: create/lock/assign/sync); bulk invite (paste/CSV). Two small additions surfaced later that fit here too, see §18.4/§20.2: a proper member/meeting-oriented Workspace Dashboard, and workspace-level booking defaults (duration/buffer/notice) new event types could inherit.
- **P3 — Org structure & automation:** Groups + `group`/`group_member` tables + **Group Admin** & **Team Manager** roles; Managed Workflows; granular permissions.
- **Later — Scheduling depth:** team scheduling (round-robin/collective — needs multi-host availability merge, the biggest item); routing forms; meeting polls; one-off meetings; analytics/reporting; MS Teams + Outlook, Stripe/PayPal, Salesforce/HubSpot, Zapier.
- **Enterprise (on demand):** SSO/SAML (Better Auth SSO plugin), SCIM, domain control.
- **Phase X (not scheduled, deliberately deferred twice — §7, §19, §20):** true multi-workspace-per-user with a workspace switcher. Not Calendly parity (§19.1 — Calendly doesn't have this either), a full multi-tenancy rebuild if ever pursued, not an extension of anything above.

Open-source note: none of this is paywalled or seat-gated — phasing is build order, not tiers.

---

## 13. Open questions for the PM

Most of these got a de facto answer once Phase 1 actually shipped — noted below. Still-open ones are genuine business calls, not implementation questions.

1. ~~Manager role-change authority~~ — **Resolved: owner-only.** `changeRoleAction` requires `requireOwner()` (`app/actions/members.ts`).
2. ~~Infra config~~ — **Resolved: owner-only.** `updateSignInMethodsAction` requires `requireOwner()` (`app/actions/orbit-settings.ts`); Workspace branding stayed Owner+Manager (§4.2).
3. ~~Activity-log retention default~~ — **Resolved: unlimited by default**, operator-configurable via `ACTIVITY_LOG_RETENTION_DAYS` (unset = forever).
4. **Still open** — Managed Events (P2) priority vs personal event types only? Genuine PM call.
5. **Still open** — Groups (P3) realistic member count? (pays off past ~10–15) Genuine PM call.
6. ~~Multiple workspaces per instance?~~ — **Answered at length**, not just "if yes → Option B" anymore: see §19 (Calendly doesn't do this either — fact-checked) and §20 (a full external spec proposing exactly this, filed as "Phase X," not adopted).
7. ~~Ownership transfer in P1~~ — **Resolved: yes, included.** `transferOwnershipAction` shipped in Phase 1, not deferred.

---

## 14. Carried-over review notes — ✅ done, except one still-optional item

**Theme — ✅ done.** `ThemeProvider` mounted once (`app/layout.tsx:37-41`), shared
via `next-themes`. `appearance-card.tsx` copy previously wrongly implied
orbit-only scope — confirmed fixed, now reads *"Choose how Schduled looks on
this device — this is one shared theme, not just the Admin Center."* Public
booking follows theme; landing is intentionally always-dark.

**Landing copy — ✅ done**, and went further than originally planned here
(§14 as first written only scoped `page.tsx`; the actual fix pass also covered
`about/page.tsx` and `components/landing/legal-shell.tsx`, plus `config/platform.ts`'s
shared `PRODUCT_DESCRIPTION`). Confirmed live in the current codebase: "Microsoft
Teams" gone from the feature list, the fake "Analytics +28%" stat replaced with a
real one ("License → MIT"), every "No credit card" instance replaced with
open-source/self-hosted framing, every "Start for free"/"Start Free"/"Get Started
Free" CTA now reads "Sign In" (matching that the button already correctly pointed
at `/login`, never a signup page), and the two SaaS-framed FAQs replaced with
"How do I self-host this?" / "How do I add my team?" — the second one now
directly documents the invite flow this doc describes. "Team · 4 active members"
kept, and is now literally true.

**Subscribers/newsletter — ❌ still not done, still genuinely optional.**
`/orbit/subscribers`, its sidebar entry, `newsletterSubscriber` schema/actions,
and `app/api/newsletter/route.ts` are all still present. Confirmed by checking
the repo directly — nothing here was touched. Only worth doing if a private
self-hosted instance genuinely has no use for a mailing-list feature; harmless
to leave as-is otherwise.

---

## 15. External research — comparable self-hosted products

| Product | Model | Matches? |
|---|---|---|
| **Calendly** | Owner/Admin/(Group Admin)/Member; Admin Center; invite by email; fixed roles. | ✅ Adopted (trimmed to Owner/Manager/Member for P1; Calendly's "Admin" → our "Manager"). |
| **Ghost** | Settings → Staff → "Invite people" (email+role); invite is the only path. | ✅ |
| **Plausible CE** | First user = owner; `DISABLE_REGISTRATION=invite_only`; admin invites only. | ✅ = `SIGNUP_ENABLED=false` + invite-only. |
| **Umami** | Single admin default; users added only by admin. | ✅ |
| **Outline** | Admin invites + assigns roles. | ✅ |

Sources: [Calendly roles](https://help.calendly.com/hc/en-us/articles/4410722852759-User-roles-and-permissions) · [Admin Center](https://help.calendly.com/hc/en-us/articles/16945127422487-Admin-Center) · [Managed Events](https://calendly.com/help/managed-events-overview) · [Activity log](https://calendly.com/help/the-activity-log) · [Data deletion](https://help.calendly.com/hc/en-us/articles/4412601189911-How-to-delete-personal-data-in-Calendly) · [Features](https://calendly.com/features) · [Ghost](https://ghost.org/help/managing-your-team/) · [Plausible CE](https://github.com/plausible/community-edition/wiki/Configure) · [Outline](https://docs.getoutline.com/s/guide/doc/users-groups-cwCxXP8R3V) · [Better Auth org plugin](https://better-auth.com/docs/plugins/organization)

---

## 16. Consolidated tracking table

| # | Manifest | Area | Change | Phase | Status |
|---|---|---|---|---|---|
| 1 | M1 | Roles | `config/platform.ts` roles/consts | P1 | ✅ |
| 2 | M2 | Authz | `requireAdmin`(panel)+`requireOwner` | P1 | ✅ |
| 3 | N1,M5,M6,M7,N12 | DB | `invitation` table + wiring + migration + role migration | P1 | ✅ |
| 4 | N2,M3 | Invite core | helpers + auth hooks (gate + role-on-accept) | P1 | ✅ |
| 5 | N3 | Actions | `members.ts` (invite/resend/revoke/role/transfer/CSV/data-delete) | P1 | ✅ |
| 6 | N6,N7 | Auth UI | `/invite/[token]` page + accept form | P1 | ✅ |
| 7 | N8,N9,M8 | Members UI | invite dialog + pending table + users page wiring | P1 | ✅ |
| 8 | M9,M10,M11 | Members guards | role-aware suspend/impersonate/bulk/role-change | P1 | ✅ |
| 9 | N4,N5 | Email | invite template + component | P1 | ✅ |
| 10 | N10,M14 | Workspace | branding card + settings wiring | P1 | ✅ |
| 11 | N11,M15 | Compliance | data deletion + activity-log CSV/retention | P1 | ✅ |
| 12 | M4 | Setup | first account → owner | P1 | ✅ |
| 13 | M13,M17 | Guards | reserved usernames + middleware | P1 | ✅ |
| 14 | M12,M16 | UI copy | nav label ("Members") + appearance card | P1 | ✅ |
| 15 | §9 | Docs | CLAUDE.md / configuration.md / installation.md / ENVIRONMENT.md | P1 | ✅ |
| 16 | §17 | Branding visibility | wired workspace name/logo into Admin Center sidebar + invite emails (item 10 originally only covered storage/settings-page display) | P1 | ✅ |
| 17 | §17, `docs/bugs/*-duplicated-role-guard-logic` | Authorization fix | extracted `canActOnRole`/`isPanelRole` (previously copy-pasted 3x) into shared `lib/roles.ts` | P1 | ✅ |
| 18 | — | Test suite | `lib/roles.test.ts`, `lib/invitations.test.ts`, `lib/csv.test.ts` — 30 new tests, 53/53 passing overall | P1 | ✅ |
| 19 | — | Managed Events | templates + lock/assign/sync | P2 | ⬜ |
| 20 | — | Groups | `group`/`group_member` + Group Admin/Team Manager | P3 | ⬜ |
| 21 | — | Scheduling/enterprise | round-robin/routing/polls/analytics; SSO/SCIM | later | ⬜ |
| 22 | §12, §19, §20 | Phase X | true multi-workspace-per-user + switcher — fact-checked against Calendly (doesn't have it either), documented, deliberately not started | not scheduled | ⬜ |

**Phase 1 implemented and verified** (see §17 below for how). Items 16–18
remain Coming Soon per §12/§13.

## 17. Implementation notes (what shipped, beyond the original manifest)

A few things surfaced only while building that the spec didn't call out —
recorded here so the "why" isn't lost:

- **Better Auth's admin plugin needed an explicit `roles` map.** Passing
  `adminRoles: [OWNER_ROLE, MANAGER_ROLE]` alone isn't enough — the plugin
  validates those names against its own `roles` access-control option
  (default: `{admin, user}`), so booting with unrecognized role names threw
  `BetterAuthError: Invalid admin roles` at build/boot time. Fixed in
  `lib/auth.ts` by importing `adminAc`/`userAc` from
  `better-auth/plugins/admin/access` and passing
  `roles: { owner: adminAc, manager: adminAc, member: userAc }` alongside
  `adminRoles`. Caught by `pnpm build`, not `tsc` — the admin plugin's role
  validation runs at plugin-init time, not type-check time.
- **`user.role`'s column default was still `'user'`.** A stray literal from
  the old two-role model — anyone signing up with `SIGNUP_ENABLED=true` and
  no invitation would've gotten `role='user'`, which isn't one of
  owner/manager/member. Changed the Drizzle column default to `'member'`
  (migration `0018_sturdy_puck.sql`). Existing rows were already handled by
  the `admin→owner`/`user→member` data migration (`0017`); this only fixes
  the default for *future* inserts.
- **Two `startTransition` callbacks needed rewrapping.** `role-select.tsx`
  and `pending-invites-table.tsx` originally did
  `startTransition(() => someAction(fd))`; React's `startTransition` scope
  requires a `void`-returning callback, but the action's `Promise<ActionResult>`
  doesn't satisfy that — wrapped in `async () => { await someAction(fd); }`
  instead (matches the existing `handleBulkSuspend` pattern in
  `users-table.tsx`).
- **Activity-log CSV export already existed** (`app/actions/orbit-audit.ts`
  `exportAuditLogsAction` + `components/orbit/audit-table.tsx`) — only
  *retention* was net-new. Added as `ACTIVITY_LOG_RETENTION_DAYS` (an env var,
  not a hardcoded constant — more consistent with "operator-configurable")
  plus a nightly pg-boss job (`platform.audit-logs-prune`,
  `lib/worker/handlers/audit-logs-prune.ts`), mirroring the existing
  `idempotency-keys-prune` pattern.
- **Sign-in methods became owner-only**, not just documented as a
  recommendation — `updateSignInMethodsAction` now calls `requireOwner()`
  (was `requireAdmin()`), and the Settings page renders a read-only notice
  card for managers instead of the editable form.

### Verified live (not just typechecked)

- `tsc --noEmit` — clean.
- `pnpm build` — all 66 routes compile, including `/invite/[token]`.
- `pnpm db:generate` + `pnpm db:migrate` — applied against the real dev
  Postgres; confirmed the single existing `admin` row became the sole
  `owner`, all `user` rows became `member`, and the `invitation` table +
  enums + partial-unique index exist exactly as designed.
- End-to-end smoke test against a running `pnpm dev`: inserted a real
  `invitation` row → `GET /invite/<token>` correctly resolved and rendered
  the accept form with the invited email — → `POST
  /api/auth/sign-up/email` with that email → the new user's DB row landed on
  `role='manager'` (not the default), the invitation flipped to `accepted`
  with `accepted_by` set, and `audit_logs` recorded `user.created` then
  `invitation.accepted` in order → signed in as that account and confirmed
  `requireAdmin()` now admits it to `/orbit` and `/orbit/users` (200, not a
  redirect) — the `PANEL_ROLES` check works end-to-end. Test rows were
  cleaned up afterward.

---

## 18. External "Workspace + Invite Module V1" spec — fact-checked against Calendly, cross-referenced against the build

A PRD-style spec (external, ChatGPT-style "Workspace Module V1" + a narrower "Workspace & Invite Module V1") was submitted for review, scoped down to **Workspace + Invite functionality only** per request. Nothing in this section was implemented — this is a research + gap-analysis pass only, same as §§2–3.

### 18.1 Fact-check — where the external spec's Calendly claims don't hold up

The external doc's own "✅ Available in Calendly" list wasn't independently verified before being written — it reads like a plausible SaaS feature list, not a checked one. Re-researched the specific claims relevant to Workspace + Invite:

| Claim in the external spec | What's actually true | Source |
|---|---|---|
| **"Workspace Slug (Unique URL)"** at the org level | **Not a real Calendly concept.** Calendly's URL slug is per-*user* (`calendly.com/yourname`), not a shared organization URL. There is no "team.calendly.com"-style workspace URL to claim. | community.calendly.com — slug/URL articles |
| **"Delete Workspace (Owner only)"** as a settings button | **Doesn't work that way.** Disbanding a Calendly organization isn't a dedicated delete button — the owner must first transfer ownership, or delete their own account (which disbands the org only if no one else is designated). There's no "Delete Workspace" action independent of account deletion. | help.calendly.com — Changing Ownership |
| **"Suspend Member"** | **Wrong verb, wrong actor.** Calendly's admin-side action is **remove/deactivate** a member (frees their seat; their personal Calendly account survives standalone). "Suspended" in Calendly's real product means Calendly's own Trust & Safety team disabled an *entire account* for policy violations — not something an org owner does to a teammate. | help.calendly.com — User management, Account Suspension |
| **"Personal Message (Optional)"** on an invite | **Not found in any Calendly documentation.** Plausible (GitHub/Notion have this), but nothing confirms Calendly's invite form has a message field. Treat as an unverified nice-to-have, not a confirmed parity gap. | — (absence of evidence across two searches) |
| **"Session Timeout"** as a general workspace security setting | **Real, but SSO-only.** 21-day default, shortenable by Owner/Admin — but it only applies when SAML SSO is enabled (Enterprise tier). Not a general setting every workspace has. | help.calendly.com — Admin Center |
| **"IP Address (Optional)"** on activity log entries | **Not confirmed.** No documentation surfaced mentioning per-event IP tracking in Calendly's activity log. | — (absence of evidence) |
| Activity log — general | Confirmed accurate (already in §2.3): 90-day retention, searchable, CSV export up to 10k rows. | help.calendly.com — The activity log |

**Takeaway:** about a third of the external spec's "workspace" fields (slug, delete-workspace-as-a-button, session timeout as general, IP tracking) are either not real Calendly behavior or don't apply outside Enterprise SSO. Don't build to match those claims as if they were verified Calendly parity — §18.3 below reflects the corrected picture.

### 18.2 Scope note — the external spec is much bigger than "Workspace + Invite"

The first document (`Workspace Module V1`) spans 21 modules — Dashboard, Event Types, Availability, Calendars, Bookings, Meeting Locations, Notifications, Branding, Integrations, Activity Logs, Analytics, Roles, Settings. Almost all of that is **already covered by Schduled's existing per-user features** (event types, availability, calendar sync, bookings, meeting locations, notifications all predate this workspace effort entirely) or **already scoped elsewhere in this doc** (§12 Managed Events/Groups, §13 PM questions on Groups/Analytics). This section only cross-references the second, narrower document — **Workspace, Members, Invitations, Roles, Settings, Activity Log** — since that's what was asked for.

### 18.3 Cross-reference — external spec's Workspace + Invite modules vs. this build

**Module 1 — Workspace**

| Field | Status | Note |
|---|---|---|
| Create Workspace | ✅ Implicit | No literal "Create" button — the workspace exists the instant setup completes (§5 step ②). Matches Calendly: an org isn't "created" by a customer either, it's the account. |
| Edit Workspace (name) | ✅ Built | `/orbit/settings` → Workspace card |
| Edit Workspace (logo) | ✅ Built | Same card, `logoUrl` field |
| Delete Workspace | ❌ Not built | And shouldn't be built as a standalone button — see 18.1. If ever needed, model it as "transfer ownership or delete your account," matching real Calendly, not a bare delete action. |
| Workspace Slug | ❌ Not built | Not a verified Calendly feature (18.1) — skip. |
| Timezone / Language / Date format / Time format (workspace-level defaults) | ❌ Not built | Currently per-*user* only (each member sets their own timezone at onboarding). A workspace-level *default* new members inherit is a real, small gap — see 18.4. |

**Module 2 — Members**

| Field | Status | Note |
|---|---|---|
| Avatar, name, email, role, joined date | ✅ Built | `/orbit/users` table |
| Status (Active/Suspended) | ✅ Built | Ban/unban, same page |
| Status (Pending Invitation) | ✅ Built, separate table | Pending invites render in their own table above the members list, not merged into one status column — same data, different layout |
| Calendar connected (Y/N) column | ❌ Not in the list view | Exists per-member on the detail page (`/orbit/users/[id]`) but not as a list column |
| Last active | ⚠️ Detail page only | Shown on `/orbit/users/[id]`, not the list |
| View Member | ✅ Built | `/orbit/users/[id]` |
| Change Role | ✅ Built | Owner-only dropdown |
| Suspend / Activate Member | ✅ Built | Ban/unban — see 18.1 on terminology; ours is *more* reversible than Calendly's own remove-only model |
| Remove Member | ✅ Built | Hard delete, cascades |
| Transfer Ownership | ✅ Built | `transferOwnershipAction`, owner-only |

**Module 3 — Invite Members**

| Field | Status | Note |
|---|---|---|
| Email | ✅ Built | |
| Role | ✅ Built | Member / Manager only — owner is never invitable (§4.1) |
| Personal message | ❌ Not built | Unverified Calendly claim (18.1) — low priority |
| Send / Resend / Cancel(Revoke) invite | ✅ Built | All three actions exist |
| Copy invite link | ✅ Built | On the pending-invites table |
| Status: Pending / Accepted / Expired / Cancelled | ✅ Built exactly | `invitation.status` enum is precisely these four values |

**Module 4 — Roles** (their Owner/Admin/Member = our Owner/Manager/Member)

| Permission | Status |
|---|---|
| Owner: full control, invite, remove, change roles, transfer ownership, manage settings | ✅ Matches |
| Admin/Manager: invite, remove, cannot delete workspace, cannot transfer ownership, cannot billing | ✅ Matches (billing is N/A self-hosted) |
| Member: own scheduling only, cannot invite/manage others | ✅ Matches |

**Permission matrix** — checked line by line against our actual guards:

| Their row | Ours |
|---|---|
| Edit Workspace: Owner✅ Admin❌ Member❌ | ⚠️ **We're more permissive on purpose** — branding is Owner **and** Manager (§4.2, deliberate) |
| Invite / Remove Member: Owner✅ Admin✅ Member❌ | ✅ Matches, with our added nuance that a Manager still can't act on another Manager (`canActOnRole`, `lib/roles.ts`) |
| Change Role / Transfer Ownership: Owner✅ Admin❌ Member❌ | ✅ Matches exactly |
| Delete Workspace: Owner✅ | ❌ Not built (18.1) |
| **View Members: everyone ✅** | ❌ **We deliberately disagree.** §5 of this doc's original review states plainly: *"an employee must never see a roster of other users."* Only Owner/Manager can see `/orbit/users`. This is an intentional privacy decision, not a gap — flagging because the external spec assumes the opposite. |
| Manage Own Profile: everyone ✅ | ✅ Matches |

**Module 6 — Activity Log** (their event list vs our real audit actions)

| Their event | Our audit action | Built? |
|---|---|---|
| Member Invited | `invitation.sent` | ✅ |
| Invite Accepted | `invitation.accepted` | ✅ |
| Invite Cancelled | `invitation.revoked` | ✅ |
| (Resend, not in their list but real) | `invitation.resent` | ✅ |
| Member Removed | `orbit.user_deleted` | ✅ |
| Member Suspended | `orbit.user_suspended` / `orbit.user_reactivated` | ✅ |
| Role Updated | `user.role_changed` | ✅ |
| Ownership Transferred | `ownership.transferred` | ✅ |
| Workspace Updated | `settings.workspace_branding_updated` | ✅ |
| Workspace Created | — | ❌ Not a distinct event (matches Calendly — org creation = account creation, not a separate loggable action) |

**Every real event in their Activity Log module is already implemented.** This module needs no further work.

### 18.4 What's actually worth adding (small, real gaps only)

Everything else in the external spec's Workspace+Invite scope is either already built, or was an unverified/incorrect Calendly claim (18.1). The two genuine, small gaps:

1. **Workspace-level default timezone/date-format/time-format** that a newly-invited member's onboarding pre-fills (they can still change it). Small addition to the existing Workspace settings card + a read at onboarding step 2. Not urgent — every member already sets their own on onboarding regardless.
2. **"Calendar connected" + "Last active" as list columns**, not just detail-page fields, on `/orbit/users`. Cosmetic, data already exists, just not surfaced in the table.

Optional, unverified-but-low-risk: a personal message field on the invite form (18.1 — can't confirm Calendly has it, but it's harmless to add if wanted).

**Not recommended:** a literal "Delete Workspace" button, a workspace slug/URL, or "view members" opened up to plain Members — all three either aren't real Calendly behavior or contradict a deliberate decision already made in this doc.

---

## 19. Fact-check — "can one login belong to multiple Calendly organizations?"

A follow-up claim was submitted asserting that Calendly lets **one login switch between multiple organizations** (a John@gmail.com example belonging to a "Personal," an "ABC Company," and an "XYZ Company" org simultaneously, Slack/Notion-style), and recommending Schduled go further and support true multi-workspace-per-user with a workspace switcher. Checked directly against Calendly's own support channels before writing anything into this doc.

### 19.1 The claim is false — Calendly has no organization switcher

Calendly's own community support gives an unambiguous answer:

> **"A user can only be part of one organization at a time. If a user is already in another organization, their owner or admin must remove them before they can join your [second] organization."**

There is **no "switch organization" UI, no multi-org membership, and no shared-login multi-tenancy** in Calendly at all — the opposite of what the submitted claim described. Calendly's own documented workaround for someone who genuinely needs to work inside two organizations is to **maintain two entirely separate accounts under two different email addresses** and connect the same calendars to both, manually avoiding double-booking. That's a workaround for a real limitation, not a feature.

This doesn't just fail to confirm the claim — it **strengthens the conclusion already reached in §1 and §7 of this doc**: Calendly's org model isn't merely "one org per company," it's "one login, one org, full stop." Schduled's single-workspace-per-instance model isn't a lesser copy of a more flexible Calendly — it's already at parity, or arguably ahead (see 19.2).

### 19.2 The separate, real question — should Schduled build *true* multi-workspace anyway?

Setting Calendly parity aside, "let one login create/switch between many isolated workspaces, Slack/Notion/Linear-style" is a legitimate product idea on its own merits — it's just **not a Calendly-parity feature**, since Calendly doesn't have it. Worth answering directly, separate from the fact-check above.

**What it would actually require** (this is a full multi-tenancy rebuild, not a workspace-module add-on):
- A `workspace_id` (or `organization_id`) column threaded through essentially every table that currently scopes by `userId` alone — `event_type`, `booking`, `availability_schedule`, `contact`, `connected_calendar`, `invitation`, etc. (§6 lists ~15 tables today; all of them).
- Membership becomes many-to-many: today `user.role` is one global value per person; a switchable-workspace model needs a `workspace_member(user_id, workspace_id, role)` join table instead, since the same person could be `owner` of one workspace and `member` of another.
- A workspace switcher UI, a "create new workspace" flow, and workspace-scoped versions of every query in the app (the public `/{username}/{eventSlug}` booking route would also need to resolve which workspace a username belongs to, since usernames are currently globally unique per instance, not per-workspace).
- This is precisely **Option B**, already identified and deliberately deferred in §7/§8 of this doc — nothing about the fact-check above changes that scoping; if anything it confirms Option A (single workspace, extended with roles/invites — what's actually built) was the right call for a self-hosted deployment, where "isolation between workspaces" is normally achieved by *running separate deployments*, not by multi-tenancy inside one.

**Recommendation:** don't build this now. It's a real, valid idea for a *hosted multi-tenant SaaS* product — which is a different product decision (do you want to run Schduled-as-a-service for many customers, versus ship it as self-hosted software one company deploys for itself) than what's been built so far. If that's a direction worth exploring, it deserves its own PRD and its own architecture discussion — not a bolt-on to the workspace/invite feature just implemented, and not something to half-build inside a self-hosted single-tenant model where it will fight the grain of every other design decision in this doc.

---

## 20. Submitted "Workspace V1 (Final Feature List)" — filed as a future direction, not current scope

A third spec was submitted, titled "Workspace V1 (Final Feature List)," explicitly built around **multi-workspace-per-user with a workspace switcher**. Per instruction, this is recorded here **as documentation only — nothing in this section is implemented, and it is not queued for the current build.** Its own "Admin" role is renamed **Manager** throughout, per instruction, to match this doc's terminology (§4.1).

### 20.1 Why this is filed separately from Phase 1, not merged into it

The submitted spec labels multi-workspace + workspace switcher as **"Phase 1 (Workspace Foundation)"**. That labeling doesn't match this project's actual state: Phase 1 (§11) is **already built and shipped** (commit `1e977c7`) on the single-workspace-per-instance model (§7 Option A). Multi-workspace-per-user is **Option B** — the alternative that was evaluated and explicitly deferred in §7/§8, and re-confirmed as a deliberate non-goal in §19 after fact-checking that Calendly itself doesn't do this either. So rather than renumber or reopen Phase 1, this spec is filed here as a distinct, later, optional direction — call it **"Phase X"** — to keep the historical record honest about what shipped versus what's being proposed now.

### 20.2 Cross-reference — what's genuinely new here vs. already covered in §18

Sections 2–9 of the submitted spec (Workspace Information, Members, Invite System, Roles, Dashboard, Settings, Activity Log, Navigation) are **almost entirely already covered by §18's cross-reference**, and almost entirely already built. Only what's actually new or different is called out below; everything else, see §18.3.

| Submitted item | Status |
|---|---|
| Members / Invite System / Roles (Owner, Manager, Member) / Activity Log (§§3–5, 8) | ✅ Already built — identical to §18.3's Module 2–4 and 6 cross-reference. No new information. |
| **Workspace Dashboard** — Total Members, Active Members, Pending Invitations, Upcoming Meetings, Recent Activity (§6) | ⚠️ Partially built, different shape. `/orbit` today shows Total Users, Total Bookings, Outbox Emails, Queue Jobs, Recent Users, Recent Activities — instance-health-oriented, not member/meeting-oriented. "Active Members," "Pending Invitations," and "Upcoming Meetings" as dashboard stat cards are a real, small gap if this direction is ever pursued — but is a Phase-1-compatible addition on its own (doesn't require multi-workspace) if wanted independently. |
| **Booking Defaults at the workspace level** — default duration, buffer, minimum notice, max booking window (§7) | ❌ Not built. New gap not previously noted in §18.4. Every event type sets these individually today (`event_type.bufferBefore/After`, `minimumNotice`, `bookingWindow`); there's no workspace-level default a new event type inherits. Small, Phase-1-compatible addition if wanted — doesn't require multi-workspace either. |
| Sidebar structure (§9 / "Sidebar Structure") | ✅ Already matches — Dashboard / Event Types / Availability / Bookings / Workspace (Members, Invitations, Activity Log, Settings) / Integrations is what's shipped today under `/orbit`, modulo icons. |
| **Create Workspace / Delete Workspace / Workspace Switcher / Multiple Workspaces per User / Unique Workspace Slug** (§1) | ❌ Not built, and **incompatible with the single-workspace architecture as built** — see 20.3. |
| `workspaces`, `workspace_members`, `workspace_invites`, `workspace_roles`, `workspace_settings`, `workspace_activity_logs` tables (Database Tables) | ❌ Not the schema in use. Current schema (§6, §8.1) has no `workspace_id` anywhere — `invitation`, `user.role`, `app_setting` (workspace-wide already, singleton) cover the same ground without a tenancy column, because there's only ever one workspace per instance. |

### 20.3 What adopting §1 of this spec would actually mean

This is the same rebuild already scoped in §19.2, restated against this spec's specific table list:
- Every table in "Database Tables" above implies a `workspace_id` foreign key added to `event_type`, `booking`, `availability_schedule`, `contact`, `connected_calendar`, and everything else currently scoped by `userId` alone (§6's ~15-table list).
- `workspace_members` replaces today's single `user.role` column with a many-to-many join (one person, many workspaces, a different role in each).
- `workspace_roles` as its own table implies configurable/custom roles per workspace, beyond the fixed owner/manager/member set — a further step past even Calendly's own fixed-role model (§2.8's "no custom roles" finding).
- The public booking route (`/{username}/{eventSlug}`) would need workspace-scoped usernames, since a username is currently unique per *instance*, not per *workspace*.
- A "Create Workspace" flow and switcher UI are net-new — nothing today has a concept of "the current workspace" to switch away from.

None of this is a bolt-on to what shipped in Phase 1. It's the Option B rebuild, unchanged in scope from §19.2's estimate. Filed here for reference if this direction is ever deliberately chosen — not scheduled, not started.

---

## References

- Codebase anchors: `lib/auth.ts`, `lib/authz.ts`, `lib/setup.ts`, `lib/email/index.ts`, `lib/audit.ts`, `config/platform.ts`, `db/schema/{auth,platform,enums,index,relations}.ts`, `app/actions/{orbit-users,setup,onboarding}.ts`, `app/(orbit)/orbit/`, `app/(auth)/_components/auth-form.tsx`, `app/(onboarding)/onboarding/`, `middleware.ts`.
- Calendly + comparable-product sources — §15.
- Better Auth organization plugin (evaluated, not adopted) — https://better-auth.com/docs/plugins/organization
