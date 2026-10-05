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
| `mise run codegen` / `check` / `test`                             | generated code, all guardrails, tests       |
| `mise run chart:validate` / `lint:workflows`                      | Helm chart checks, GitHub workflow lint     |

The stack tasks run `node tools/dev.ts <task>`; `pnpm stack <task>` is the same without mise (native Windows uses it after `tools/windows/setup.ps1`).

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

| Need                                                      | Read                             |
| --------------------------------------------------------- | -------------------------------- |
| Where to start: the product, a repo map, the reading path | `docs/README.md`                 |
| One concept per page, read in order                       | `docs/learn/`                    |
| What the product does and does not do                     | `docs/design/mvp-scope.md`       |
| Decisions D1 to D191, layout, data flow                   | `docs/design/architecture.md`    |
| Why a decision was made                                   | `docs/design/adr/`               |
| Design-system names: design pages vs `shared/ui`          | `docs/design/ui/name-mapping.md` |
| Code, architecture, testing and git rules                 | `docs/rules/`                    |
| Where every file goes and why                             | `docs/rules/structure.md`        |
| Backend module anatomy                                    | `apps/backend/AGENTS.md`         |
| Web feature anatomy                                       | `apps/web/AGENTS.md`             |
| How people contribute and review                          | `CONTRIBUTING.md`                |
| What each shared package holds                            | `packages/*/README.md`           |

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
18. Tests are optional during the MVP: write them where they help. Existing tests keep passing, and a test you write follows `docs/rules/testing.md`.
19. Conventional commits and pull request titles; squash merge; small pull requests.
20. No hardcoded values: enums and named constants, config only from env through the zod config, no env values in scripts (review).
21. Types, constants and helpers live in the `typedefs/`, `constants/` and `helpers/` kind folders, one file per topic: `<topic>.typedefs.ts`, `<topic>.constants.ts`, `<topic>.helpers.ts` (review).
22. A file lives at `<area>/<kind folder>/<topic>.<kind>.ts`. A backend module root holds only `<name>.module.ts` and `index.ts`; a web feature root holds only `index.ts`. An unknown folder or suffix fails the check (`check:structure`).
23. Imports are absolute: `@/…` in `src`, `@test/…` in test support, packages by name. Never relative, not even in the same folder. No blank lines between imports (oxlint, oxfmt).
24. No value classes. Data is an interface in `typedefs/`, logic on it is a helper. Jobs, events, channels, cache entries and rate-limit policies are made with `defineX({...})` helpers, not abstract definition classes (review).

## What lives where and why

A file is named `<topic>.<kind>.ts` and lives in the folder of its kind, inside a backend module (`src/modules/<m>/`), a platform module (`src/platform/<p>/`) or a web feature (`src/features/<f>/`). Folders appear only when they have files.

- Every kind folder and suffix, with the reason for each: [docs/rules/structure.md](docs/rules/structure.md).
- Backend module anatomy, kind by kind: [apps/backend/AGENTS.md](apps/backend/AGENTS.md).
- Web feature anatomy, layer by layer: [apps/web/AGENTS.md](apps/web/AGENTS.md).

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
2. Tests are optional during the MVP (rule 18); the existing ones pass.
3. Migrations are expand-only, or the pull request says it is the contract step.
4. Docs, ADRs or `docs/design/architecture.md` are updated when a decision changes.
5. No secrets, no comments, no leftover debug code.
6. The pull request title is a conventional commit and the diff is small enough to review. A pull request that changes UI carries screenshots, stored on the `pr-assets` branch.
