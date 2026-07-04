#!/bin/sh
set -e

echo "[entrypoint] running database migrations..."
pnpm db:migrate

echo "[entrypoint] starting: $*"
exec "$@"
