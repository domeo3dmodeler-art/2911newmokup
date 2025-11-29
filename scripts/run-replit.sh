#!/usr/bin/env bash
set -euo pipefail

cd app

# зависимости
npm ci || npm install

# prisma
npx prisma generate
npx prisma migrate deploy

# сидинг каталога (если есть БД и SQL)
if [ -n "${DATABASE_URL:-}" ] && [ -f sql/dev_bootstrap_doors.sql ]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/dev_bootstrap_doors.sql || true
fi

# dev-сервер
npm run dev:replit
