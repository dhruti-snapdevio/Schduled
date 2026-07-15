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

Not building multi-tenant SaaS: one instance = one company (§8 Option B if that changes).

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

## 9. Docs / MD updates

| File | Change |
|---|---|
| `docs/self-hosting/boss-employee-flow.md` | **This spec** (source of truth for the build). |
| `CLAUDE.md` | Update *"Only one admin…"* → workspace model: "One workspace per instance; roles owner/manager/member; invite-only signup." |
| `docs/self-hosting/configuration.md` | Document `SIGNUP_ENABLED=false` invite-only + the role model + `ACTIVITY_LOG_RETENTION_DAYS`. |
| `docs/self-hosting/installation.md` | Note: first account = owner; invite teammates from `/orbit → Members`. |

---

## 10. Security checklist (must-do in P1)

- [ ] **Query-scoping audit** — every read/write in `app/(app)/` & `app/actions/` filters by `session.user.id`/`hostUserId`. A miss = cross-member leak. #1 risk.
- [ ] Admin dashboard is **intentionally workspace-wide** (`app/(orbit)/orbit/page.tsx`) — keep panel-role-only; never reuse those unscoped queries on member screens.
- [ ] Invite tokens signed, single-use, time-boxed; invalid token leaks nothing about account existence.
- [ ] Role-escalation guards: a manager can't grant `owner`, can't edit the owner, can't self-promote; invites carry `member`/`manager` only.
- [ ] Last-owner + self-lockout protection; ownership transfer atomic.
- [ ] Rate-limit `inviteMemberAction` (reuse `lib/auth.ts:47` rateLimit pattern) — no email-bombing.
- [ ] `invite` (+ orbit/login/api/settings/setup) reserved as usernames.
- [ ] Ban re-check already enforced mid-session (`lib/authz.ts:19-28`).

---

## 11. ✅ PHASE 1 checklist (the whole workspace layer) — ~2–3 weeks

- [ ] **Roles**: M1 config + M2 authz + M12 nav + M4 setup owner.
- [ ] **DB**: N1 table + M5/M6 wiring + M7 enum + N12 migration (incl. role data migration).
- [ ] **Invite core**: N2 helpers + M3 auth hooks + N3 actions.
- [ ] **Invite UX**: N6/N7 accept page+form + N8 invite dialog + N9 pending table + M8 users page.
- [ ] **Members mgmt**: M9/M10/M11 role-aware guards + CSV export.
- [ ] **Email**: N4/N5 invite template.
- [ ] **Workspace settings**: N10 branding + M14 settings wiring.
- [ ] **Activity log & compliance**: M15 CSV+retention + N11 data-deletion.
- [ ] **Guards/reserved**: M13 usernames + M17 middleware.
- [ ] **Docs**: §9.
- [ ] **Security checklist** (§10) — especially the query-scoping audit.
- [ ] `tsc --noEmit` clean (CLAUDE.md rule); run the `verify` skill on invite→accept→book.

---

## 12. 🔜 COMING SOON (later phases)

- **P2 — Standardization:** Managed Events (event-type templates: create/lock/assign/sync); bulk invite (paste/CSV).
- **P3 — Org structure & automation:** Groups + `group`/`group_member` tables + **Group Admin** & **Team Manager** roles; Managed Workflows; granular permissions.
- **Later — Scheduling depth:** team scheduling (round-robin/collective — needs multi-host availability merge, the biggest item); routing forms; meeting polls; one-off meetings; analytics/reporting; MS Teams + Outlook, Stripe/PayPal, Salesforce/HubSpot, Zapier.
- **Enterprise (on demand):** SSO/SAML (Better Auth SSO plugin), SCIM, domain control.

Open-source note: none of this is paywalled or seat-gated — phasing is build order, not tiers.

---

## 13. Open questions for the PM

1. Manager role-change authority — owner-only (recommended) or can Managers reassign Member↔Manager?
2. Infra config — owner-only (recommended) or manager-manageable?
3. Activity-log retention default — unlimited or e.g. 180 days with override?
4. Managed Events (P2) priority vs personal event types only?
5. Groups (P3) — realistic member count? (pays off past ~10–15)
6. Multiple workspaces per instance? If yes → Option B (§7).
7. Ownership transfer in P1, or fixed single owner for now?

---

## 14. Carried-over review notes (still valid)

**Theme:** `ThemeProvider` mounted once (`app/layout.tsx:37-41`), shared via
`next-themes`. `appearance-card.tsx` copy wrongly implies orbit-only scope — fix
wording (M16). Public booking follows theme; landing is intentionally always-dark.

**Landing copy** (verified vs implemented features): remove "Microsoft Teams"
(`page.tsx:92` — not selectable), remove "Analytics +28%" (`:594-602`), replace
"No credit card" ×3 (`:221,271-275,1126`) with "Open source / Self-hosted / Your
data stays yours", "Start for free"→"Sign in" (`:261,940`), fix the two
SaaS-framed FAQs (`:102,106`). Keep "Team · 4 active members" (`:584-591`).
*(Optional cleanup — not blocking the invite flow.)*

**Subscribers/newsletter:** if not needed on a private instance, remove
`/orbit/subscribers`, its sidebar entry, the footer form, and
`app/api/newsletter/route.ts`. *(Optional.)*

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
| 16 | — | Managed Events | templates + lock/assign/sync | P2 | ⬜ |
| 17 | — | Groups | `group`/`group_member` + Group Admin/Team Manager | P3 | ⬜ |
| 18 | — | Scheduling/enterprise | round-robin/routing/polls/analytics; SSO/SCIM | later | ⬜ |

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

## References

- Codebase anchors: `lib/auth.ts`, `lib/authz.ts`, `lib/setup.ts`, `lib/email/index.ts`, `lib/audit.ts`, `config/platform.ts`, `db/schema/{auth,platform,enums,index,relations}.ts`, `app/actions/{orbit-users,setup,onboarding}.ts`, `app/(orbit)/orbit/`, `app/(auth)/_components/auth-form.tsx`, `app/(onboarding)/onboarding/`, `middleware.ts`.
- Calendly + comparable-product sources — §15.
- Better Auth organization plugin (evaluated, not adopted) — https://better-auth.com/docs/plugins/organization
