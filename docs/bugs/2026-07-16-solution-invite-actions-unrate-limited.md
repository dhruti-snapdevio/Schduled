# Solution: `inviteMemberAction` and `resendInviteAction` have no rate limiting

**Fixed:** 2026-07-16

**Files changed:**
- `app/actions/members.ts` — imported `checkRateLimit` from `@/lib/api/helpers`. Added a small `checkInviteRateLimit(actorId, action)` helper and two constants (`INVITE_RATE_LIMIT = 20`, `INVITE_RATE_WINDOW_MS = 10 * 60 * 1000`). Both `inviteMemberAction` and `resendInviteAction` now call it immediately after `requireAdmin()` and return a clean `{ error: "Too many invites sent recently..." }` result if exceeded, matching the existing `ActionResult` error shape used throughout the file.
- Keyed **per-actor** (`members:invite:<userId>` / `members:resend:<userId>`), not per-IP — unlike the public, unauthenticated endpoints that use `rateLimitKey(route, request)` for IP-based keying, these actions are already behind `requireAdmin()`, so the caller's identity is already known and is the more meaningful key (an IP-based key would let a shared-IP office block a legitimate second admin, or let a single admin bypass the limit by switching networks).

**Why this fixes the root cause:** Reuses the same Postgres-backed, cross-replica-safe limiter already proven correct by `lib/api/rate-limit.test.ts`, rather than inventing a new mechanism. 20 sends per 10 minutes is generous enough for a real bulk-invite session (inviting a team of a dozen people) while bounding a runaway loop, script, or compromised session to a small, auditable burst instead of an unbounded one.

**How it was verified:** Live against the real database, not just typechecked — wrote a throwaway script exercising `checkRateLimit` with the exact same key pattern, limit, and window now wired into the actions: the first 20 calls all returned `true` (allowed), the 21st and 22nd both returned `false` (blocked). Cleared the test rows from `rate_limit_bucket` afterward. `tsc --noEmit` clean, `pnpm test` 53/53 (no existing tests touch this code path, so no regressions expected or found), `pnpm build` clean.
