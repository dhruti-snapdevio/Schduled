# Bug: the owner/manager authorization guard was copy-pasted three times

**Found:** 2026-07-15, while setting up test coverage for the new workspace roles flow.

**Where:**
- `app/actions/orbit-users.ts` — private `isPanelRole()` + `canActOn()` functions guarding suspend/delete/impersonate/cancel-booking/delete-event-type.
- `components/orbit/users-table.tsx` — a second, independently-written `isPanelRole()` + `canManage()` pair, deciding which row-level action buttons to render.
- `app/(orbit)/orbit/users/[id]/page.tsx` — the same rule written a third time, inline as `isOwner`/`isPanelRole`/`canManage` const expressions.

**What's broken:** This is the authorization boundary that decides whether the owner can never be suspended/deleted/impersonated and whether a manager can act on a member but never on another manager (`docs/self-hosting/boss-employee-flow.md` §4.2). All three copies were functionally identical *at the time*, but nothing enforced that they'd stay that way — a future fix applied to one copy (e.g. loosening a rule, fixing an edge case) would silently not apply to the other two, producing a client UI that offers an action the server then rejects, or worse, a server guard that's weaker than the other two without anyone noticing. This is exactly the shape of bug that doesn't show up in testing until the three copies have already drifted.

**How it was found:** While writing `lib/roles.test.ts`, tracing every call site of the authorization check to decide what to test surfaced that there wasn't one function to test — there were three.

**Root cause:** The guard logic was written inline at each of the three places it was needed as the invite/roles feature was built, rather than being factored into a shared module from the start.
