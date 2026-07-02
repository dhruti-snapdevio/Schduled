FROM node:22-bookworm-slim AS deps

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Full install (not --prod) — the build needs devDependencies (typescript,
# tailwind, biome types, etc.)
RUN pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable && pnpm build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Optional: docker build --build-arg GIT_SHA=$(git rev-parse --short HEAD)
# Surfaced at /api/version. Falls back to "unknown" if not passed.
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Caps V8's heap so an OOM shows up as a clean, restartable crash instead of
# the container being silently killed by the host's OOM killer. Raise this if
# your container's memory limit is higher than the default assumption below.
ENV NODE_OPTIONS=--max-old-space-size=768

RUN corepack enable \
  && groupadd --system --gid 1001 app \
  && useradd --system --uid 1001 --gid app app

# drizzle-kit (for migrate-on-boot, see docker/entrypoint.sh) lives in
# "dependencies", not devDependencies, specifically so this --prod install
# includes it.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml drizzle.config.ts ./
RUN pnpm install --frozen-lockfile --prod

# Next.js standalone output: a minimal, self-traced server — copied on top
# of the full node_modules above (traded some image size for drizzle-kit
# being available at runtime; see SELF-HOSTING.md Part 4 §C).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY db ./db
COPY docker/entrypoint.sh ./docker/entrypoint.sh

RUN chown -R app:app /app && chmod +x ./docker/entrypoint.sh

USER app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "server.js"]
