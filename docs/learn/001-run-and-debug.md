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

Once, after cloning: `mise run setup`. Every day: `mise run start`. It starts every service and follows the logs. Press Ctrl+C to stop following; the stack keeps running.

| Command                  | What it does                                                 |
| ------------------------ | ------------------------------------------------------------ |
| `mise run status`        | shows which services run and whether they are healthy        |
| `mise run logs [svc]`    | follows the logs of everything, or of one service (`api`)    |
| `mise run restart <svc>` | restarts one service                                         |
| `mise run stop`          | stops the stack                                              |
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
| https://grafana.local.agent-ic.pavlop.dev     | Grafana, only with the observability profile  |

If a port was busy during setup, the URL has a port, for example `:8443`. `mise run setup` prints the real URLs.

## Emails

1. Sign up in the web app.
2. Open Mailpit and click the confirmation email.
3. Open the link in the same browser. The confirmation only works in the browser that signed up.

Password reset emails land in Mailpit too.

## Logs

Run `mise run logs api` or `mise run logs worker`. The backend writes one JSON line per log entry (pino). Authorization headers and cookies show as `[redacted]`.

For more detail, set `LOG_LEVEL=debug` in `.env`, then run `mise run start api`. `start` recreates the container with the new value; `restart` keeps the old one. In code, use the Nest `Logger`, never `console.*`.

## When a request fails

1. Open the network tab and find the `graphql` request.
2. A GraphQL error has `extensions` with `code`, `reason`, `traceId` and, for bad input, `fields`. Find the `reason` in [errors.constants.ts](../../packages/contracts/src/errors/errors.constants.ts), then its class in `apps/backend/src/modules/*/errors/`.
3. `FORBIDDEN` with `WORKSPACE_ACCESS_DENIED`: no workspace on the request, or you are not a member. Check the `x-workspace-id` header. `PERMISSION_DENIED`: your role is not allowed by `PERMISSION_MATRIX`.
4. `INTERNAL`: an unexpected error. The web app shows the `traceId`; find the stack trace in `mise run logs api`.
5. `UNAUTHENTICATED`: the access token expired. The web app refreshes it once and repeats the request. If that fails too, log in again.

## Traces

Tracing is off by default, to save memory. To turn it on:

1. In `.env`, set `OTEL_SDK_DISABLED=false`.
2. Run `COMPOSE_PROFILES=observability mise run start`.
3. Open Grafana (user `admin`, password `GRAFANA_ADMIN_PASSWORD` from `.env`), then Explore, data source Tempo, and search by service name (`api`, `gateway`, `worker`).

With tracing on, every log line also carries the `traceId` of its request. The profile needs about 6 GB for Docker. Turn it off when you are done.

## The database

`mise run db:psql` opens psql as `app_owner`. Pass `app` or `app_system` to use another role.

Workspace tables have row-level security. As `app_owner` or `app`, they look empty until you choose a workspace. Use the internal UUID, not the `ws_...` id:

```sql
SET app.workspace_id = '<workspace uuid>';
```

`app_system` skips RLS and sees every row; use it only to look around. `mise run db:reset` starts again from an empty database.

## In the code

- [compose.yaml](../../compose.yaml): every service, and the worker's `--queues` list.
- [mise.toml](../../mise.toml): the tasks. They run [tools/dev.ts](../../tools/dev.ts).
- [commands.helpers.ts](../../tools/dev/commands.helpers.ts): what each command does.
- [dynamic.yaml](../../deploy/docker/traefik/dynamic.yaml): the local routes.

## Pitfalls

- An empty table in psql is usually RLS, not missing data. Set `app.workspace_id`.
- A second checkout of the repo uses the same Compose project (`name: agent-ic` in [compose.yaml](../../compose.yaml)). Starting the stack there replaces the containers of the first checkout; it does not start a second stack.
- A new env value needs `mise run start <svc>`, not `restart`.

Next: [002 The big picture](002-the-big-picture.md)
