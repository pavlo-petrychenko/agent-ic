# agent-ic

agent-ic is an API-first chat-agent builder. A small business builds an AI chat agent visually as a flow graph, gives it knowledge from its own documents, extends it with custom tools and publishes it to messengers such as Telegram. The backend is a NestJS modular monolith (GraphQL for the dashboard, REST for the channel gateway) on Postgres and Redis. The web app is a React single-page app. Both live in one pnpm and Turborepo monorepo.

## Commands

Node 24 and pnpm 10 come from `mise.toml`. The stack runs in Docker through `mise run <task>`; pnpm scripts run through mise: `mise exec -- pnpm <script>`.

| Task                                                              | What it does                                |
| ----------------------------------------------------------------- | ------------------------------------------- |
| `mise run setup`                                                  | one-time setup, then the stack is running   |
| `mise run start [svc...]` / `add <svc>`                           | start the stack or services / add one to it |
| `mise run stop [svc]` / `restart <svc>` / `status` / `logs [svc]` | operate the stack                           |
| `mise run shell <svc>`                                            | shell inside a service container            |
| `mise run db:migrate` / `db:reset` / `db:seed` / `db:psql [role]` | database                                    |
| `mise run codegen` / `check` / `test` / `e2e`                     | generated code, all guardrails, tests       |

| Command                             | What it does                                                             |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `pnpm install`                      | install dependencies                                                     |
| `pnpm dev`                          | run apps in watch mode                                                   |
| `pnpm build`                        | build packages and the web app                                           |
| `pnpm typecheck`                    | `tsc` in every package                                                   |
| `pnpm lint`                         | oxlint, type-aware                                                       |
| `pnpm format` / `pnpm format:check` | oxfmt, write / check                                                     |
| `pnpm depcruise`                    | dependency-cruiser boundary rules                                        |
| `pnpm check:comments`               | fails on any comment                                                     |
| `pnpm check:structure`              | fails on a folder or file suffix not listed in `docs/rules/structure.md` |
| `pnpm test`                         | tests through Turborepo, plus the tests of `tools/`                      |

Turborepo behaviour can differ from what you remember. Its docs ship with the installed package: `node_modules/turbo/docs/`.

## Docs map

| Need                                      | Read                      |
| ----------------------------------------- | ------------------------- |
| What the product does and does not do     | `docs/mvp-scope.md`       |
| Decisions D1 to D150, layout, data flow   | `docs/architecture.md`    |
| Why a decision was made                   | `docs/adr/`               |
| Code, architecture, testing and git rules | `docs/rules/`             |
| Where every file goes and why             | `docs/rules/structure.md` |
| Backend module anatomy                    | `apps/backend/AGENTS.md`  |
| Web feature anatomy                       | `apps/web/AGENTS.md`      |
| How people contribute and review          | `CONTRIBUTING.md`         |
| What each shared package holds            | `packages/*/README.md`    |

## Hard rules

Details and reasons are in `docs/rules/`. A tool enforces each rule marked with its name.

1. No comments in code. Only `oxlint-disable-next-line`, `@ts-expect-error` and `/// <reference>` (`check:comments`).
2. TypeScript strict. No `any`, no `!`, no default exports except config, route and story files (oxlint).
3. Backend uses classes for use cases, services, repositories, gateways and inbound adapters; logic without state is a pure helper function. Web uses function components and hooks.
4. No `console.*`; use the logger (oxlint).
5. No `process.env` outside `apps/backend/src/platform/config` (oxlint).
6. Backend layers go inbound (resolver, controller, processor, listener), use case, service, repository. No use case calls a use case (`depcruise`).
7. Another backend module is used only through its `index.ts` (`depcruise`).
8. `platform/` never imports `modules/` (`depcruise`). `platform/` has no use cases: its controllers call platform services directly.
9. Drizzle and SQL only in repositories; every tenant table has `workspace_id` and RLS.
10. `SystemDatabaseService` only from the allow-list in `.dependency-cruiser.cjs` (`depcruise`).
11. A use case checks permissions first, and is one transaction. Side effects go through jobs or events after commit.
12. Throw `DomainError` subclasses; never swallow errors.
13. Time, randomness and ids are services, even without state, so tests can replace them: `ClockService`, `IdService`, `SecureTokenService`. Never `new Date()` or `randomUUID()` in domain code.
14. Web feature layers are communication, logic, storage, view, containers. Another feature only through its `index.ts` (`depcruise`).
15. Radix only inside `apps/web/src/shared/ui` (`depcruise`).
16. Web types use `null`, never `undefined`, for missing API data.
17. `apps` import `packages`; apps never import each other (`depcruise`).
18. Every new behaviour has a test; a bug fix has a test that fails without it.
19. Conventional commits and pull request titles; squash merge; small pull requests.
20. No hardcoded values: enums and named constants, config only from env through the zod config, no env values in scripts (review).
21. Types, constants and helpers live in the `typedefs/`, `constants/` and `helpers/` kind folders, one file per topic: `<topic>.typedefs.ts`, `<topic>.constants.ts`, `<topic>.helpers.ts` (review).
22. A file lives at `<area>/<kind folder>/<topic>.<kind>.ts`. A backend module root holds only `<name>.module.ts` and `index.ts`; a web feature root holds only `index.ts`. An unknown folder or suffix fails the check (`check:structure`).
23. Imports are absolute: `@/…` in `src`, `@test/…` in test support, packages by name. Never relative, not even in the same folder. No blank lines between imports (oxlint, oxfmt).
24. No value classes. Data is an interface in `typedefs/`, logic on it is a helper. Jobs, events, channels, cache entries and rate-limit policies are made with `defineX({...})` helpers, not abstract definition classes (review).

## What lives where and why

The full spec, with the reasons, is in [docs/rules/structure.md](docs/rules/structure.md). A file is named `<topic>.<kind>.ts` and lives in the folder of its kind, inside a backend module (`src/modules/<m>/`), a platform module (`src/platform/<p>/`) or a web feature (`src/features/<f>/`). Folders appear only when they have files.

### Backend

| Kind                 | Folder                                                | Holds                                                                                                   | Why                                                                                                |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Resolver             | `resolvers/` `.resolver.ts`                           | a GraphQL query, mutation or subscription; calls one use case                                           | every entry point looks the same, so permissions, transactions and errors are handled in one place |
| Controller           | `controllers/` `.controller.ts`                       | a REST endpoint (cookies, the gateway); calls one use case                                              | same as above                                                                                      |
| Processor            | `processors/` `.processor.ts`                         | a job taken from a queue; calls one use case                                                            | same as above                                                                                      |
| Listener             | `listeners/` `.listener.ts`                           | a domain event from another module; calls one use case                                                  | same as above                                                                                      |
| GraphQL SDL          | `graphql/` `<m>.graphql`                              | the module's schema                                                                                     | schema first, one file per module                                                                  |
| Job                  | `jobs/` `.job.ts`                                     | background work this module accepts: queue, name, payload schema (IDs only), made with `defineJob`      | sender and receiver share one typed shape                                                          |
| Event                | `events/` `.event.ts`                                 | a fact this module announces: name, payload schema, made with `defineDomainEvent`                       | other modules react without the sender knowing them                                                |
| Channel              | `channels/` `.channel.ts`                             | a live-update channel behind a subscription, made with `defineChannel`                                  | best-effort fan-out to open browser tabs                                                           |
| Use case             | `use-cases/` `.use-case.ts`                           | one business operation: authorize first, one transaction                                                | the one place that reads as the business flow                                                      |
| Service              | `services/` `.service.ts`                             | logic with state or dependencies, shared by use cases or platform; abstract services for internal ports | reuse without calling another use case                                                             |
| Repository           | `repositories/` `.repository.ts`                      | Drizzle and SQL                                                                                         | one place to audit tenant filtering                                                                |
| Gateway              | `gateways/` `.gateway.ts`, `.fake.ts`                 | an external system: abstract class, implementations, a fake                                             | external calls are replaceable in tests                                                            |
| Table                | `db/` `.table.ts`                                     | Drizzle tables in the module's Postgres schema                                                          | one schema per module                                                                              |
| Error                | `errors/` `.error.ts`                                 | `DomainError` subclasses                                                                                | one place for what can go wrong                                                                    |
| Schema               | `schemas/` `.schema.ts`                               | zod schemas                                                                                             | validation is data                                                                                 |
| Types, values, logic | `typedefs/`, `constants/`, `helpers/`                 | `.typedefs.ts`, `.constants.ts`, `.helpers.ts` (pure functions, mappers)                                | a class file holds the class only                                                                  |
| Nest plumbing        | `guards/`, `decorators/`, `filters/`, `interceptors/` | `.guard.ts`, `.decorator.ts`, `.filter.ts`, `.interceptor.ts`                                           | mostly in `platform/`                                                                              |
| Commands             | `app/commands/` `.command.ts`                         | `serve`, `migrate`, `print-schema`; only in `app/`                                                      | one binary, one entry                                                                              |
| Generated            | `generated/` `.generated.ts`                          | codegen output, gitignored                                                                              | never edited by hand                                                                               |

A spec sits next to its file (`.spec.ts`). Shared test support is in `apps/backend/test/support/` (`setup/`, `fakes/`, `fixtures/`, `helpers/`, `modules/`, and more), imported as `@test/support/…`. Specs through a booted app are in `apps/backend/test/integration/`.

### Web

| Kind                        | Folder                                                                  | Holds                                                | Why                                |
| --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| Operation                   | `communication/gql/{query,mutation,subscription,fragment}/` `x.graphql` | a GraphQL operation; `x.generated.ts` beside it      | the API contract in one place      |
| Data hook                   | `communication/hooks/` `useX.ts`                                        | a hook that talks to the API                         | components never fetch             |
| API mapping                 | `communication/helpers/` `x.helpers.ts`                                 | API shape to UI shape                                | the UI never sees API types        |
| Behaviour                   | `logic/hooks/`, `logic/helpers/`                                        | behaviour hooks and pure functions, no data fetching | testable without a network         |
| Shared state                | `storage/`                                                              | state shared across components                       | server data stays in Apollo        |
| Presentational              | `view/<Name>/`                                                          | props in, events out                                 | reusable and cheap to test         |
| Screen                      | `containers/<Name>/`                                                    | wires communication, logic and view                  | one place per screen or panel      |
| Feature constants and types | `constants/`, `typedefs/` at the feature root                           | shared by every layer of the feature                 | one home, importable by all layers |
| Outside features            | `components/`, `layouts/`, `providers/`, `fields/` `<Name>/`            | components of `app/` and `shared/`                   | same folder shape as in features   |
| Context, client, error      | `contexts/`, `clients/`, `errors/`                                      | `x.context.ts`, `x.client.ts`, `x.error.ts`          | one kind per folder                |
| Fixture                     | `fixtures/` `x.fixture.ts`                                              | Apollo mocks and test data                           | tests share data                   |
| Translations                | `locales/{en,uk}/` `*.json`                                             | user-facing text                                     | no text in code                    |

A component folder is flat: `Name.tsx`, `Name.module.scss`, `Name.test.tsx`, `Name.typedefs.ts`, `Name.constants.ts`, `index.ts`. Stories exist only in `shared/ui`. Test support is in `apps/web/test/support/`, imported as `@test/support/…`.

### Common changes

- New GraphQL field: `modules/<m>/graphql/<m>.graphql`, a resolver in `resolvers/`, a use case in `use-cases/`. The resolver returns the generated GraphQL type; the use case returns the module's typedefs; a helper maps between them when the shapes differ.
- New REST endpoint: a controller in `controllers/` calling one use case. New background job: `jobs/` plus a processor in `processors/`, payload holds IDs only.
- New table: `modules/<m>/db/<name>.table.ts` in `moduleSchema('<m>')`, with `workspaceIdColumn()` and `tenantIsolationPolicy()`; `pnpm --filter backend db:generate`, then append `FORCE ROW LEVEL SECURITY`.
- New env variable: the zod schema in `apps/backend/src/platform/config/schemas/`.
- Use another module's data: import its service or repository from `@/modules/<other>` (its `index.ts`).
- Infrastructure used by two or more modules, with no business meaning: `apps/backend/src/platform/<name>/`. A platform folder is never named after a kind folder (`database`, not `db`).
- Types, limits, error codes and permissions used by both apps: `packages/contracts`. Flow-graph schema and validation: `packages/flow`.
- New web screen: a container in `features/<f>/containers/<Name>/`, wired by a route in `routes/`. A reusable UI primitive goes in `apps/web/src/shared/ui/`, the only place Radix may appear.

## Definition of done

1. `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm depcruise`, `pnpm check:comments`, `pnpm check:structure` and `pnpm test` pass.
2. New behaviour has tests; a bug fix has a test that fails without it.
3. Migrations are expand-only, or the pull request says it is the contract step.
4. Docs, ADRs or `docs/architecture.md` are updated when a decision changes.
5. No secrets, no comments, no leftover debug code.
6. The pull request title is a conventional commit and the diff is small enough to review. A pull request that changes UI carries screenshots, stored on the `pr-assets` branch.
