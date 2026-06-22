# Schduled

Schduled is a smart scheduling platform for modern professionals. Share a booking link, set your availability, and let invitees pick a time — no back-and-forth.

- Next.js App Router UI
- Postgres and Drizzle ORM
- Better Auth magic-link + Google login
- pg-boss background worker queues
- Durable email outbox via SMTP (nodemailer)
- Orbit admin panel for users, queue state, and email visibility

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm db:local
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`, sign in with a magic link, then promote your user to admin:

```bash
pnpm make:admin you@example.com
```

Without `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`, the worker logs emails locally instead of sending them.

## Structure

- `app/` — public landing, auth, user dashboard, booking pages, Orbit admin, and API routes
- `db/schema/` — all database table definitions
- `lib/auth.ts` — Better Auth configuration (magic link + Google OAuth)
- `lib/email/` — persists outbound email before enqueueing work
- `lib/worker/` — pg-boss queues and job handlers
- `components/` — shared UI kit and scaffold shell

See [docs/commands.md](./docs/commands.md) for the full command list.
