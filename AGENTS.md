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

| Command                             | What it does                      |
| ----------------------------------- | --------------------------------- |
| `pnpm install`                      | install dependencies              |
| `pnpm dev`                          | run apps in watch mode            |
| `pnpm build`                        | build packages and the web app    |
| `pnpm typecheck`                    | `tsc` in every package            |
| `pnpm lint`                         | oxlint, type-aware                |
| `pnpm format` / `pnpm format:check` | oxfmt, write / check              |
| `pnpm depcruise`                    | dependency-cruiser boundary rules |
| `pnpm check:comments`               | fails on any comment              |
| `pnpm test`                         | tests through Turborepo           |

Turborepo behaviour can differ from what you remember. Its docs ship with the installed package: `node_modules/turbo/docs/`.

## Docs map

| Need                                      | Read                     |
| ----------------------------------------- | ------------------------ |
| What the product does and does not do     | `docs/mvp-scope.md`      |
| Decisions D1 to D123, layout, data flow   | `docs/architecture.md`   |
| Why a decision was made                   | `docs/adr/`              |
| Code, architecture, testing and git rules | `docs/rules/`            |
| Backend module anatomy                    | `apps/backend/AGENTS.md` |
| Web feature anatomy                       | `apps/web/AGENTS.md`     |
| How people contribute and review          | `CONTRIBUTING.md`        |
| What each shared package holds            | `packages/*/README.md`   |

## Hard rules

Details and reasons are in `docs/rules/`. A tool enforces each rule marked with its name.

1. No comments in code. Only `oxlint-disable-next-line`, `@ts-expect-error` and `/// <reference>` (`check:comments`).
2. TypeScript strict. No `any`, no `!`, no default exports except config, route and story files (oxlint).
3. Backend uses classes; web uses function components and hooks.
4. No `console.*`; use the logger (oxlint).
5. No `process.env` outside `apps/backend/src/platform/config` (oxlint).
6. Backend layers go transport, use case, service, repository. No use case calls a use case (`depcruise`).
7. Another backend module is used only through its `index.ts` (`depcruise`).
8. `platform/` never imports `modules/` (`depcruise`).
9. Drizzle and SQL only in repositories; every tenant table has `workspace_id` and RLS.
10. `SystemDatabaseService` only from the allow-list in `.dependency-cruiser.cjs` (`depcruise`).
11. A use case checks permissions first, and is one transaction. Side effects go through jobs or events after commit.
12. Throw `DomainError` subclasses; never swallow errors.
13. Use `Clock` and `IdService`, never `new Date()` or `randomUUID()` in domain code.
14. Web feature layers are communication, logic, storage, view, containers. Another feature only through its `index.ts` (`depcruise`).
15. Radix only inside `apps/web/src/shared/ui` (`depcruise`).
16. Web types use `null`, never `undefined`, for missing API data.
17. `apps` import `packages`; apps never import each other (`depcruise`).
18. Every new behaviour has a test; a bug fix has a test that fails without it.
19. Conventional commits and pull request titles; squash merge; small pull requests.
20. No hardcoded values: enums and named constants, config only from env through the zod config, no env values in scripts (review).
21. Types, constants and helpers live in `<name>.typedefs.ts`, `<name>.constants.ts` and `<name>.helpers.ts` beside the code (review).

## Where does new code go

| Change                                                    | Where                                                                                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New GraphQL field                                         | `modules/<m>/graphql/<m>.graphql` (SDL), a resolver in `resolvers/`, a use case in `use-cases/`                                                                                                  |
| New REST endpoint                                         | a controller in `modules/<m>/http/` calling one use case                                                                                                                                         |
| New background job                                        | a processor in `modules/<m>/jobs/` calling one use case; payload holds IDs only                                                                                                                  |
| New business operation                                    | `modules/<m>/use-cases/<name>.use-case.ts` with a `.spec.ts` beside it                                                                                                                           |
| Logic shared by use cases                                 | `modules/<m>/services/`                                                                                                                                                                          |
| New table                                                 | `modules/<m>/db/<name>.table.ts` in `moduleSchema('<m>')`, with `workspaceIdColumn()` and `tenantIsolationPolicy()`; `pnpm --filter backend db:generate`, then append `FORCE ROW LEVEL SECURITY` |
| New query                                                 | a method on a repository in `modules/<m>/repositories/`                                                                                                                                          |
| New external service client                               | an abstract gateway plus an implementation and a fake in `modules/<m>/gateways/`                                                                                                                 |
| Infrastructure used by 2+ modules, no business meaning    | `apps/backend/src/platform/`                                                                                                                                                                     |
| New env variable                                          | `apps/backend/src/platform/config/` (zod schema)                                                                                                                                                 |
| New domain error                                          | `modules/<m>/domain/`                                                                                                                                                                            |
| Use another module's data                                 | import its service or repository from `modules/<other>` (its `index.ts`)                                                                                                                         |
| New screen                                                | a container in `features/<f>/containers/`, wired by a route in `routes/`                                                                                                                         |
| New GraphQL operation on the web                          | `features/<f>/communication/x.graphql` plus a data hook                                                                                                                                          |
| New behaviour hook or pure helper                         | `features/<f>/logic/`                                                                                                                                                                            |
| State shared across components                            | `features/<f>/storage/`                                                                                                                                                                          |
| New presentational component                              | `features/<f>/view/<Name>/`                                                                                                                                                                      |
| Reusable UI primitive                                     | `apps/web/src/shared/ui/` (the only place Radix may appear)                                                                                                                                      |
| Types, limits, error codes, permissions used by both apps | `packages/contracts`                                                                                                                                                                             |
| Flow-graph schema and validation                          | `packages/flow`                                                                                                                                                                                  |

## Definition of done

1. `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm depcruise`, `pnpm check:comments` and `pnpm test` pass.
2. New behaviour has tests; a bug fix has a test that fails without it.
3. Migrations are expand-only, or the pull request says it is the contract step.
4. Docs, ADRs or `docs/architecture.md` are updated when a decision changes.
5. No secrets, no comments, no leftover debug code.
6. The pull request title is a conventional commit and the diff is small enough to review.
