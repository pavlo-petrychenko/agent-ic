# Code structure

Where every file goes and why. `pnpm check:structure` (`tools/check-structure.ts`) rejects any folder or file suffix that is not listed here. To add a new kind, change this document and the checker first, in their own pull request.

## Global rules

1. **Folder by kind, file by topic.** A file lives at `<area>/<kind folder>/<topic>.<kind>.ts`, for example `use-cases/sign-up.use-case.ts`. A kind folder holds many small files named by topic, never one catch-all file. Why: you know where a thing is from what it is, and a file name says both.
2. **Area roots stay empty.** The root of a backend module holds only `<name>.module.ts` and `index.ts`. The root of a web feature holds only `index.ts`. Why: the root is the public surface; everything else is an implementation detail.
3. **A kind folder exists only when it has files.** No empty placeholders. A kind folder is flat: no nested folders (only web component folders nest).
4. **State decides between service and helper.** A class with state or injected dependencies is a service. Logic without state is a pure function in `helpers/`. Exception: time, randomness and ids are always services (`ClockService`, `IdService`, `SecureTokenService`), so tests can replace them.
5. **No value classes.** Data is an interface in `typedefs/`; logic on data is a helper. Definitions of jobs, events, channels, cache entries and rate-limit policies are made with `defineX({...})` helpers, not abstract classes.
6. **Class names end with their kind:** `SignUpUseCase`, `UsersRepository`, `ClockService`, `PlatformAdminGuard`.
7. **One home per constant.** A value used by two areas lives in the lower one (for example `MILLISECONDS_PER_SECOND` in `platform/clock`).
8. **Imports are absolute:** `@/…` in app source, `@test/…` in app test support, `@<package>/…` (`@contracts/…`, `@flow/…`) and `@test/…` inside a package, other packages by name. Relative paths and Node subpath imports (`#…`) are never used, not even within one folder. Imports have no blank lines between them. Why: a file reads the same wherever it sits, and moving it never rewrites its imports.

   A package declares its aliases as `paths` in its `tsconfig.json`:

   ```json
   "paths": {
     "@flow/*": ["./src/*"],
     "@test/*": ["./test/*"],
     "@contracts/*": ["../contracts/src/*"]
   }
   ```

   The alias is named after the package. A bare `@/…` would clash: an app reads package source through the `source` condition (D75), and there `@/…` already means the app's own `src`.

   Who resolves the aliases (D193):

   - `tsc` uses one `paths` map for the whole program, so every tsconfig that reads package source lists the package aliases it meets: `apps/web`, `apps/backend`, and `packages/flow` for `@contracts/*`.
   - Vite, Vitest and Storybook set `resolve.tsconfigPaths`, so each file resolves through its own package's `tsconfig.json`.
   - tsup bundles the JavaScript, and esbuild reads `paths`, so `dist` holds no alias.
   - `tsc` keeps the aliases in the emitted `.d.ts`. The package build then runs `tools/declaration-aliases.ts`, which rewrites them to relative paths in `dist` and fails if one is left.
   - A package that depends on another package emits its declarations without the `source` condition (`"customConditions": []` in `tsconfig.build.json`), so they name that package `@agent-ic/<name>` instead of its alias.
   - dependency-cruiser reads `tools/depcruise/*.tsconfig.json`; `packages.tsconfig.json` holds the package aliases.
   - The backend runtime, its image and its Vitest run read the built `dist`, so they need no alias.
9. **Generated code** lives in `generated/` (`.generated.ts`, gitignored) or next to its source when the generator requires it (`*.graphql` → `*.generated.ts` on the web).
10. **`src/` is production code only.** Unit specs sit next to the file they test; shared test support lives in `test/support/`.

## Backend

### Kinds

**Inbound.** Each one turns an outside trigger into exactly one use case call. Why: every entry point looks the same, so permissions, transactions and errors are handled in one place.

| Folder | Suffix | Trigger |
|---|---|---|
| `resolvers/` | `.resolver.ts` | a GraphQL query, mutation or subscription |
| `controllers/` | `.controller.ts` | a REST request (only endpoints that set cookies, and the gateway) |
| `processors/` | `.processor.ts` | a job taken from a queue by a worker |
| `listeners/` | `.listener.ts` | a domain event emitted by another module |

**Contracts.** Definitions only, no logic. Why: the sender and the receiver share one typed shape.

| Folder | Suffix | Defines |
|---|---|---|
| `graphql/` | `.graphql` | the module's GraphQL SDL |
| `jobs/` | `.job.ts` | background work this module accepts: queue, name, payload schema (IDs only) |
| `events/` | `.event.ts` | a fact this module announces: name, payload schema |
| `channels/` | `.channel.ts` | a live-update channel behind a GraphQL subscription |

How the three message kinds differ:

| | Job | Domain event | Channel |
|---|---|---|---|
| Sender knows the receiver | yes | no, any number of listeners | no |
| Runs | in a worker | in a worker, one job per listener | in open browser tabs |
| Survives a crash, retried | yes | yes | no, best effort |
| Use it for | work that must happen | letting other modules react without knowing them | keeping the UI fresh |

**Core.**

| Folder | Suffix | What and why |
|---|---|---|
| `use-cases/` | `.use-case.ts` | one business operation: checks permissions first, runs as one transaction, never calls another use case |
| `services/` | `.service.ts` | logic with state or dependencies, shared by use cases or by the platform; includes abstract services that another module implements (internal ports) |
| `repositories/` | `.repository.ts` | the only place with Drizzle and SQL |
| `gateways/` | `.gateway.ts`, `.fake.ts` | an external system: an abstract class, its implementations and a fake for tests |
| `db/` | `.table.ts` | Drizzle tables in the module's Postgres schema |

**Support.**

| Folder | Suffix | What |
|---|---|---|
| `errors/` | `.error.ts` | `DomainError` subclasses (or plain `Error` for programming faults) |
| `schemas/` | `.schema.ts` | zod schemas |
| `helpers/` | `.helpers.ts` | pure functions, including mappers between shapes |
| `constants/` | `.constants.ts` | enums and named values |
| `typedefs/` | `.typedefs.ts` | types and interfaces |
| `guards/` · `decorators/` · `filters/` · `interceptors/` | `.guard.ts` · `.decorator.ts` · `.filter.ts` · `.interceptor.ts` | Nest plumbing, mostly in `platform/` |
| `generated/` | `.generated.ts` | codegen output, gitignored |

Next to any file: `.spec.ts` (its test).

### Modules (`src/modules/<name>/`)

```
modules/identity/
├── identity.module.ts      defineModule({ providers, resolvers, controllers, processors, listeners })
├── index.ts                the module class + services and repositories other modules may use
├── graphql/identity.graphql
├── resolvers/  controllers/  processors/  listeners/
├── use-cases/  services/  repositories/  gateways/  db/
├── jobs/  events/  channels/
└── errors/  schemas/  helpers/  constants/  typedefs/
```

- **One Nest module per module.** `defineModule()` declares the transports; `forRole(role)` mounts only what that role runs (resolvers and controllers in `api`, processors and listeners in workers). A listener's subscription is registered in every role, so `api` knows where to fan out.
- **Resolvers return generated GraphQL types; use cases return the module's typedefs.** A helper maps between them when the shapes differ.
- **Another module is used only through its `index.ts`.** `index.ts` never exports use cases or transports.
- **Module errors** go in the module's `errors/`.

### Platform (`src/platform/<name>/`)

Infrastructure used by two or more modules, with no business meaning. Same kinds as modules, with three rules:

- **No use cases.** Platform controllers (health, metrics, queue board) call platform services directly, because they have no actor, no permissions and no transaction.
- **A platform folder may own tables.** A platform folder that needs its own table puts it in `db/` (`<name>.table.ts`) in its own Postgres schema, the same way a module does; `drizzle.config.ts` reads `src/platform/*/db/*.table.ts` as well as the modules. Example: `queues/db/outbox-message.table.ts`.
- **A platform folder never takes a kind-folder name.** Hence `database`, not `db`; `graphql-server`, not `graphql`; `live-updates`, not `channels`. The one exception is `errors`: it was named in the approved module list, it holds the base error classes in its own `errors/` folder, and no module-level `errors/` folder can be confused with it because platform folders sit one level higher.

| Module | Holds |
|---|---|
| `config` | env → zod → `ConfigService`; the only place that reads `process.env` |
| `context` | `UseCaseCtx`, actors, locale, trace id, the abstract authenticator |
| `errors` | `DomainError`, `UpstreamError`, how errors look on GraphQL, REST and in jobs |
| `database` | clients per Postgres role, tenant transactions, after-commit, RLS table helpers, migrations |
| `graphql-server` | Apollo setup, `@GraphqlCtx()`, Relay pagination, resolver binding check |
| `http` | HTTP constants only |
| `queues` | BullMQ, `JobsService.enqueue`, workers, Bull Board, KEDA metrics, the durable outbox (`outbox.messages` table and its sweeper) |
| `domain-events` | `emit()`, `@OnDomainEvent`, listener registry |
| `live-updates` | Redis pub/sub channels for GraphQL subscriptions |
| `observability` | logger, health, metrics, tracing |
| `module-roles` | `defineModule()`, `forRole()`, the `Role` enum |
| `admin` · `cache` · `clock` · `crypto` · `ids` · `rate-limit` · `redis` | one service each, plus their helpers |

A library may force a second Nest module in one folder (`database-clients.module.ts` for `nestjs-cls`). That is the only allowed case.

### App (`src/app/`) and the entry file

```
src/main.ts                 resolveCommand(process.argv).execute()
src/app/
├── app.module.ts           AppModule.forRole(config): lists every module
├── commands/               serve · migrate · print-schema (.command.ts, only allowed here)
├── schemas/                each command's CLI flags
└── constants/  typedefs/  helpers/
```

One binary: `node dist/main.js serve --role=api`, `node dist/main.js migrate`, `node dist/main.js print-schema --output=…`.

### Tests (`apps/backend/test/`)

```
test/
├── integration/            specs through a booted app, and the whole-database tenant schema check
└── support/
    ├── setup/              .setup.ts: Testcontainers once per run
    ├── fakes/              .fake.ts: replacements for platform services (ManualClock)
    ├── fixtures/           .fixture.ts: test data and builders
    ├── modules/            test-only Nest modules
    └── services/ helpers/ controllers/ resolvers/ processors/ jobs/ errors/ schemas/ constants/ typedefs/
```

## Web

### Kinds

Two levels. **Kind folders** inside each area, and **component folders** `<Name>/`. A component folder is a flat unit holding `Name.tsx`, `Name.module.scss`, `Name.test.tsx`, `Name.typedefs.ts`, `Name.constants.ts`, `index.ts`, and when the component owns them, `useX.ts` and `x.context.ts`. Stories (`Name.stories.tsx`) exist only in `shared/ui`. A private sub-component is a nested folder.

| Folder | File | What |
|---|---|---|
| `gql/{query,mutation,subscription,fragment}/` | `x.graphql` | GraphQL operations; `x.generated.ts` beside them, gitignored |
| `hooks/` | `useX.ts` | hooks |
| `helpers/` | `x.helpers.ts` | pure functions, including Apollo links and API → UI mapping |
| `view/` · `containers/` | `<Name>/` | feature components: presentational / screen-level |
| `components/` · `layouts/` · `providers/` · `fields/` | `<Name>/` | components outside features |
| `contexts/` | `x.context.ts` | React contexts |
| `clients/` | `x.client.ts` | configured singletons (Apollo client, i18next) |
| `errors/` | `x.error.ts` | error classes (`AppError`) |
| `schemas/` · `constants/` · `typedefs/` | | as on the backend |
| `fixtures/` | `x.fixture.ts` | Apollo mocks and test data |
| `locales/{en,uk}/` | `*.json` | translations |

### Features (`src/features/<name>/`)

```
features/status/
├── index.ts                         the only import point for routes and other features
├── constants/  typedefs/            shared by every layer of the feature
├── communication/                   talks to the API
│   ├── gql/query/serverStatus.graphql
│   ├── hooks/useServerStatus.ts
│   ├── helpers/serverStatus.helpers.ts     API → UI shape
│   └── fixtures/serverStatus.fixture.ts
├── logic/                           behaviour hooks and pure helpers
│   ├── hooks/useUptimeLabel.ts
│   └── helpers/uptime.helpers.ts
├── storage/                         state shared across components
├── view/ServerStatus/               presentational, no data fetching
└── containers/StatusPage/           wires communication + logic + view into a screen
```

Kind folders allowed per layer: `communication` has `gql/`, `hooks/`, `helpers/`, `schemas/`, `fixtures/`; `logic` has `hooks/`, `helpers/`, `schemas/`; `storage` has `contexts/`, `hooks/`, `helpers/`; `view` and `containers` hold component folders.

Layer rules (dependency-cruiser): `containers` → own `communication`, `logic`, `storage`, `view`; `view` → `view`, `storage`, `shared/ui`; `storage` → nothing in the feature; every layer → the feature's `constants/` and `typedefs/`.

### App and shared

```
app/
├── bootstrap.tsx · router.tsx       the only root files
├── components/  providers/  layouts/
└── constants/  typedefs/

shared/
├── api/      clients/ helpers/ errors/ schemas/ constants/ typedefs/
├── config/   helpers/ schemas/ constants/ typedefs/
├── forms/    hooks/ fields/ contexts/ helpers/ typedefs/
├── i18n/     clients/ hooks/ helpers/ locales/ constants/ typedefs/
├── theme/    clients/ hooks/ helpers/ constants/ typedefs/ (light, dark or system; applied as data-theme on <html>)
├── viewport/ hooks/ helpers/ constants/ typedefs/ (the wide, default, compact or unsupported breakpoint, from media queries)
├── ui/       component folders; the only place Radix may appear
└── styles/   tokens.css · global.scss · tailwind.css · index.ts (the one side-effect entry that imports fonts and the stylesheets in order)
```

Test support lives in `apps/web/test/support/` (`setup/`, `components/`, `helpers/`, `constants/`, `typedefs/`, `fixtures/`), imported as `@test/…`. Tests that cross areas, such as a route rendered through the router, live in `apps/web/test/integration/` (`.test.ts`, `.test.tsx`).

## Pull requests

A pull request that changes UI includes screenshots of every changed story or screen, stored on the `pr-assets` branch.
