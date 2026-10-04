# agent-ic

Multi-tenant platform for building and running AI agents.

Documentation lives in `docs/`: `architecture.md`, `mvp-scope.md`, `communication.md` and `adr/`.

New to the project? Start with [How to build a feature](docs/guides/README.md): running the stack, a file-by-file walkthrough of the backend and the web app, checklists and a starter backlog.

## Prerequisites

You install two things by hand. Everything else comes from `mise.toml`. On Windows, pick one of the two ways under "Windows" below.

### Docker Desktop

1. Download Docker Desktop for your chip from https://www.docker.com/products/docker-desktop/ (or `brew install --cask docker`).
2. Open it once and wait until the whale icon says "Docker Desktop is running".
3. Give it at least 4 GB of memory and 10 GB of free disk (Settings, Resources) for the minimal stack. The observability and Langfuse profiles need more.

OrbStack also works.

### mise

```sh
brew install mise
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
exec zsh
```

For bash use `mise activate bash` and `~/.bashrc`. Check it with `mise --version`.

### Windows

Two ways work. Both need Docker Desktop for Windows, which runs on WSL2 itself.

**Native, without mise.** Simplest; hot reload is slower because Windows folders send no file-change events to containers, so the dev servers poll.

1. Install Docker Desktop and Git for Windows, and start Docker Desktop.
2. In PowerShell, allow local scripts once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
3. Clone the repo, then run `.\tools\windows\setup.ps1` from its root. It installs Node and mkcert with winget and pnpm with npm (versions from `mise.toml`), then runs the same setup as `mise run setup`. Approve the Windows prompts: installers, the certificate authority and the hosts file.
4. Use `pnpm stack <command>` for the commands below (`pnpm stack start`, `pnpm stack db:reset`), and `pnpm check` and `pnpm test` for the checks.

mise also works in native Windows (`winget install jdx.mise`); then the `mise run` commands work as on macOS.

**WSL2.** Fastest hot reload.

1. In PowerShell as administrator: `wsl --install -d Ubuntu`, then restart and create the Ubuntu user.
2. Install Docker Desktop, then enable Settings, Resources, WSL integration, Ubuntu.
3. Open the Ubuntu terminal and install mise there: `curl https://mise.run | sh`, then `echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc` and `exec bash`.
4. Clone into the Ubuntu home folder (`~/agent-ic`), not under `/mnt/c`. Files under `/mnt/c` are slow and break hot reload.
5. Run every command from the Ubuntu terminal. Open the URLs in your Windows browser.

Inside WSL2, `mise run setup` also does the Windows part: it trusts the local certificate authority in your Windows user certificate store and adds the hostnames to the Windows hosts file.

Either way, Chrome and Edge trust the local certificate through the Windows store. In Firefox, set `security.enterprise_roots.enabled` to `true` in `about:config`.

## Quick start

```sh
git clone https://github.com/pavlo-petrychenko/agent-ic.git
cd agent-ic
mise run setup
```

`mise run setup` is run once. It:

1. installs the pinned tools (Node 24, pnpm, mkcert, kubectl, helm, kubeseal, actionlint, kubeconform);
2. runs `mkcert -install` so your browser trusts the local certificate authority (it may ask for your password);
3. creates `.env` from `.env.example`, or adds the variables your `.env` is missing, then checks every host port and moves busy ones (see "Port conflicts");
4. creates a wildcard certificate for `*.local.agent-ic.pavlop.dev` in `.certs/` with mkcert;
5. adds the local hostnames to `/etc/hosts` (asks for your password, only if they are missing), or to the Windows hosts file on Windows and in WSL2;
6. installs dependencies on the host (for editor types) and the git hooks;
7. builds the dev image and starts the stack;
8. runs the migrations and the seed;
9. prints the URLs, with the port when it is not the default.

Every command is a subcommand of one Node script, `tools/dev.ts`, so it works the same on macOS, Linux and Windows. `mise run <command>` and `pnpm stack <command>` both run it.

## Commands

| Command                   | Does                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `mise run setup`          | one-time setup, see above                                          |
| `mise run start [svc...]` | start everything, or only the listed services, and follow the logs |
| `mise run add <svc>`      | add one service to the running stack (for example `grafana`)       |
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
| `mise run chart:validate` | lint, render and kubeconform the Helm chart                        |
| `mise run lint:workflows` | lint the GitHub Actions workflows                                  |
| `mise run test`           | run the tests                                                      |
| `mise run clean`          | remove containers, volumes and certificates                        |

`mise tasks` lists them with descriptions.

The default stack is the minimum to run the app: Postgres, one Redis (queues and cache share it locally, production keeps two), Silo, Mailpit, Traefik, `api`, `gateway`, one `worker` (all queues) and `web`.

| Mode               | Memory | Disk  |
| ------------------ | ------ | ----- |
| Minimal (default)  | 4 GB   | 10 GB |
| Plus observability | 6 GB   | 15 GB |
| Plus Langfuse      | 8 GB   | 20 GB |

Optional stacks stay off until you ask for them:

```sh
COMPOSE_PROFILES=observability mise run start
COMPOSE_PROFILES=langfuse mise run start
COMPOSE_PROFILES=observability,langfuse mise run start
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
| https://s3.local.agent-ic.pavlop.dev       | Silo (S3) console                         |
| https://grafana.local.agent-ic.pavlop.dev  | Grafana (observability profile)           |
| https://langfuse.local.agent-ic.pavlop.dev | Langfuse (langfuse profile)               |
| https://queues.local.agent-ic.pavlop.dev   | Bull Board, opened by the admin route     |

## Port conflicts

`.env.example` holds the default host ports, all bound to `127.0.0.1`: Traefik `TRAEFIK_HTTP_PORT=80` and `TRAEFIK_HTTPS_PORT=443`, `POSTGRES_PORT=5432`, `REDIS_PORT=6380`, `MINIO_API_PORT=9000`, `MAILPIT_SMTP_PORT=1025`. Compose reads them from `.env`.

During `mise run setup`, `tools/dev.ts` checks each port by trying to listen on it (in WSL2 it also asks Windows). For a busy port it writes a free alternative into `.env` (`8080`, `8443`, `5433`, `6390`, `6391`, `9100`, `1026`, or the next free number) and prints the resulting URLs. When HTTPS is not on `443`, `PUBLIC_URL` gets the port too, so open `https://local.agent-ic.pavlop.dev:8443`.

`.env.example` also holds the container ports (`WEB_PORT`, `API_PORT`, `GATEWAY_PORT`, `WORKER_PORT`), the hosts the dev server accepts (`WEB_ALLOWED_HOSTS`, comma separated) and other backend settings. Compose and the backend read them from `.env`. When a pull adds variables to `.env.example`, `mise run start` appends them to your `.env` with their example values; it never changes a variable you already have.

To choose ports yourself, edit `.env`. Run `mise run ports` (or `pnpm stack ports`) again after you stop the stack to re-check. `mise run setup` never overwrites an existing `.env` apart from those port lines and `PUBLIC_URL`.

## Layout

- `apps/backend` NestJS backend, one image started in three roles (api, gateway, worker)
- `apps/web` React web app
- `packages/contracts` constants shared by backend and web
- `packages/flow` flow graph schema and validation
- `packages/tsconfig` shared TypeScript configs
- `packages/oxc-config` shared oxlint and oxfmt configs
- `compose.yaml` and `deploy/docker` the local stack

## Project structure

Code is organised by kind: a file lives at `<area>/<kind folder>/<topic>.<kind>.ts`, and the root of a module or feature holds only its public surface.

```
apps/backend/src/
├── main.ts                     resolveCommand(process.argv).execute()
├── app/                        AppModule.forRole, commands (serve, migrate, print-schema)
├── platform/<name>/            infrastructure used by 2+ modules (database, queues, config, ...)
└── modules/system/
    ├── system.module.ts        defineModule({ providers, resolvers, ... })
    ├── index.ts                what other modules may use
    ├── graphql/  resolvers/  use-cases/  services/  repositories/
    └── jobs/  events/  errors/  typedefs/  constants/  helpers/

apps/web/src/
├── app/  routes/  shared/
└── features/status/
    ├── index.ts
    ├── communication/          gql/, hooks/, helpers/, fixtures/
    ├── logic/                  hooks/, helpers/
    ├── view/  containers/      component folders
    └── constants/  typedefs/
```

`pnpm check:structure` rejects a folder or file suffix that is not allowed. The full rules and the reason for every folder are in [docs/rules/structure.md](docs/rules/structure.md).

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
