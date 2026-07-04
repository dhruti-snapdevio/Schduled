# Installation Guide

Two ways to run Schduled on your own infrastructure: **Docker Compose**
(recommended) or **manual/Node**. Both are covered below. For every
environment variable referenced here, see [`ENVIRONMENT.md`](../../ENVIRONMENT.md).

## Before you start

**A note on the data model:** Schduled today is **single-user-per-account** —
there's no team/workspace concept yet (tracked as a possible future Phase 5
in `SELF-HOSTING.md`, not started). Each person who signs in gets their own
event types, availability, and bookings; there's no shared team calendar or
multi-user workspace. One instance can host multiple independent users (each
with their own booking page), but they don't share data with each other
beyond what any user could already see (e.g. contacts they've added).
Admins (via the Orbit panel) can see all users, but that's an
administration view, not a shared workspace.

### Prerequisites

- **Docker path:** Docker 24+ and Docker Compose v2.
- **Manual path:** Node.js 22+, pnpm (`corepack enable` installs the pinned
  version automatically), PostgreSQL 15 or 16.
- **Both paths, for production:** a domain name and an HTTPS reverse proxy
  (Caddy, Traefik, or nginx) in front of the app — Google/Zoom OAuth
  callbacks require a real `https://` URL, and `NEXT_PUBLIC_APP_URL` should
  reflect it (see [Configuration](./configuration.md)).

## Path A — Docker Compose (recommended)

```bash
git clone <your-repo-url> schduled
cd schduled
cp .env.example .env
```

Edit `.env`:
```env
# Required to boot
DATABASE_URL=postgresql://schduled:strongpass@postgres:5432/schduled
APP_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://schedule.example.com

# Must match DATABASE_URL above — docker compose uses these to create the
# Postgres container's initial user/db
POSTGRES_USER=schduled
POSTGRES_PASSWORD=strongpass
POSTGRES_DB=schduled

# Recommended for self-hosting — see the "first login" note below
NEXT_PUBLIC_PASSWORD_AUTH_ENABLED=true
SIGNUP_ENABLED=false
INITIAL_ADMIN_EMAIL=you@example.com
```

Start the stack:
```bash
docker compose up -d
docker compose logs -f web worker   # watch until both say "ready"/"started"
curl http://localhost:3000/api/health   # expect {"status":"ok"}
```

Migrations run automatically on boot (`docker/entrypoint.sh` runs
`pnpm db:migrate` before starting the server) — no manual migration step.

Open `NEXT_PUBLIC_APP_URL` in a browser and sign up with the email you set
as `INITIAL_ADMIN_EMAIL` — that account is automatically promoted to admin.

## Path B — Manual / Node

```bash
git clone <your-repo-url> schduled
cd schduled
corepack enable
pnpm install
```

Provision a database (or use a managed Postgres):
```sql
CREATE USER schduled WITH PASSWORD 'strongpass';
CREATE DATABASE schduled OWNER schduled;
```

Configure and migrate:
```bash
cp .env.example .env
# edit .env — same variables as the Docker path above, but DATABASE_URL's
# host is wherever your Postgres actually is (often "localhost")
pnpm db:migrate
pnpm build
```

Run **both** processes — the web server and the background worker are
separate; both must be running for the app to fully work (emails,
reminders, and calendar sync happen in the worker):
```bash
pnpm start &
pnpm worker:start &
```

For production, run these under a process manager instead of background
shell jobs — see the systemd example below.

### systemd units (manual path, production)

```ini
# /etc/systemd/system/schduled-web.service
[Unit]
Description=Schduled web
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/schduled
EnvironmentFile=/opt/schduled/.env
ExecStart=/usr/bin/pnpm start
Restart=always
User=schduled

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/schduled-worker.service
[Unit]
Description=Schduled background worker
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/schduled
EnvironmentFile=/opt/schduled/.env
ExecStart=/usr/bin/pnpm worker:start
Restart=always
User=schduled

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now schduled-web schduled-worker
```

Put your reverse proxy in front of `127.0.0.1:3000` for TLS termination.

## First login — read this before you deploy

If you deploy with **no SMTP and no Google configured**, and leave
`NEXT_PUBLIC_PASSWORD_AUTH_ENABLED` at its default (`false`), the *only*
sign-in path is a magic link — which gets logged to the server console
instead of emailed anywhere. That's not a bug, but it's an easy way to lock
yourself out on a fresh deploy.

**Recommended:** set these three together, from the start:
```env
NEXT_PUBLIC_PASSWORD_AUTH_ENABLED=true
SIGNUP_ENABLED=false
INITIAL_ADMIN_EMAIL=you@example.com
```
This guarantees you can always sign in with a password, that the
`INITIAL_ADMIN_EMAIL` account is exempt from the signup gate (so it always
gets through, even with signup closed), and that nobody else can create an
account. See `ENVIRONMENT.md` §3 for the full explanation and a live-tested
walkthrough of exactly this configuration.

## Post-install checklist

- [ ] `curl <your-url>/api/health` returns `{"status":"ok"}`
- [ ] You can sign in with the `INITIAL_ADMIN_EMAIL` account
- [ ] The Orbit admin panel is reachable and shows your admin account
- [ ] `SIGNUP_ENABLED=false` is set (or you've deliberately chosen open signup)
- [ ] The worker is running — a test booking sends a confirmation
      (or logs one to the console if SMTP isn't configured)
- [ ] Backups are scheduled — see [Backup](./backup.md)
- [ ] If using Google/Zoom, redirect URIs match `NEXT_PUBLIC_APP_URL` exactly
      — see [Integrations](./integrations.md)

## Next steps

- [Docker Guide](./docker.md) — image details, volumes, healthchecks, updating
- [Configuration](./configuration.md) — every env var, minimal vs full setup
- [Integrations](./integrations.md) — Google Calendar/Meet, Zoom, SMTP
- [Backup](./backup.md) and [Restore](./restore.md) — before you need them
- [Upgrade](./upgrade.md) — how to update safely later
