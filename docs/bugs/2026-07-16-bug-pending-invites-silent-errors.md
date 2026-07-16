# Bug: Pending Invites table silently swallows every action error

**Found:** 2026-07-16, during a deeper review pass over `docs/self-hosting/boss-employee-flow.md` specifically hunting for gaps the earlier consistency check hadn't caught — reading every action handler in the invite/members UI rather than re-checking claims already made.

**Where:** `components/orbit/pending-invites-table.tsx` — `handleResend`, `handleRevoke`, and `handleExport`.

**What's broken:** All three handlers call their server action and discard the result entirely if it's an error:

```ts
function handleResend(id: string) {
  startTransition(async () => {
    await resendInviteAction(id);   // the {error} case is never read
  });
}
```

Concretely: if resend hits the rate limit added in `docs/bugs/2026-07-16-*-invite-actions-unrate-limited.md`, or hits the pre-existing "that invite is no longer pending" check, or revoke hits the same, or CSV export hits an unexpected DB error — the owner/manager clicks the button, sees a brief pending state, and then **nothing happens, with zero explanation**. No toast, no inline message. The sibling component `components/orbit/invite-dialog.tsx`, right next to this one, does this correctly (`if ("error" in result) setError(result.error)`, rendered inline) — so the established pattern for this exact situation was available and just wasn't followed here.

**How it was found:** Read every handler in the file end to end rather than assuming symmetry with the already-reviewed `invite-dialog.tsx`.

**Root cause:** The three handlers were written to fire-and-forget the action call, following the visual pattern of `useTransition` for a pending spinner state, without also handling the action's `ActionResult` union (`{error: string} | {ok: true}`) the way the codebase's actions consistently return. This bug predates the rate-limit fix — the "invite no longer pending" error case could already trigger it — but the rate-limit fix made it meaningfully more likely to surface in normal use, since sending several invites in one session is an ordinary admin workflow.
