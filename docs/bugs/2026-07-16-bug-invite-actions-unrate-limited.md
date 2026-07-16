# Bug: `inviteMemberAction` and `resendInviteAction` have no rate limiting

**Found:** 2026-07-16, during a full consistency review of `docs/self-hosting/boss-employee-flow.md`'s §10 security checklist — cross-checked every "done" claim against the actual code instead of trusting the checklist as written.

**Where:** `app/actions/members.ts` — `inviteMemberAction` and `resendInviteAction`.

**What's broken:** The security checklist claimed rate-limiting was in scope for the invite flow ("no email-bombing"), but neither action actually called the app's existing `checkRateLimit` helper. A compromised or scripted owner/manager session — or a client-side bug that resubmits the invite form in a loop — could enqueue an unbounded number of invite emails with no server-side backstop. Lower severity than a public unauthenticated endpoint (both actions already require `requireAdmin()`), but still a real gap: authentication proves *who*, not *how many*.

**How it was found:** `grep -n "checkRateLimit" app/actions/members.ts` returned nothing, while the checklist item next to it was still unchecked and explicitly called out as the one item that hadn't actually been built.

**Root cause:** The app already has a Postgres-backed rate limiter (`checkRateLimit`, `lib/api/helpers.ts`) used elsewhere (e.g. `app/api/username-check/route.ts`), but wiring it into the new invite actions was never done when `app/actions/members.ts` was originally written.
