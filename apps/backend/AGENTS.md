# apps/backend

NestJS modular monolith. One codebase and one image, started in a role (`gateway`, `api` or `worker`) chosen by `ROLE`. Rules that apply everywhere are in the root `AGENTS.md` and `docs/rules/`. Layout reference: `docs/architecture.md` sections 11.1 to 11.3.

## Source layout

```
src/
├── main.ts              reads the role, boots that root module
├── entrypoints/         one Nest root module per role: gateway, api, worker
├── platform/            infrastructure with no business meaning, used by 2+ modules
└── modules/<module>/    one domain module
test/                    end-to-end tests through a booted app
```

`platform/` holds db, redis, queues, pubsub, config, logger, metrics, `UseCaseCtx`, base errors, abstract gateway tokens and test helpers. It never imports `modules/`. Env is read only in `platform/config`.

## Module anatomy

Files are grouped by type and named `kebab-case.<type>.ts`. Classes are PascalCase and end with their type. Example, the `identity` module:

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
- Database: each module owns its Postgres schema. Tenant tables have `workspace_id` and an RLS policy. `SystemDb` is used only from the allow-list in `.dependency-cruiser.cjs`.
- Tests: `*.spec.ts` runs against real Postgres with RLS. Fake only external gateways, using the fakes in `platform/testing`.
- A new module needs: its core module, the transport modules it uses, `index.ts`, and a line in each root module in `entrypoints/`.
