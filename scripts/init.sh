#!/usr/bin/env sh
set -e

cd /app
node apps/api/dist/db/migrate.js
node apps/api/dist/db/seed.js
