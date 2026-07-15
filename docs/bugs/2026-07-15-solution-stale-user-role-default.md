# Solution: `user.role` column still defaults to the old value `'user'`

**Fixed:** 2026-07-15

**Files changed:**
- `db/schema/auth.ts` — changed `role: text("role").notNull().default("user")` to `.default("member")`.
- `db/migrations/0018_sturdy_puck.sql` (new, via `drizzle-kit generate`) — a single-statement migration: `ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'member';`. No data backfill needed — the earlier `0017` migration already handled every existing row; this only changes the default applied to rows inserted from now on.

**Why this fixes the root cause:** Any account created without a matching invitation (open public sign-up, or any other path that relies on the column default rather than an explicit `role` value) now lands on `'member'` — a real, valid role recognized everywhere else in the authz layer — instead of the orphaned `'user'` string.

**How it was verified:** `pnpm db:generate` confirmed the migration contained exactly the one expected `ALTER COLUMN` statement (no unrelated schema drift). `pnpm db:migrate` applied it against the real dev database; confirmed via `\d user` in `psql` that the column default is now `'member'::text`. `tsc --noEmit` and `pnpm build` both stayed clean (schema-only change, no code consumes the literal default value directly).
