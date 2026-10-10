# apps/backend

NestJS modular monolith. One codebase and one image with one binary, `node dist/main.js <command>`. The `serve` command starts a role (`gateway`, `api` or `worker`) chosen by `--role`. Rules that apply everywhere are in the root `AGENTS.md` and `docs/rules/`. The full structure spec, with the reason for every folder, is `docs/rules/structure.md`.

## Source layout

```
src/
├── main.ts              resolveCommand(process.argv).execute()
├── app/                 app.module.ts (AppModule.forRole), commands/, schemas/, constants/, typedefs/, helpers/
├── platform/<name>/     infrastructure with no business meaning, used by 2+ modules
└── modules/<name>/      one domain module
test/
├── integration/         specs through a booted app, and the whole-database tenant schema check
└── support/             shared test support, imported as @test/support/…
migrations/              SQL migrations written by drizzle-kit, committed, never edited after merge
```

`platform/` holds config, context, errors, database, graphql-server, http, queues, domain-events, live-updates, observability, module-roles, llm (the LLM gateways and the curated model catalog), and one small module each for admin, cache, clock, crypto, ids, rate-limit, redis and secrets. It never imports `modules/`. It has no use cases: platform controllers (health, metrics, queue board) call platform services directly, because they have no actor, no permissions and no transaction. A platform folder is never named after a kind folder, so it is `database`, not `db`; `graphql-server`, not `graphql`; `live-updates`, not `channels`. The one exception is `errors`. Env is read only in `platform/config`.

## Commands and roles

One binary, three commands, in `src/app/commands/`:

- `node dist/main.js serve --role=api|gateway|worker`. A worker also needs `--queues=…` (names from `QueueName`). Ports, host and everything else come from env (`.env.example`), validated by `platform/config`; invalid input prints every bad variable and exits with code 1.
- `node dist/main.js migrate` applies `migrations/` as `app_owner`.
- `node dist/main.js print-schema --output=…` merges every module's SDL into `packages/api-schema`.
- `pnpm --filter backend dev:api`, `dev:gateway`, `dev:worker` rebuild with SWC into `.dev/dist` and restart on change. Extra arguments pass through: `dev:worker --queues=ingest`. `pnpm --filter backend build` then `pnpm --filter backend start --role=api` (the `start` script already passes `serve`) runs the compiled app.
- Every role serves health and metrics: `/api/health/live`, `/api/health/ready` on `api`; `/health/live`, `/health/ready` on `gateway` and `worker`; `/metrics` on all three, outside the `/api` prefix.
- `AppModule.forRole(config, tracing)` imports every module in `APP_MODULES` (`src/app/constants/app-modules.constants.ts`) once; a new module is one line there. Each module is one `defineModule({...})` that declares all its transports, and `forRole(role)` mounts only what that role runs: resolvers and controllers in `api`, gateway controllers in `gateway`, processors and listeners in `worker`. `Role` and `defineModule` live in `platform/module-roles/`.

## Database

- `platform/database` holds the `app` pool (behind `TransactionHost` from `@nestjs-cls/transactional`), `SystemDatabaseService` (the `app_system` role, allow-list only) and `TenantTransactionService`. Repositories read `txHost.tx`; outside a transaction that is the pool, where RLS shows no tenant rows.
- `TenantTransactionService.run(workspaceId, work)` opens or joins the transaction and sets `app.workspace_id` for it. A transaction never switches workspace.
- New table: `modules/<m>/db/<name>.table.ts` in `moduleSchema('<m>')`, with `workspaceIdColumn()` and `tenantIsolationPolicy('<table>')` from `platform/database/helpers/tenant-table.helpers`, and `.enableRLS()`. Run `pnpm --filter backend db:generate`, then append `ALTER TABLE … FORCE ROW LEVEL SECURITY;` to the new migration (drizzle-kit does not write it). A table that is not per workspace goes on the exempt list in `test/support/constants/tenant-schema.constants.ts`.
- Apply migrations with `mise run db:migrate` (or `pnpm --filter backend db:migrate` with `DATABASE_OWNER_URL` set). `pnpm --filter backend db:check` checks the migration files.
- Tests need Docker: Vitest starts Postgres and Redis with Testcontainers once per run and migrates them (`test/support/setup/`). A database spec builds its module with `createDatabaseTestingModule()` and wraps writes in `TestTransactionService.rollback(…)`, so nothing stays behind. The schema test in `test/integration/` fails when a tenant table lacks `workspace_id`, forced RLS or a policy.

## Request layer

- GraphQL is schema-first on `api` at `/api/graphql` (HTTP) and the same path over `graphql-ws`. Each module's SDL is `modules/<m>/graphql/<m>.graphql`; `platform/graphql-server` loads them all.
- `pnpm codegen` (or `mise run codegen`) writes the resolver types into `platform/graphql-server/generated/` and `packages/api-schema/schema.graphql` (both gitignored). `typecheck` runs codegen first.
- A resolver takes `@GraphqlCtx() ctx: UseCaseCtx` and returns the generated GraphQL type. A use case returns the module's typedefs; a helper in `helpers/` maps between them when the shapes differ. The app refuses to boot when a root field has no resolver.
- `UseCaseCtx` (`platform/context`) is an interface holding the actor (`user`, `api-channel`, `system`, `anonymous`), `workspaceId`, `workspaceRole`, `traceId`, `locale` and `clientIp`; `UseCaseCtxService` builds it. HTTP reads `Authorization: Bearer …`; WebSocket reads `authorization` from `connection_init`, and an invalid token closes the socket with 4403. `AccessTokenAuthenticatorService` verifies the access JWT (`AccessTokenService`, 15 minutes, `sub` and `sid` only) and builds the `User` actor (D161). A REST controller adds `@UseGuards(UseCaseCtxGuard)` and takes `@HttpCtx() ctx`. `requireUserActor(ctx)` and `requireSystemActor(ctx)` guard use cases that need a signed-in user or the system. `Locale` comes from `@agent-ic/contracts`.
- Workspace and role: HTTP sends `x-workspace-id` (`HttpHeader.WorkspaceId`, a public `ws_` id) and graphql-ws sends the same key in `connection_init`. `UseCaseCtxService` asks the abstract `WorkspaceAccessService` (bound by `identity`) for the caller's role on every request and sets `ctx.workspaceId` and `ctx.workspaceRole` only for a verified member; otherwise both are null (D177). A workspace use case starts with `const { userId, workspaceId } = authorize(ctx, PermissionResource.X, PermissionAction.Y)` (`platform/context/helpers/authorize.helpers`), which checks the contracts `PERMISSION_MATRIX` and throws `FORBIDDEN` with `WORKSPACE_ACCESS_DENIED` or `PERMISSION_DENIED` (D176), then runs its work in `TenantTransactionService.run(workspaceId, …)`.
- Errors: a `DomainError` maps to GraphQL `extensions` (`code`, `reason`, `traceId`, `fields`), to RFC 9457 `application/problem+json` on REST under `/api/*`, and to retry or give-up in jobs. The mappers are helpers in `platform/errors/helpers/`. `UpstreamError` is a failed external call. Anything else is `INTERNAL` with no detail.
- Relay pagination: `platform/graphql-server/helpers/relay.helpers.ts` (`toPageRequest`, `toConnection`, opaque cursors, page-size limits).

## Async, Redis and security

- A job is made with `defineJob({ queue, name, schema })` in `modules/<m>/jobs/`; the payload holds IDs only. Use cases call `jobs.enqueue(ctx, job, data)` (`JobsService`); never `queue.add()`.
- A processor in `modules/<m>/processors/` is an `@Injectable()` class marked `@ProcessJob(job)` with `handle(ctx, data)`, listed under `processors` in the module's `defineModule`. It runs as the system actor of the job's workspace, with `ctx.initiatedBy` set to whoever enqueued it.
- A recurring job: add `@ScheduleJob(defineJobSchedule({ job, everySeconds, data }))` to its processor. Every worker that serves the job's queue upserts one BullMQ job scheduler for it on boot; the job runs as the system actor with no workspace and `ctx.initiatedBy` `{ system, schedule }`.
- Domain events: an event is made with `defineDomainEvent({ name, schema })` in `events/` and emitted with `domainEvents.emit(ctx, event, data)`. A listener is a class in `listeners/` marked `@OnDomainEvent(subscription)` and listed under `listeners` in the listening module's `defineModule`. Each listener gets one job per event: delivery is durable and retried, and a failing listener never blocks the others. The subscription is registered in every role, so `api` knows where to fan out, and the listener is instantiated only in workers.
- Inside a transaction, enqueue, emit and publish wait for the commit and are dropped on rollback; outside one they run at once.
- Work that must not be lost passes `{ durable: true }` to `enqueue` or `emit`: a row in `outbox.messages` is written in the same transaction, the job is added after the commit with `jobId` set to the row id, and the row is deleted. The `timers` worker sweeps rows older than the grace period and re-sends them with the same `jobId`. Delivery is at-least-once, so the job must be safe to repeat (D191).
- Live updates: `defineChannel` per channel in `channels/`, published with `LiveUpdatesService.publish(channelFor(definition, ...segments), event)` and subscribed with `subscribe(channel)` (Redis pub/sub, best effort). Cache: `defineCacheEntry` per key with `CacheService`. Rate limits: `defineRateLimitPolicy` with `RateLimitService.enforce` (throws `RateLimitedError`). Random tokens: `SecureTokenService` (store only the hash). Secrets to store and read back (bot tokens, BYOK keys): `SecretBoxService.seal` and `open`. LLM calls: inject the abstract `LlmGateway` and call `complete({ provider, model, system, messages, output, tags })` for a structured answer without tools; the catalog decides how each model is asked (D91, D194), the answer is checked against the zod `output` with one retry, and specs run it against `startMockLlm()` from `test/support/services/mock-llm.service.ts`.
- Bull Board is at `/api/admin/queues` on `api`, for platform admins only. `PlatformAdminGuard` also accepts the `x-agent-ic-admin-route` header (`HttpHeader.PlatformAdminRoute`), which only the VPN-only admin route adds and every public route strips (D151). Locally `PLATFORM_ADMIN_DEV_ACCESS=true` or `https://queues.local.agent-ic.pavlop.dev` opens it. Queue depth and wait time are on `api`'s `/metrics`.
- Tests that use Redis pick their own logical database from `TestRedisDatabase` (`createIntegrationTestEnv`, `createPlatformTestingModule`).

## What lives where and why

A module is organised by kind: `<module>/<kind folder>/<topic>.<kind>.ts`. The module root holds only `<name>.module.ts` and `index.ts`.

| Kind | Folder | Suffix | Why |
| --- | --- | --- | --- |
| Resolver | `resolvers/` | `.resolver.ts` | turns a GraphQL operation into one use case call |
| Controller | `controllers/` | `.controller.ts` | turns a REST request into one use case call (cookies, the gateway) |
| Processor | `processors/` | `.processor.ts` | turns a queued job into one use case call |
| Listener | `listeners/` | `.listener.ts` | turns another module's domain event into one use case call |
| GraphQL SDL | `graphql/` | `.graphql` | the module's schema |
| Job | `jobs/` | `.job.ts` | work this module accepts; sender and receiver share one shape |
| Event | `events/` | `.event.ts` | a fact this module announces; listeners are unknown to it |
| Channel | `channels/` | `.channel.ts` | a live-update channel behind a subscription |
| Use case | `use-cases/` | `.use-case.ts` | one business operation, one transaction, permissions first |
| Service | `services/` | `.service.ts` | stateful or dependent logic shared by use cases; abstract services for internal ports |
| Repository | `repositories/` | `.repository.ts` | the only place with Drizzle and SQL |
| Gateway | `gateways/` | `.gateway.ts`, `.fake.ts` | an external system: abstract class, implementations, fake |
| Table | `db/` | `.table.ts` | Drizzle tables in the module's Postgres schema |
| Error | `errors/` | `.error.ts` | `DomainError` subclasses |
| Schema | `schemas/` | `.schema.ts` | zod |
| Types, values, logic | `typedefs/`, `constants/`, `helpers/` | `.typedefs.ts`, `.constants.ts`, `.helpers.ts` | types and interfaces; enums and named values; pure functions and mappers |
| Plumbing | `guards/`, `decorators/`, `filters/`, `interceptors/` | `.guard.ts`, `.decorator.ts`, `.filter.ts`, `.interceptor.ts` | Nest plumbing, mostly in `platform/` |
| Generated | `generated/` | `.generated.ts` | codegen output, gitignored |

Tests sit next to the file they cover (`get-server-status.use-case.spec.ts`).

Example, the `system` module:

```
modules/system/
├── system.module.ts                       defineModule({ providers, resolvers, exports })
├── index.ts                               SystemModule and ServerUptimeService
├── graphql/system.graphql                 SDL
├── resolvers/server-status.resolver.ts    returns the generated GraphQL type
├── use-cases/get-server-status.use-case.ts and its .spec.ts
├── services/server-uptime.service.ts
└── typedefs/server-status.typedefs.ts
```

A fuller module, `identity`, adds the other kinds:

```
modules/identity/
├── identity.module.ts
├── index.ts                      the module class, services and repositories other modules may use
├── graphql/identity.graphql
├── resolvers/  controllers/  processors/  listeners/
├── use-cases/  services/  repositories/  gateways/  db/
├── jobs/  events/  channels/
└── errors/  schemas/  helpers/  constants/  typedefs/
```

## Layers

```
resolver | controller | processor | listener    inbound: build UseCaseCtx, validate input, call ONE use case
        ↓
use case                                        authorize first, one transaction, orchestrate services and repositories
        ↓
service                                         reusable logic, also used by other modules
        ↓
repository                                      the only place with Drizzle and SQL, filters by workspace_id
```

- Layers are recognised by file suffix: `.resolver.ts`, `.controller.ts`, `.processor.ts`, `.listener.ts`, `.use-case.ts`, `.service.ts`, `.repository.ts`.
- A use case is an `@Injectable()` class with `execute(ctx, input)`. It never calls another use case; shared logic moves to a service.
- Inbound code in `modules/` never imports a service, a repository or a gateway.
- A service never imports a use case; a repository never imports a service.
- A service is a class with state or injected dependencies. Logic without state is a pure function in `helpers/`. Time, randomness and ids are always services (`ClockService`, `IdService`, `SecureTokenService`), so tests can replace them.
- No value classes. Data is an interface in `typedefs/`; definitions of jobs, events, channels, cache entries and rate-limit policies are made with `defineX({...})` helpers.
- `workspaces` may use `SessionsService` from `@/modules/identity` (its `index.ts`). It may never import `@/modules/identity/services/sessions.service`. `index.ts` never exports use cases or inbound adapters.
- `AppModule` imports each module's class from its `index.ts`.

## Conventions

- Permissions: first line of a use case is `authorize(ctx, …)`.
- Errors: throw `DomainError` subclasses from the module's `errors/`. Inbound adapters map them (GraphQL code, HTTP status, job retry or give-up).
- Side effects: `jobs.enqueue` and `domainEvents.emit` after the commit. Job payloads hold IDs only.
- Time and ids: inject `ClockService` and `IdService`.
- Imports: always absolute (`@/…` in `src`, `@test/…` in test support), even inside one folder. No blank lines between imports.
- Database: each module owns its Postgres schema. Tenant tables have `workspace_id` and an RLS policy. `SystemDatabaseService` is used only from the allow-list in `.dependency-cruiser.cjs`.
- Tests: `*.spec.ts` runs against real Postgres with RLS. Fake only external gateways, using the fakes in `test/support/fakes/` and the gateways' own `.fake.ts`. Specs that boot the app are in `test/integration/`.
- A new module needs: `<name>.module.ts` with `defineModule`, `index.ts`, and one line in `AppModule`.
