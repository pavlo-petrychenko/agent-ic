#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_password="$APP_OWNER_PASSWORD" \
  -v app_password="$APP_PASSWORD" \
  -v system_password="$APP_SYSTEM_PASSWORD" \
  -v langfuse_password="$LANGFUSE_DB_PASSWORD" \
  -v database="$APP_DATABASE" <<'SQL'
CREATE ROLE app_owner LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD :'owner_password';
CREATE ROLE app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD :'app_password';
CREATE ROLE app_system LOGIN NOSUPERUSER BYPASSRLS PASSWORD :'system_password';
CREATE ROLE langfuse LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD :'langfuse_password';

CREATE DATABASE :"database" OWNER app_owner;
CREATE DATABASE langfuse OWNER langfuse;

REVOKE ALL ON DATABASE :"database" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"database" TO app, app_system;

\connect :"database"

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SQL
