# Solution: the owner/manager authorization guard was copy-pasted three times

**Fixed:** 2026-07-15

**Files changed:**
- `lib/roles.ts` (new) — the single source of truth: `isPanelRole(role)` and `canActOnRole(actorRole, targetRole)`, extracted verbatim from the three duplicates (owner is never actionable; a manager can act on a member but never another manager or the owner; only the owner can act on staff).
- `app/actions/orbit-users.ts` — removed its local `isPanelRole`/`canActOn`, now imports `canActOnRole`/`isPanelRole` from `lib/roles` and uses them at every guard site (`recordImpersonationAction`, `toggleUserBanAction`, `deleteUserAction`, `cancelBookingAction`, `deleteEventTypeAction`, `nonPanelIds`).
- `components/orbit/users-table.tsx` — removed its local `isPanelRole`/`canManage`, now imports the same two functions from `lib/roles` for row-level action gating.
- `app/(orbit)/orbit/users/[id]/page.tsx` — replaced the inline `isPanelRole`/`canManage` expressions with calls to the shared `isPanelRole`/`canActOnRole` (renamed the local variable to `isProfilePanelRole` to avoid shadowing the imported function name).

**Why this fixes the root cause:** There is now exactly one implementation of "who can act on whom," imported everywhere it's needed. A future change to the rule can only be applied once — it's structurally impossible for the client-side button gating, the server-side action guard, and the detail-page rendering to disagree with each other again.

**How it was verified:** `tsc --noEmit` clean after the extraction. `lib/roles.test.ts` (new, 8 tests) exercises every combination directly: owner never actionable (not even by another owner), manager can act on member but not on another manager, member-actor edge cases. `pnpm build` confirmed all three call sites still compile and render. Live-tested via the running dev app: signed in as a manager and confirmed the Members page still correctly hides the suspend/delete controls on the owner's row and on other managers' rows, matching the server-side guard.
