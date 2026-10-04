# agent-ic

Multi-tenant platform for building and running AI agents.

Documentation lives in `docs/`: `architecture.md`, `mvp-scope.md`, `communication.md` and `adr/`.

## Prerequisites

You install two things by hand. Everything else comes from `mise.toml`.

### Docker Desktop

1. Download Docker Desktop for your chip from https://www.docker.com/products/docker-desktop/ (or `brew install --cask docker`).
2. Open it once and wait until the whale icon says "Docker Desktop is running".
3. Give it at least 6 GB of memory (Settings, Resources). The observability and Langfuse profiles need more.

OrbStack also works.

### mise

```sh
brew install mise
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
exec zsh
```

For bash use `mise activate bash` and `~/.bashrc`. Check it with `mise --version`.

## Quick start

```sh
git clone https://github.com/pavlo-petrychenko/agent-ic.git
cd agent-ic
mise run setup
```

`mise run setup` is run once. It:

1. installs the pinned tools (Node 24, pnpm, mkcert, kubectl, helm, kubeseal, actionlint);
2. runs `mkcert -install` so your browser trusts the local certificate authority (it may ask for your password);
3. creates `.env` from `.env.example` if it is missing, then checks every host port and moves busy ones (see "Port conflicts");
4. creates a wildcard certificate for `*.local.agent-ic.pavlop.dev` in `.certs/` with mkcert;
5. adds the local hostnames to `/etc/hosts` (asks for your password, only if they are missing);
6. installs dependencies on the host (for editor types) and the git hooks;
7. builds the dev image and starts the stack;
8. runs the migrations and the seed;
9. prints the URLs, with the port when it is not the default.

## Commands

| Command                   | Does                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `mise run setup`          | one-time setup, see above                                          |
| `mise run start [svc...]` | start everything, or only the listed services, and follow the logs |
| `mise run add <svc>`      | add one service to the running stack (for example `worker-ingest`) |
| `mise run stop [svc]`     | stop everything or one service                                     |
| `mise run restart <svc>`  | restart one service                                                |
| `mise run status`         | show the state of every service                                    |
| `mise run logs [svc]`     | follow the logs of everything or one service                       |
| `mise run shell <svc>`    | open a shell in a running service                                  |
| `mise run db:migrate`     | apply migrations                                                   |
| `mise run db:reset`       | recreate the database volume, then migrate and seed                |
| `mise run db:seed`        | load seed data                                                     |
| `mise run db:psql [role]` | open psql as `app_owner` (default), `app` or `app_system`          |
| `mise run codegen`        | regenerate generated code                                          |
| `mise run check`          | lint, format check, comments, boundaries and types                 |
| `mise run test`           | run the tests                                                      |
| `mise run e2e`            | run the end-to-end tests                                           |
| `mise run clean`          | remove containers, volumes and certificates                        |

`mise tasks` lists them with descriptions.

Optional stacks stay off until you ask for them:

```sh
COMPOSE_PROFILES=observability mise run start
COMPOSE_PROFILES=langfuse mise run start
mise run add grafana
mise run add langfuse-web
```

## URLs

| URL                                        | What                                      |
| ------------------------------------------ | ----------------------------------------- |
| https://local.agent-ic.pavlop.dev          | web                                       |
| https://local.agent-ic.pavlop.dev/api      | api, served under `/api` as in production |
| https://local.agent-ic.pavlop.dev/v1       | gateway                                   |
| https://local.agent-ic.pavlop.dev/webhooks | gateway                                   |
| https://mail.local.agent-ic.pavlop.dev     | Mailpit, catches all outgoing email       |
| https://s3.local.agent-ic.pavlop.dev       | MinIO console                             |
| https://grafana.local.agent-ic.pavlop.dev  | Grafana (observability profile)           |
| https://langfuse.local.agent-ic.pavlop.dev | Langfuse (langfuse profile)               |

## Port conflicts

`.env.example` holds the default host ports, all bound to `127.0.0.1`: Traefik `TRAEFIK_HTTP_PORT=80` and `TRAEFIK_HTTPS_PORT=443`, `POSTGRES_PORT=5432`, `REDIS_QUEUE_PORT=6380`, `REDIS_CACHE_PORT=6381`, `MINIO_API_PORT=9000`, `MAILPIT_SMTP_PORT=1025`. Compose reads them from `.env`.

During `mise run setup`, `tools/dev/ports.sh` checks each port with `lsof`. For a busy port it prints the process that holds it, writes a free alternative into `.env` (`8080`, `8443`, `5433`, `6390`, `6391`, `9100`, `1026`, or the next free number) and prints the resulting URLs. When HTTPS is not on `443`, `PUBLIC_URL` gets the port too, so open `https://local.agent-ic.pavlop.dev:8443`.

`.env.example` also holds the container ports (`API_PORT`, `GATEWAY_PORT`, `WORKER_PORT`) and other backend settings. Compose and the backend read them from `.env`; when a pull adds variables to `.env.example`, copy them into your `.env`.

To choose ports yourself, edit `.env`. Run `tools/dev/ports.sh` again after you stop the stack to re-check. `mise run setup` never overwrites an existing `.env` apart from those port lines and `PUBLIC_URL`.

## Layout

- `apps/backend` NestJS backend, one image started in three roles (api, gateway, worker)
- `apps/web` React web app
- `packages/contracts` constants shared by backend and web
- `packages/flow` flow graph schema and validation
- `packages/tsconfig` shared TypeScript configs
- `packages/oxc-config` shared oxlint and oxfmt configs
- `compose.yaml` and `deploy/docker` the local stack

## Scripts

```
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm check
```
