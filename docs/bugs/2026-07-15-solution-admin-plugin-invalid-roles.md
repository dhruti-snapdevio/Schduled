# Solution: Better Auth admin plugin rejects the new owner/manager/member role names

**Fixed:** 2026-07-15

**Files changed:**
- `lib/auth.ts` — imported `adminAc`/`userAc` from `better-auth/plugins/admin/access` (the plugin's own pre-built access-control roles) and passed an explicit `roles` map alongside `adminRoles`:
  ```ts
  admin({
    adminRoles: [...PANEL_ROLES],
    roles: {
      [OWNER_ROLE]: adminAc,
      [MANAGER_ROLE]: adminAc,
      [MEMBER_ROLE]: userAc,
    },
    ...
  })
  ```
  Owner and manager both get the plugin's full admin permission set (ban/impersonate/etc. — actual `/orbit` panel access is still gated separately by `PANEL_ROLES` in `lib/authz.ts`, this only controls what the Better Auth plugin itself permits); member gets the plugin's baseline no-permission role.

**Why this fixes the root cause:** The plugin now has an explicit `roles` map whose keys (`owner`, `manager`, `member`) match exactly what `adminRoles` references, so its startup validation (`Object.keys(options.roles).includes(...)`) passes. Using `[...PANEL_ROLES]` instead of a second hardcoded `[OWNER_ROLE, MANAGER_ROLE]` array also means `adminRoles` can never drift out of sync with the `PANEL_ROLES` constant used everywhere else in the authz layer.

**How it was verified:** `pnpm build` — previously failed at "Collecting page data," now completes cleanly with all 66 routes compiled. Followed up with a live end-to-end check: created a real invitation, signed up through it, and confirmed the resulting `manager`-role account could reach `/orbit` and `/orbit/users` (200, not a redirect) — proving the admin plugin actually recognizes the new roles at runtime, not just at boot.
