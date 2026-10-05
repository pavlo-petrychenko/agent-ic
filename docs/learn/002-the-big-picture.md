# 002 The big picture

[Back to the docs](../README.md)

## What it is

agent-ic is an API-first platform where a small business builds an AI chat agent visually, gives it knowledge from its own documents, extends it with custom tools and publishes it to messengers such as Telegram.

Today the code covers the base: sign-up, login, workspaces, team invites and settings. The flow builder, knowledge, tools and channels are not built yet.

It is one pnpm and Turborepo monorepo with two apps and a few shared packages.

| Folder                                     | What it is                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| `apps/backend`                             | NestJS modular monolith. GraphQL for the dashboard, REST for login and sign-up  |
| `apps/web`                                 | React single-page app. Apollo Client for GraphQL, TanStack Router for pages     |
| `packages/contracts`                       | what both apps share: roles, permissions, error codes, ID prefixes              |
| `packages/flow`                            | the home of the flow graph schema and validation; today only a version constant |
| `packages/api-schema`                      | the merged GraphQL schema, generated, not committed                             |
| `packages/oxc-config`, `packages/tsconfig` | shared lint, format and TypeScript settings                                     |

Apps import packages. Apps never import each other.

## Why we have it

One codebase is simple to change and to test. But different work has different needs. A user clicking a button needs a fast answer. Sending an email or running an agent can take seconds and can fail. The gateway is meant for messenger traffic, which should not compete with the dashboard.

So we build one image and start it in three roles. Each role loads only the parts it needs, and each can be scaled on its own.

## How it works

The backend has one binary: `node dist/main.js serve --role=api|gateway|worker`. A worker also needs `--queues=...`, a list of queue names.

```
 browser ---> [ api ]      GraphQL and /api/auth, queue board
 messengers -> [ gateway ]  channel traffic (no routes of its own yet)
              [ worker ]   jobs and event listeners, no public route
                  |
   api, gateway, worker all connect to:
     Postgres       data, row-level security
     Redis (queue)  BullMQ jobs, live-update pub/sub
     Redis (cache)  cache entries, rate limits
```

What each role mounts:

- **api:** resolvers and controllers, the GraphQL server, the queue board. Routes sit under `/api`.
- **gateway:** gateway controllers only. No module declares one yet, so it serves just health and metrics.
- **worker:** processors, event listeners and the job workers that take jobs from the queues it was given.
- **every role:** providers, health checks and `/metrics`.

Startup in four steps:

1. `main.ts` calls `resolveCommand(process.argv)`, which picks `serve`, `migrate` or `print-schema`.
2. `ServeCommand` parses `--role` and `--queues`, loads the config and starts tracing.
3. It imports `AppModule` and calls `AppModule.forRole(config, tracing)`.
4. `forRole` imports every module in `APP_MODULES` once, each one asked for its `role`.

Config comes only from environment variables, checked by zod. A bad variable stops the start and lists every problem.

**Two Redis instances.** BullMQ needs a Redis that never evicts keys, or jobs could vanish. A cache wants the opposite: it should drop old keys when memory is full. So the code has two connections, `REDIS_QUEUE_URL` and `REDIS_CACHE_URL`. Locally one Redis container serves both. The Helm chart has a separate connection for each, so production can use two instances.

## In the code

- [main.ts](../../apps/backend/src/main.ts): the entry point.
- [serve.command.ts](../../apps/backend/src/app/commands/serve.command.ts): config, tracing, then `AppModule.forRole`.
- [app.module.ts](../../apps/backend/src/app/app.module.ts): `forRole` maps each module with `importForRole`.
- [app-modules.constants.ts](../../apps/backend/src/app/constants/app-modules.constants.ts): `PLATFORM_MODULES` and `DOMAIN_MODULES`.
- [role.constants.ts](../../apps/backend/src/platform/module-roles/constants/role.constants.ts): the `Role` enum.
- [queue.constants.ts](../../apps/backend/src/platform/queues/constants/queue.constants.ts): `QueueName`, the six queues a worker can serve.
- [values.yaml](../../deploy/helm/agent-ic/values.yaml): the deployed workloads. One `api`, one `gateway` and two worker groups with different queues.
- Spec: [app-roles.spec.ts](../../apps/backend/test/integration/app-roles.spec.ts) boots each role and checks its health and metrics routes.

## Pitfalls

- A worker started without `--queues` refuses to start.
- Health checks are at `/api/health/live` on `api` and `/health/live` on `gateway` and `worker`. `/metrics` has no `/api` prefix on any role.
- Your code runs in every role unless you put it in a role-specific field. A processor in the wrong place never runs, and a resolver in a worker never serves a request. Page 003 shows which field does what.
- Locally both Redis URLs point at one instance. Do not assume a cache key and a job share a server in production.

Next: [003 Code layout](003-code-layout.md)
