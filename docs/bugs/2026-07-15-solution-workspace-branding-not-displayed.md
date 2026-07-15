# Solution: workspace branding saves correctly but has zero visible effect anywhere

**Fixed:** 2026-07-15

**Files changed:**
- `app/(orbit)/layout.tsx` — now calls `getWorkspaceBranding()` and derives a `workspaceLabel` (the configured name, or `"Admin Panel"` if it still equals the `PRODUCT_NAME` default — i.e. nothing's been customized). Passed into `AdminSidebar` and used directly in the mobile top bar.
- `components/admin/admin-sidebar.tsx` — accepts a new `workspaceName` prop (default `"Admin Panel"`), rendered in place of the previously hardcoded heading; added `truncate` so a long custom name can't break the fixed-width sidebar layout.
- `lib/email/components/invitation.tsx` and `lib/email/templates/invitation.ts` — replaced the hardcoded `productName`/`PRODUCT_NAME` usage with a `workspaceName` prop (still defaults to `PRODUCT_NAME` if not supplied) plus an optional `logoUrl` override, threaded through the email subject, heading, and body copy.
- `app/actions/members.ts` — `sendInviteEmail` now calls `getWorkspaceBranding()` before building the email and passes `workspaceName`/`logoUrl` through to `invitationTemplate`, so the subject line, heading, and logo all reflect the real configured workspace instead of the generic product name.

**Why this fixes the root cause:** The two places most likely to be seen by an owner and by an invitee — the Admin Center they run day-to-day, and the email that represents their workspace to a new hire — now both read from the same `getWorkspaceBranding()` call that the settings page writes to. Deliberately left untouched: the public booking page's "Powered by Schduled" footer, which is software attribution (like "Powered by Calendly") and would be semantically wrong to relabel with the workspace's business name.

**How it was verified:** Live, not just typechecked. Set the workspace name to `"Acme Scheduling Co"` directly in the dev database, signed in as a test account, and confirmed `/orbit` rendered the new name in the sidebar (`grep` on the response HTML, three occurrences). Separately invoked `invitationTemplate` directly via `tsx` with the same branding loaded from the database and confirmed both the plain-text and HTML output said `"You're invited to Acme Scheduling Co"` with no remaining reference to the generic product name. `tsc --noEmit`, `pnpm test` (53/53), and `pnpm build` all clean. Test data cleaned up afterward.
