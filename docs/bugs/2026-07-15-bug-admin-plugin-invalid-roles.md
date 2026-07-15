# Bug: Better Auth admin plugin rejects the new owner/manager/member role names

**Found:** 2026-07-15, during `pnpm build` while implementing the workspace roles/invite feature (`docs/self-hosting/boss-employee-flow.md`).

**Where:** `lib/auth.ts` — the `admin({ ... })` plugin config passed to `betterAuth(...)`.

**What's broken:** The production build failed outright:

```
[Error [BetterAuthError]: Invalid admin roles: owner, manager. Admin roles must be defined in the 'roles' configuration.]
```

`pnpm dev`, `tsc --noEmit`, and even `pnpm test` all stayed green — only `pnpm build` (which actually initializes the Better Auth plugin) surfaced this, since the admin plugin validates its `adminRoles` option at plugin-init time, not at type-check time.

**How it was found:** Running the mandated `pnpm build` verification pass after wiring `adminRoles: [OWNER_ROLE, MANAGER_ROLE]` into the admin plugin — the build immediately threw during "Collecting page data."

**Root cause:** Better Auth's admin plugin defaults to a single `"admin"` role backed by its own internal access-control `roles` map (keyed `"admin"`/`"user"`, from `better-auth/plugins/admin/access`). Setting `adminRoles` alone tells the plugin *which* role strings count as admin, but the plugin cross-checks that list against `options.roles` (or its own default map if none is supplied) and rejects any name it doesn't recognize. `"owner"` and `"manager"` don't exist in the default map, so the plugin refused to boot.
