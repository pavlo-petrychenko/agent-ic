#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v reader_password="$GRAFANA_READER_PASSWORD" \
  -v database="$APP_DATABASE" <<'SQL'
CREATE ROLE grafana_reader LOGIN NOSUPERUSER BYPASSRLS PASSWORD :'reader_password';
GRANT pg_read_all_data TO grafana_reader;
GRANT CONNECT ON DATABASE :"database" TO grafana_reader;
ALTER ROLE grafana_reader SET default_transaction_read_only = on;
SQL
