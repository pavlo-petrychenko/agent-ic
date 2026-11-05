# 001 Run and debug locally

[Back to the docs](../README.md)

## What it is

The whole stack runs in Docker on your machine. One command starts it. This page shows how to start it, where to look when something is wrong, and how to open the database.

You install Docker Desktop and mise by hand. [README.md](../../README.md) has the exact steps for macOS, Linux and Windows.

## Why we have it

You should see a change working before you open a pull request. The stack has the same parts as production: the web app, the three backend roles, Postgres and Redis. Email never leaves your machine, so you can try sign-up safely.

## How it works

```
browser --https--> traefik --/api-------------> api      (GraphQL, /api/auth)
                           --/v1, /webhooks---> gateway  (channel webhooks)
                           --everything else--> web      (Vite dev server)
                   worker (no public route)
api, gateway, worker --> postgres, redis
mailpit catches email; minio is S3
```

Backend and web reload when you save a file. After you add files, the web app may show an old version: run `mise run restart web`.

## Start

Once, after cloning: `mise run setup`. Every day, after `git checkout` of any branch and after `mise run clean`: `mise run start`. It recreates a missing certificate, then compares a fingerprint of the commit, the lockfile, the GraphQL files, the routes, the migrations and the volumes with the last start. When something changed, it installs dependencies, regenerates code, applies migrations and restarts `web`, `api`, `worker` and `gateway`. When nothing changed, it only restarts a node service that is unhealthy. Then it starts the default services and follows the logs. Press Ctrl+C to stop following; the stack keeps running.

`start` never seeds. After `mise run clean` the database is empty: run `mise run db:seed` for the seed data. `setup` is still needed once per machine: it trusts the certificate authority, edits the hosts file, chooses free ports and installs the git hooks.

| Command                  | What it does                                                 |
| ------------------------ | ------------------------------------------------------------ |
| `mise run start:obs`     | `start`, plus metrics, logs and traces (see Observability)   |
| `mise run status`        | shows which services run and whether they are healthy        |
| `mise run logs [svc]`    | follows the logs of everything, or of one service (`api`)    |
| `mise run restart <svc>` | restarts one service                                         |
| `mise run stop`          | stops the stack                                              |
| `mise run urls`          | prints the URL of every service                              |
| `mise run hosts`         | adds the local hostnames to the hosts file                   |
| `mise run shell <svc>`   | opens a shell inside a service                               |
| `mise run codegen`       | regenerates GraphQL types and the route tree                 |
| `mise run db:migrate`    | applies new migrations                                       |
| `mise run db:reset`      | deletes the local database, then migrates and seeds it again |
| `mise run check`         | lint, format, comments, structure, boundaries and types      |
| `mise run test`          | all tests                                                    |

pnpm scripts run through mise, so the right Node and pnpm are used: `mise exec -- pnpm <script>`. On Windows without mise, run `.\tools\windows\setup.ps1` once and use `pnpm stack <command>` instead of `mise run <command>`; WSL2 works like macOS. The root [README.md](../../README.md) explains both.

## URLs

| URL                                           | What                                          |
| --------------------------------------------- | --------------------------------------------- |
| https://local.agent-ic.pavlop.dev             | the web app                                   |
| https://local.agent-ic.pavlop.dev/api/graphql | GraphQL                                       |
| https://mail.local.agent-ic.pavlop.dev        | Mailpit: every email the app sends lands here |
| https://queues.local.agent-ic.pavlop.dev      | the queue board (Bull Board)                  |
| https://grafana.local.agent-ic.pavlop.dev     | Grafana, only after `mise run start:obs`      |
| https://prometheus.local.agent-ic.pavlop.dev  | Prometheus, only after `mise run start:obs`   |

A new hostname needs a hosts entry: after pulling a change that adds one, run `mise run hosts` once (it asks for your password). `mise run setup` does the same.

The URLs need a port only when `TRAEFIK_HTTPS_PORT` in `.env` is not `443`, for example `https://local.agent-ic.pavlop.dev:8443`. Setup moves it when `443` is busy; `mise run start` prints the real URLs once the stack is up, and `mise run urls` prints them again.

## Emails

1. Sign up in the web app.
2. Open Mailpit and click the confirmation email.
3. Open the link in the same browser. The confirmation only works in the browser that signed up.

Password reset emails land in Mailpit too.

## Logs

Run `mise run logs api` or `mise run logs worker`. The backend writes one JSON line per log entry (pino). Authorization headers, cookies, the Telegram secret header and secret query parameters (`token`, `secret`, `code` and similar) show as `[redacted]`. An error is logged with its type, message, stack and code only, never with the request or response it carried. With `mise run start:obs` the same lines also land in Loki, see Observability.

For more detail, set `LOG_LEVEL=debug` in `.env`, then run `mise run start api`. `start` recreates the container with the new value; `restart` keeps the old one. In code, use the Nest `Logger`, never `console.*`.

## When a request fails

1. Open the network tab and find the `graphql` request.
2. A GraphQL error has `extensions` with `code`, `reason`, `traceId` and, for bad input, `fields`. Find the `reason` in [errors.constants.ts](../../packages/contracts/src/errors/errors.constants.ts), then its class in `apps/backend/src/modules/*/errors/`.
3. `FORBIDDEN` with `WORKSPACE_ACCESS_DENIED`: no workspace on the request, or you are not a member. Check the `x-workspace-id` header. `PERMISSION_DENIED`: your role is not allowed by `PERMISSION_MATRIX`.
4. `INTERNAL`: an unexpected error. The web app shows the `traceId`; find the stack trace in `mise run logs api`.
5. `UNAUTHENTICATED`: the access token expired. The web app refreshes it once and repeats the request. If that fails too, log in again.

## Observability

The default stack keeps tracing off and ships no metrics or logs, to save memory. `mise run start:obs` is `mise run start` plus a collection stack, and it switches tracing on in `api`, `gateway` and `worker`:

```
api, gateway, worker --OTLP traces--> otel-collector --> tempo
all containers --stdout--> alloy (Docker socket) --> loki
prometheus --scrapes /metrics--> api, gateway, worker, traefik, the postgres and redis exporters, silo, tempo, loki, alloy, grafana, collector
tempo --span metrics, service graph--> prometheus
grafana reads prometheus, loki and tempo
```

| Service             | What it does                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `prometheus`        | scrapes every service every 15 s, keeps 72 h or 1 GB; targets carry `namespace="local"`      |
| `loki`              | stores logs; labels `service`, `level`, `namespace`, structured metadata `traceId`, `spanId` |
| `alloy`             | tails the stdout of every container of this Compose project and pushes it to Loki            |
| `tempo`             | stores traces and turns them into span metrics and a service graph                           |
| `otel-collector`    | receives OTLP from the backend, removes prompts, responses and bot tokens, forwards to Tempo |
| `grafana`           | https://grafana.local.agent-ic.pavlop.dev, user `admin`, password `GRAFANA_ADMIN_PASSWORD`   |
| `redis-exporter`    | Redis metrics for Prometheus                                                                 |
| `postgres-exporter` | Postgres metrics for Prometheus (as the superuser, locally only)                             |

Grafana comes with three data sources (Prometheus, Loki, Tempo) and the dashboards of `deploy/helm/agent-ic/dashboards`, the same files the Helm chart ships to production. In Grafana:

1. Explore, Loki: `{service="worker", level="error"}`. `service` is the Compose service, `level` is `trace`, `debug`, `info`, `warn`, `error`, `fatal` or `unknown`. A log line with a `traceId` has a link that opens the trace.
2. Explore, Tempo: search by service name (`api`, `gateway`, `worker`). A GraphQL request shows its HTTP span, the GraphQL operation and its top-level fields, and every `pg` query and Redis call inside it; each `fetch` (an LLM call, Telegram, Resend) is a span too. A job is part of the trace of the request that added it: the BullMQ producer span under the request, the worker's consumer span under it, and for a run job the run, its steps and their LLM calls below that. Search by the `trace_id` saved on a run to open it. Scheduled jobs and BullMQ polling start no traces. A span has a link to the logs of its service in the same time window.
3. Dashboards, folder `agent-ic`:
   - **overview**: request, job, run and LLM health at a glance, then CPU, memory and restarts;
   - **queues and workers**: waiting jobs, jobs by state, the outbox, worker load;
   - **HTTP and GraphQL**: rate, 5xx ratio and p95 per role and route, GraphQL operations per root field, rate limit rejections;
   - **jobs and runs**: job throughput, failures and duration, runs and steps, LLM calls, channel messages, e-mail and sign-in;
   - **database**: pool connections per role, `pg` query rate and p95 per statement from the span metrics.

   Panels that need `kube-state-metrics` (ready replicas, container restarts, worker replicas) stay empty locally. The latency panels show exemplar dots that open the trace.

The mode is stored in `.dev/stack.mode`. `start:obs` writes `observability`; `mise run start` writes `lean`, removes the observability containers (their data volumes stay) and recreates `api`, `gateway` and `worker` with tracing off. `mise run start <svc>` and `mise run add <svc>` keep the current mode, so `mise run start api` after `start:obs` does not switch tracing off. The tracing switch itself is [compose.observability.yaml](../../compose.observability.yaml), which `tools/dev` adds to every Compose call while the mode is `observability`. `.env` keeps `OTEL_SDK_DISABLED=true`.

Every log line carries a `traceId`: the id of the active span when tracing is on, else the request id (for a job, the id saved in its envelope), so scheduled jobs are searchable too. With tracing on it also carries the `spanId`. Lines written while a workspace is known carry `workspaceId`, and lines written during a run carry `runId` and `conversationId`. In Grafana, `{service="worker"} | json | runId="…"` returns one run's lines. Alloy reads the Docker socket, which is root-equivalent access on your machine; that is fine for a dev machine.

### Metrics

Every role serves `/metrics` in the OpenMetrics format, and Prometheus scrapes it every 15 s. The platform metrics (D279):

| Metric                                                                                  | Role           | Labels                          |
| --------------------------------------------------------------------------------------- | -------------- | ------------------------------- |
| `http_server_requests_total`, `http_server_request_duration_seconds`                    | every role     | `method`, `route`, `status_class` |
| `graphql_operations_total`, `graphql_operation_duration_seconds`, `graphql_ws_connections` | `api`       | `type`, `root_field`, `outcome` |
| `jobs_processed_total`, `job_duration_seconds`, `job_wait_seconds`, `jobs_active`       | `worker`       | `queue`, `job_name`, `outcome`  |
| `queue_jobs`                                                                            | `api`          | `queue`, `state`                |
| `outbox_pending_messages`, `outbox_oldest_message_age_seconds`, `outbox_swept_messages_total` | `worker` | none                            |
| `db_pool_connections`                                                                   | every role     | `pool`, `state`                 |
| `cache_requests_total`                                                                  | every role     | `entry`, `result`               |
| `rate_limit_rejections_total`                                                           | every role     | `policy`                        |

The domain metrics (D280):

| Metric                                                                      | Role                | Labels                      |
| --------------------------------------------------------------------------- | ------------------- | --------------------------- |
| `runs_created_total`                                                        | `worker`            | `trigger`, `mode`           |
| `runs_finished_total`, `run_duration_seconds`                               | `worker`            | `mode`, `status`            |
| `run_queue_wait_seconds`                                                    | `worker`            | `mode`                      |
| `run_steps_total`, `run_step_duration_seconds`                              | `worker`            | `node_type`, `status`       |
| `schedule_sweeps_total`, `schedule_ticks_missed_total`, `schedule_tick_lag_seconds` | `worker`    | none                        |
| `schedule_ticks_total`, `schedule_matches_total`                            | `worker`            | `outcome`                   |
| `channel_messages_received_total`                                           | `api`, `gateway`    | `channel_type`, `outcome`   |
| `channel_messages_sent_total`                                               | `worker`            | `channel_type`, `outcome`   |
| `email_sends_total`                                                         | `worker`            | `gateway`, `template`, `outcome` |
| `auth_logins_total`                                                         | `api`               | `outcome`                   |
| `live_update_events_published_total`                                        | `api`, `worker`     | `channel`                   |

A counter shows up on `/metrics` from boot, but a labelled series only after its first event. `rate(runs_finished_total[5m])` by `status` is the run outcome rate; `histogram_quantile(0.95, sum by (le, node_type) (rate(run_step_duration_seconds_bucket[5m])))` is the step p95.

Every sample also has the `role` label. The duration histograms carry exemplars: a bucket remembers the `trace_id` of one request that fell into it, and Grafana shows it as a dot on the panel that opens the trace. In Grafana, Explore, Prometheus: `histogram_quantile(0.95, sum by (le, route) (rate(http_server_request_duration_seconds_bucket[5m])))`, with Exemplars switched on.

### Memory

Measured on 2026-10-25 with `docker stats` (OrbStack, Apple silicon): 100 s after start (idle), and again after 2000 GraphQL requests. The default stack uses about 1.0 GiB idle and 1.1 GiB after the requests. Each observability service has a `mem_limit` and a matching `GOMEMLIMIT` in [compose.yaml](../../compose.yaml).

| Service             | Idle    | After 2000 requests | `mem_limit` |
| ------------------- | ------- | ------------------- | ----------- |
| `grafana`           | 207 MiB | 207 MiB             | 384 MiB     |
| `alloy`             | 91 MiB  | 102 MiB             | 192 MiB     |
| `loki`              | 75 MiB  | 107 MiB             | 256 MiB     |
| `prometheus`        | 91 MiB  | 101 MiB             | 320 MiB     |
| `tempo`             | 43 MiB  | 108 MiB             | 256 MiB     |
| `otel-collector`    | 25 MiB  | 58 MiB              | 128 MiB     |
| `redis-exporter`    | 10 MiB  | 13 MiB              | 48 MiB      |
| `postgres-exporter` | 11 MiB  | 15 MiB              | 48 MiB      |
| **Total**           | 553 MiB | 711 MiB             |             |

With tracing on, `api` grew from 259 MiB to 349 MiB after the requests, and `worker` sat near 295 MiB instead of 160 MiB (the numbers move with garbage collection). The whole stack in observability mode used 1.7 GiB idle and 2.0 GiB after the requests. Prometheus and Tempo grow with retention (72 h). Run `mise run start` to go back to the default stack when you are done.

## The database

`mise run db:psql` opens psql as `app_owner`. Pass `app` or `app_system` to use another role.

Workspace tables have row-level security. As `app_owner` or `app`, they look empty until you choose a workspace. Use the internal UUID, not the `ws_...` id:

```sql
SET app.workspace_id = '<workspace uuid>';
```

`app_system` skips RLS and sees every row; use it only to look around. `mise run db:reset` starts again from an empty database.

## Raising a workspace's usage limit

Each workspace has three monthly limits: credits for platform models, conversations and knowledge chunks. They come from `USAGE_CREDITS_LIMIT`, `USAGE_CONVERSATIONS_LIMIT` and `USAGE_CHUNKS_LIMIT` (D276). Only the credit limit blocks: at 100 percent the gateway refuses platform model calls until the first day of the next month (UTC), while steps on the workspace's own keys keep answering.

The dashboard has no button to ask for more yet. To raise one workspace's limit, write an override row as `app_system`, the one role that sees every workspace:

```sh
mise run db:psql app_system
```

```sql
SELECT id, name FROM identity.workspaces WHERE name = 'Demo salon';

INSERT INTO usage.workspace_limits (workspace_id, credits_limit, updated_at)
VALUES ('<workspace uuid>', 50000, now())
ON CONFLICT (workspace_id)
DO UPDATE SET credits_limit = excluded.credits_limit, updated_at = now();
```

A column left `NULL` keeps the configured default, so `conversations_limit` and `chunks_limit` work the same way. The next model call reads the new limit; nothing restarts. To return to the defaults, delete the row. The month's usage is in `usage.usage_counters`, one row per workspace and `YYYY-MM`.

## In the code

- [compose.yaml](../../compose.yaml): every service, and the worker's `--queues` list.
- [mise.toml](../../mise.toml): the tasks. They run [tools/dev.ts](../../tools/dev.ts).
- [commands.helpers.ts](../../tools/dev/commands.helpers.ts): what each command does.
- [dynamic.yaml](../../deploy/docker/traefik/dynamic.yaml): the local routes.
- [compose.observability.yaml](../../compose.observability.yaml) and [deploy/docker/observability](../../deploy/docker/observability): the tracing switch and the config of Prometheus, Loki, Tempo, Alloy, the collector and Grafana.
- [stack-mode.helpers.ts](../../tools/dev/stack-mode.helpers.ts): how `lean` and `observability` mode change the Compose calls.

## Pitfalls

- An empty table in psql is usually RLS, not missing data. Set `app.workspace_id`.
- A second checkout of the repo uses the same Compose project (`name: agent-ic` in [compose.yaml](../../compose.yaml)). Starting the stack there replaces the containers of the first checkout; it does not start a second stack. `start` says so, and reinstalls, regenerates and migrates for the new checkout.
- A new env value needs `mise run start <svc>`, not `restart`.

Next: [002 The big picture](002-the-big-picture.md)
