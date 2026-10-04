# Run and debug locally

[Back to the guide](README.md)

The whole stack runs in Docker. You install Docker Desktop and mise by hand; [README.md](../../README.md) has the exact steps for macOS, Linux and Windows.

## Start

Once, after cloning:

```sh
mise run setup
```

Every day:

```sh
mise run start
```

It starts every service and follows the logs. Press Ctrl+C to stop following; the stack keeps running.

| Command                      | What it does                                                  |
| ---------------------------- | ------------------------------------------------------------- |
| `mise run status`            | shows which services run and whether they are healthy         |
| `mise run logs [svc]`        | follows the logs of everything, or of one service (`api`)     |
| `mise run restart <svc>`     | restarts one service                                          |
| `mise run stop`              | stops the stack                                               |
| `mise run shell <svc>`       | opens a shell inside a service                                |
| `mise run codegen`           | regenerates GraphQL types and the route tree                  |
| `mise run db:migrate`        | applies new migrations                                        |
| `mise run db:reset`          | deletes the local database, then migrates and seeds it again  |
| `mise run check`             | lint, format, comments, structure, boundaries and types       |
| `mise exec -- pnpm test`     | all tests                                                     |

pnpm scripts run through mise, so the right Node and pnpm are used: `mise exec -- pnpm <script>`.

### On Windows

Two ways work; `README.md` explains both.

- **Native, without mise.** Run `.\tools\windows\setup.ps1` once. Then use `pnpm stack <command>` instead of `mise run <command>`: `pnpm stack start`, `pnpm stack logs api`, `pnpm stack db:reset`. Use `pnpm check` and `pnpm test` for the checks. Hot reload is slower here.
- **WSL2.** Clone into the Ubuntu home folder, not under `/mnt/c`. Then every `mise run` command works as on macOS.

## The services

| Service   | What it is                                                   |
| --------- | ------------------------------------------------------------ |
| `web`     | the Vite dev server for the React app                        |
| `api`     | the backend in the `api` role: GraphQL and `/api/auth`       |
| `gateway` | the backend in the `gateway` role: channel webhooks          |
| `worker`  | the backend in the `worker` role: every queue                |
| `postgres`, `redis`, `minio`, `mailpit`, `traefik` | infrastructure |

Backend and web reload when you save a file. If the web app shows an old version after you add files, run `mise run restart web`.

## URLs

| URL                                         | What                                         |
| ------------------------------------------- | -------------------------------------------- |
| https://local.agent-ic.pavlop.dev           | the web app                                  |
| https://local.agent-ic.pavlop.dev/api/graphql | GraphQL                                    |
| https://mail.local.agent-ic.pavlop.dev      | Mailpit: every email the app sends lands here |
| https://queues.local.agent-ic.pavlop.dev    | the queue board (Bull Board)                 |
| https://grafana.local.agent-ic.pavlop.dev   | Grafana, only with the observability profile |

If a port was busy during setup, the URL has a port, for example `https://local.agent-ic.pavlop.dev:8443`. `mise run setup` prints the real URLs.

## Emails

Nothing leaves your machine. To sign up locally:

1. Sign up in the web app.
2. Open Mailpit and click the confirmation email.
3. Open the link in the same browser. The confirmation only works in the browser that signed up.

Password reset emails land in Mailpit too.

## Logs

```sh
mise run logs api
mise run logs worker
```

The backend writes one JSON line per log entry (pino). Every request is logged with its status. Secrets are hidden: the `Authorization` header and cookies show as redacted.

To see more, set `LOG_LEVEL=debug` in your `.env`, then run `mise run start api`. `start` recreates the container with the new value; `restart` keeps the old one.

To log from your own code, use the Nest `Logger`, never `console.*`:

```ts
private readonly logger = new Logger(QueuesService.name);
```

## When a request fails

1. Open the browser's network tab and find the `graphql` request.
2. A GraphQL error has `extensions` with `code`, `reason`, `traceId` and, for bad input, `fields`. The `reason` tells you which `DomainError` was thrown. Search for it in `packages/contracts/src/errors/errors.constants.ts`, then for its class in `apps/backend/src/modules/*/errors/`.
3. `FORBIDDEN` with `WORKSPACE_ACCESS_DENIED` means the request had no workspace, or the user is not a member. Check the `x-workspace-id` request header. `PERMISSION_DENIED` means the role is not allowed by `PERMISSION_MATRIX`.
4. `INTERNAL` means an unexpected error. The web app shows its `traceId`. Find the stack trace in `mise run logs api`.
5. `UNAUTHENTICATED`: the access token expired or is wrong. The web app refreshes it once and repeats the request. If it still fails, log in again.

## Traces

Tracing is off by default, to save memory. To turn it on:

1. In `.env`, set `OTEL_SDK_DISABLED=false`.
2. Start with the observability profile:

```sh
COMPOSE_PROFILES=observability mise run start
```

3. Open Grafana. The user is `admin` and the password is `GRAFANA_ADMIN_PASSWORD` from your `.env`.
4. Open Explore, choose the Tempo data source, and search by service name (`api`, `gateway`, `worker`).

With tracing on, every log line also carries the `traceId` of its request. Locally the backend does not send logs to Loki yet, so read them with `mise run logs`.

The observability profile needs about 6 GB of memory for Docker. Turn it off again when you are done.

## The database

```sh
mise run db:psql
```

You can pass a role: `app_owner` (the default), `app` or `app_system`.

Workspace tables have row-level security. As `app_owner` or `app`, they look empty until you choose a workspace:

```sql
SET app.workspace_id = '<workspace uuid>';
SELECT * FROM identity.memberships;
```

The value is the internal UUID, not the `ws_…` id. `app_system` skips RLS and sees every row; use it only to look around.

`mise run db:reset` starts again from an empty database. You lose your local users and workspaces.

## Two checkouts at once

To run a second copy of the stack, for example from a git worktree, give it its own `COMPOSE_PROJECT_NAME` in that checkout's `.env` and free ports. Then the two stacks keep separate databases and mailboxes.
