#!/bin/sh
set -eu

role="${1:-app_owner}"

case "$role" in
  app_owner) password="$APP_OWNER_PASSWORD" ;;
  app) password="$APP_PASSWORD" ;;
  app_system) password="$APP_SYSTEM_PASSWORD" ;;
  *)
    echo "psql: role must be app_owner, app or app_system" >&2
    exit 1
    ;;
esac

exec docker compose exec -e "PGPASSWORD=${password}" postgres \
  psql -h postgres -U "$role" -d "$DATABASE_NAME"
