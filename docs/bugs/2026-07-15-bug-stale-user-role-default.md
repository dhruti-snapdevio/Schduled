# Bug: `user.role` column still defaults to the old value `'user'`

**Found:** 2026-07-15, while live-testing the invite/role flow end-to-end after implementing the owner/manager/member model.

**Where:** `db/schema/auth.ts` — the `user` table's `role` column definition.

**What's broken:** The role model was migrated from two roles (`admin`/`user`) to three (`owner`/`manager`/`member`) — including a data migration that updated every *existing* row — but the column's own `DEFAULT` constraint was left unchanged at `'user'`. Any account created going forward without an invitation match (i.e. via open public sign-up when `SIGNUP_ENABLED=true`, a mode the app explicitly documents and supports) would silently land on `role = 'user'`, a value that isn't one of the three valid roles at all. It isn't a panel role, so `requireAdmin()` correctly denies it access — but the account is permanently stuck with a role string that matches nothing in `PANEL_ROLES`, `OWNER_ROLE`, `MANAGER_ROLE`, or `MEMBER_ROLE`, and would display as the literal string `"user"` anywhere the UI shows a role badge.

**How it was found:** Reviewing the invite acceptance flow for edge cases — specifically, "what role does someone get if they sign up *without* an invitation" — surfaced that the answer depended on a column default nobody had actually updated as part of the role-model migration.

**Root cause:** `db/schema/auth.ts:9` was never touched by the `admin`/`manager`/`owner` role-model work — the data migration (`0017_migrate_admin_user_roles.sql`) updated existing *rows*, but nothing updated the column's `DEFAULT` clause, which only takes effect on *future* inserts.
