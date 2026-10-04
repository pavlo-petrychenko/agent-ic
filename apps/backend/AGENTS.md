# apps/backend

NestJS modular monolith. One codebase and one image, started in a role (`gateway`, `api` or `worker`) chosen by the CLI argument `--role`. Rules that apply everywhere are in the root `AGENTS.md` and `docs/rules/`. Layout reference: `docs/architecture.md` sections 11.1 to 11.3.

## Source layout

```
src/
├── main.ts              runs the ApplicationLauncher
├── migrate.ts           runs the MigrationLauncher (applies migrations/ as app_owner)
├── print-schema.ts      runs the SchemaPrintLauncher (merges module SDL into packages/api-schema)
├── entrypoints/         the launcher, the application factory and one Nest root module per role: gateway, api, worker
├── platform/            infrastructure with no business meaning, used by 2+ modules
└── modules/<module>/    one domain module
test/                    end-to-end tests through a booted app
migrations/              SQL migrations written by drizzle-kit, committed, never edited after merge
```

`platform/` holds db, redis, queues, pubsub, config, observability (logging, health, metrics, tracing), `UseCaseCtx`, base errors, abstract gateway tokens and test helpers. It never imports `modules/`. Env is read only in `platform/config`.

## Running a role

- `pnpm --filter backend dev:api`, `dev:gateway`, `dev:worker`: rebuild with SWC into `.dev/dist` (one directory per container in compose) and restart on change. Extra arguments pass through: `dev:worker --queues=ingest`.
- `pnpm --filter backend build` then `pnpm --filter backend start --role=api` runs the compiled app.
- The role is `--role=api|gateway|worker`. A worker also needs `--queues=…` (names from `QueueName`). Ports, host and everything else come from env (`.env.example`), validated by `platform/config`; invalid input prints every bad variable and exits with code 1.
- Every role serves health and metrics: `/api/health/live`, `/api/health/ready` on `api`; `/health/live`, `/health/ready` on `gateway` and `worker`; `/metrics` on all three, outside the `/api` prefix.

## Database

- `platform/database` holds the `app` pool (behind `TransactionHost` from `@nestjs-cls/transactional`), `SystemDatabaseService` (the `app_system` role, allow-list only) and `TenantTransactionService`. Repositories read `txHost.tx`; outside a transaction that is the pool, where RLS shows no tenant rows.
- `TenantTransactionService.run(workspaceId, work)` opens or joins the transaction and sets `app.workspace_id` for it. A transaction never switches workspace.
- New table: `modules/<m>/db/<name>.table.ts` in `moduleSchema('<m>')`, with `workspaceIdColumn()` and `tenantIsolationPolicy('<table>')` from `platform/database/helpers/tenant-table.helpers`, and `.enableRLS()`. Run `pnpm --filter backend db:generate`, then append `ALTER TABLE … FORCE ROW LEVEL SECURITY;` to the new migration (drizzle-kit does not write it). A table that is not per workspace goes on the exempt list in `platform/testing/tenant-schema.constants.ts`.
- Apply migrations with `mise run db:migrate` (or `pnpm --filter backend db:migrate` with `DATABASE_OWNER_URL` set). `pnpm --filter backend db:check` checks the migration files.
- Tests need Docker: Vitest starts Postgres and Redis with Testcontainers once per run and migrates them. A database spec builds its module with `createDatabaseTestingModule()` and wraps writes in `TestTransactionRunner.rollback(…)`, so nothing stays behind. The schema test fails when a tenant table lacks `workspace_id`, forced RLS or a policy.

## Request layer

- GraphQL is schema-first on `api` at `/api/graphql` (HTTP) and the same path over `graphql-ws`. Each module's SDL is `modules/<m>/<m>.graphql`; `platform/graphql` loads them all.
- `pnpm codegen` (or `mise run codegen`) writes `src/platform/graphql/schema.generated.ts` (resolver types, gitignored) and `packages/api-schema/schema.graphql` (the merged schema, gitignored). `typecheck` runs codegen first.
- A resolver takes `@GraphqlCtx() ctx: UseCaseCtx` and returns the generated type. The app refuses to boot when a root field has no resolver.
- `UseCaseCtx` (`platform/context`) holds the actor (`user`, `api-channel`, `system`, `anonymous`), `workspaceId`, `traceId` and `locale`. HTTP reads `Authorization: Bearer …`; WebSocket reads `authorization` from `connection_init`, and an invalid token closes the socket with 4403. Until auth exists, `DenyAllAuthenticator` rejects every token.
- Errors: a `DomainError` maps to GraphQL `extensions` (`code`, `reason`, `traceId`, `fields`), to RFC 9457 `application/problem+json` on REST under `/api/*`, and to retry or give-up in jobs (`JobErrorMapper`). `UpstreamError` is a failed external call. Anything else is `INTERNAL` with no detail.
- Relay pagination: `platform/graphql/relay` (`toPageRequest`, `toConnection`, opaque cursors, page-size limits).

## Async, Redis and security helpers

- A job is a `JobDefinition` subclass (`queue`, `name`, zod `schema`; IDs only) in the owning module. Use cases call `jobs.enqueue(ctx, definition, data)` (`JobsService`); never `queue.add()`.
- A processor in `modules/<m>/jobs/` is an `@Injectable()` class marked `@JobProcessor(definition)` with `handle(ctx, data)`, listed in the module's jobs module. It runs as the system actor of the job's workspace, with `ctx.initiatedBy` set to whoever enqueued it.
- Domain events: a `DomainEventDefinition` (name, schema) is emitted with `domainEvents.emit(ctx, event, data)`. A listener is a `DomainEventSubscription` (event, queue, name) declared in the listening module's core module with `DomainEventsModule.forFeature([...])`, and a handler class marked `@OnDomainEvent(subscription)` in its jobs module.
- Inside a transaction, enqueue, emit and publish wait for the commit and are dropped on rollback; outside one they run at once.
- Live updates: a `Topic` subclass per channel (`PubSubService.publish` / `subscribe`). Cache: a `CacheEntry` subclass per key (`CacheService`). Rate limits: a `RateLimitPolicy` subclass with `RateLimiterService.enforce` (throws `RateLimitedError`). Random tokens: `SecureTokenService` (store only the hash).
- Bull Board is at `/api/admin/queues` on `api`, for platform admins only; locally `PLATFORM_ADMIN_DEV_ACCESS=true` opens it. Queue depth and wait time are on `api`'s `/metrics`.
- Tests that use Redis pick their own logical database from `TestRedisDatabase` (`createIntegrationTestEnv`, `createPlatformTestingModule`).

## Module anatomy

Files are grouped by type and named `kebab-case.<type>.ts`. Types, constants and pure helpers sit in their own files beside the code (`<name>.typedefs.ts`, `<name>.constants.ts`, `<name>.helpers.ts`, `<name>.schema.ts`); a class file holds the class only. Classes are PascalCase and end with their type. Example, the `identity` module:

```
modules/identity/
├── identity.module.ts           core: use cases, services, repositories, gateways
├── identity.graphql-module.ts   resolvers, imported by the api root module
├── identity.http-module.ts      controllers, imported by the gateway root module
├── identity.jobs-module.ts      processors, imported by the worker root module
├── identity.graphql             SDL for this module
├── use-cases/                   sign-up.use-case.ts, sign-up.use-case.spec.ts, refresh-session.use-case.ts
├── services/                    sessions.service.ts, password-hasher.service.ts
├── repositories/                users.repository.ts, refresh-tokens.repository.ts
├── gateways/                    email.gateway.ts (abstract), smtp-email.gateway.ts, email.fake.ts
├── graphql/                     auth.resolver.ts
├── http/                        auth-callback.controller.ts
├── jobs/                        send-verification-email.processor.ts
├── domain/                      entities, domain errors, constants, pure helpers
├── db/                          Drizzle tables for the identity Postgres schema
└── index.ts                     re-exports the services and repositories other modules may use
```

Tests sit next to the file they cover (`sign-up.use-case.spec.ts`).

## Layers

```
resolver | controller | processor    transport: build UseCaseCtx, validate input, call ONE use case
        ↓
use case                             authorize first, one transaction, orchestrate services and repositories
        ↓
service                              reusable domain logic, also used by other modules
        ↓
repository                           the only place with Drizzle and SQL, filters by workspace_id
```

- Layers are recognised by file suffix: `*.resolver.ts`, `*.controller.ts`, `*.processor.ts`, `*.use-case.ts`, `*.service.ts`, `*.repository.ts`.
- A use case is an `@Injectable()` class with `execute(ctx, input)`. It never calls another use case; shared logic moves to a service.
- A transport never imports a service or a repository.
- A service never imports a use case; a repository never imports a service.
- `workspaces` may use `SessionsService` from `modules/identity` (its `index.ts`). It may never import `modules/identity/services/sessions.service.ts`.
- Entrypoints import only a module's `*.graphql-module.ts`, `*.http-module.ts`, `*.jobs-module.ts` and `index.ts`.

## Conventions

- Permissions: first line of a use case is `authorize(ctx, …)`.
- Errors: throw `DomainError` subclasses from `domain/`. Transports map them (GraphQL code, HTTP status, job retry or give-up).
- Side effects: `jobs.enqueue` and `domainEvents.emit` after the commit. Job payloads hold IDs only.
- Time and ids: inject `Clock` and `IdService`.
- Database: each module owns its Postgres schema. Tenant tables have `workspace_id` and an RLS policy. `SystemDatabaseService` is used only from the allow-list in `.dependency-cruiser.cjs`.
- Tests: `*.spec.ts` runs against real Postgres with RLS. Fake only external gateways, using the fakes in `platform/testing`.
- A new module needs: its core module, the transport modules it uses, `index.ts`, and a line in each root module in `entrypoints/`.
