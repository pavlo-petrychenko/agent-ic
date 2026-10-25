# 0023. node-postgres for observability

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

- Drizzle ran on postgres.js (D101). postgres.js has no OpenTelemetry instrumentation and reports no pool statistics. Drizzle's own tracing hook is never enabled. So a trace never shows a query, and nothing shows how busy the pools are.
- The observability work needs one span per query and pool gauges for every role (api, gateway, worker).
- The data access must stay safe behind PgBouncer in transaction mode: no named prepared statements, no session state.
- Repositories use Drizzle's query builder. Only a few raw `execute` calls exist, and production code ignores their results.

## Decision

1. **Drizzle runs on `drizzle-orm/node-postgres` over `pg` 8.x.** `createSqlClient` returns a `pg.Pool` with `max` from `DATABASE_POOL_MAX`, an `application_name` and a 30 second connection timeout. `DatabaseClientService` builds `drizzle({ client: pool })`, ends the pool on shutdown and exposes `poolStats()` (total, idle and waiting clients) for the pool gauges.
2. **Queries get spans from `@opentelemetry/instrumentation-pg`**, configured without parameter values, when the instrumentation work lands.
3. **`application_name` names the process:** `agent-ic-<role>` for the app and system pools, `agent-ic-migrate` for migrations, `agent-ic-test` in the tests. `pg_stat_activity` and the Postgres exporter can then tell the roles apart.
4. **PgBouncer safety stays as before.** `pg` sends unnamed statements unless a query passes a `name`, and no code calls Drizzle's `.prepare()`. The tenant setting is still `set_config('app.workspace_id', …, true)`, so it ends with the transaction.
5. **Type parsing keeps today's results without custom parsers.** Drizzle's node-postgres session passes its own parsers on every query, which return dates, timestamps and intervals as text for Drizzle's column mappers. The `pg` defaults for the other types we use match postgres.js: `numeric` and `int8` stay strings, `json` and `jsonb` are parsed, `vector` stays text for Drizzle's mapper. A pool-level `types` option would be ignored by Drizzle's per-query parsers, and a global `pg.types` change would be hidden state.
6. **Pool events are handled.** A notice on any client is logged at debug level, as before. An error on an idle client is logged at error level, because `pg` crashes the process on an unhandled pool `error` event. The log drops the `client` that `pg-pool` attaches to that error, so a line never carries the connection object and its cancel key.

## Consequences

- Every query can carry a span and the pool can report its gauges, which the observability PRs build on.
- A raw `execute` returns `{ rows }`, not an array. The test inspectors read `rows`.
- `pool.end()` waits for checked-out clients, with no forced timeout as postgres.js had. Nest closes the HTTP server and the workers before the database clients, so nothing should hold a client by then.
- Idle clients close after the `pg` default of 10 seconds, where postgres.js kept them open. Behind PgBouncer a new server connection is cheap.
- PgBouncer behaviour can only be checked on the cluster. It is a check after deploy.

## Alternatives considered

- **Stay on postgres.js and wrap queries in spans by hand:** rejected. Drizzle's tracing hook is dead code, a wrapper would miss raw calls and the migrator, and there would still be no pool statistics.
- **Drizzle's built-in tracing:** rejected. It is not wired to any exporter and gives no pool statistics.
- **`pg-native`:** rejected. It needs libpq in the image and the OpenTelemetry instrumentation targets the JavaScript client.
