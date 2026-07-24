# Solution: `migrate`/`worker` containers crash with `EACCES` trying to write Corepack's cache

**Date:** 2026-07-24
**Pairs with:** [2026-07-24-bug-migrate-worker-corepack-eacces.md](./2026-07-24-bug-migrate-worker-corepack-eacces.md)

## What changed
Both runtime entry points now call the real binary directly instead of going
through `pnpm`:
- [Dockerfile.worker:42-49](../../Dockerfile.worker#L42-L49) — `CMD ["pnpm",
  "worker:start"]` → `CMD ["/app/node_modules/.bin/tsx", "scripts/worker.ts"]`.
  Also dropped `RUN corepack enable` and `ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0`
  from the `runner` stage — Corepack is no longer invoked there at all, so
  registering its shims/config was pure dead weight.
- [docker-compose.yml:22-31](../../docker-compose.yml#L22-L31) and
  [docker-compose.external-db.yml:16-24](../../docker-compose.external-db.yml#L16-L24)
  — the `migrate` service's `command: ["pnpm", "db:migrate"]` → `command:
  ["/app/node_modules/.bin/drizzle-kit", "migrate",
  "--config=drizzle.config.ts"]` — the exact same command `pnpm db:migrate`
  shells out to, just invoked without the `pnpm` indirection.

`tsx` and `drizzle-kit` are both regular `dependencies` (not `devDependencies`)
in `package.json`, so `Dockerfile.worker`'s `--prod` install already puts
their `.bin` symlinks in `node_modules/.bin` — no new dependency, no extra
image layer.

Considered and rejected:
- **Prepare pnpm during build + fix permissions on `$COREPACK_HOME`** — would
  work, but keeps an unnecessary indirection (pnpm→shim→corepack→resolve→exec
  node) for what's ultimately a single, fixed command per container. More
  moving parts for no runtime benefit.
- **Install pnpm as a plain global binary (bypassing Corepack's shim
  entirely)** — avoids the lazy-fetch behavior, but still keeps pnpm on the
  image and in the invocation path for zero benefit over calling the
  script's actual command directly.
- **`chown`/`chmod` a writable home for `app`** — would silence the specific
  `EACCES`, but doesn't address the underlying issue: Corepack would still
  attempt a version check/potential network fetch on every container start,
  which is slower, non-deterministic, and dependent on registry access the
  container may not have in a locked-down deployment. Explicitly asked not to
  reach for this, and it's not the right fix architecturally regardless.

## Why this fixes the root cause
`migrate` and `worker` each only ever need to run one fixed, known command.
Calling that command's real binary directly removes `pnpm`/Corepack from the
runtime path entirely — no per-user package-manager resolution, no
`$COREPACK_HOME` cache directory, no network fetch, nothing that can depend on
which user is running or what's writable. This matches Docker best practice
for a production image (invoke what you need directly; don't carry a
build-tool indirection into the running container) and is the same pattern
Kanbanica's `Dockerfile.worker` already uses successfully.

## How verified
- `npx tsc --noEmit` — clean.
- Both compose files parse as valid YAML; `migrate`'s `command` was confirmed
  via `yaml.safe_load` to resolve to the exact intended argv.
- Docker itself was unavailable in this environment, so the fix could not be
  re-verified against a live `docker compose up -d --build` here — same
  standing caveat as the other 2026-07-24 Docker bug docs. The self-hoster
  who reported this should retry the build/up to confirm `migrate` and
  `worker` both start cleanly.
