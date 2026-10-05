# Architecture rules

Enforced by dependency-cruiser (`pnpm depcruise`, CI) where a rule names a path or a file suffix, by `pnpm check:structure` for folder and suffix layout, and by review otherwise. Background: ADRs 0009 to 0015 and [architecture.md](../design/architecture.md) section 11. Folder and file layout: [structure.md](structure.md).

## Backend

1. **Layers:** inbound adapter, use case, service, repository.
   - An inbound adapter (`.resolver.ts`, `.controller.ts`, `.processor.ts`, `.listener.ts`) calls **one** use case and never touches services, repositories or gateways.
   - The rule applies to `modules/`. `platform/` has no use cases, so its operational controllers (health, metrics, queue board) call platform services directly: they have no actor, no permissions and no transaction.
   - A use case (`.use-case.ts`) never calls another use case. Shared logic goes to a service.
   - Calls only go down: a repository never imports a service, a service never imports a use case.
2. **Another module is used only through its `index.ts`** (its module class, services and repositories). `index.ts` never exports use cases or inbound adapters.
3. **`platform/` never imports `modules/`.** A platform folder is never named after a kind folder (`database`, not `db`).
4. A use case checks permissions first (`authorize(ctx, …)`).
5. One use case is one transaction. No transaction is held across an external call. No fire-and-forget.
6. Side effects go only through `jobs.enqueue` or `domainEvents.emit`, after the commit. Job payloads hold IDs only. A domain event reaches each listener as its own job, so delivery is durable and retried, and one failing listener does not block the others.
7. Drizzle and SQL only in repositories.
8. Every tenant table has `workspace_id` and an RLS policy. `SystemDatabaseService` is imported only from files on an allow-list in `.dependency-cruiser.cjs`.
9. Each module owns its Postgres schema. No joins across schemas.
10. **One Nest module per module.** `defineModule()` declares providers and every transport; `forRole(role)` mounts only what that role runs.
11. **Resolvers return generated GraphQL types; use cases return the module's typedefs.** A helper maps between them when the shapes differ.
12. **Time, randomness and ids are services** (`ClockService`, `IdService`, `SecureTokenService`), so tests can replace them. Other stateless logic is a helper.

Example: `identity` exposes `SessionsService` and `UsersRepository` through `modules/identity/index.ts`. `workspaces` imports them from `@/modules/identity`, never from `@/modules/identity/services/…`.

## Web

1. **Feature layers**
   - `routes` import a feature `index.ts`.
   - `containers` import their own feature's `communication`, `logic`, `storage` and `view`.
   - `communication` imports `shared` and its own `communication` files only.
   - `logic` imports `shared`, `logic` and `storage`.
   - `view` imports `view`, `storage` and `shared/ui`. Test files are exempt, so view tests may use the shared test helpers.
   - `storage` imports nothing in the feature.
   - Every layer may import the feature's own `constants/` and `typedefs/`.
2. **Another feature only through its `index.ts`.** `shared/` never imports a feature.
3. **Radix only inside `shared/ui`.**
4. Tailwind only for layout. Visual styles live in `.module.scss` with tokens.
5. Server data lives only in the Apollo cache. No `fetch` outside `shared/api`.

Example: `features/status` exports `StatusPage` from `features/status/index.ts`. A route imports `StatusPage` from `@/features/status`.

## Repo

`apps` import `packages` only. Packages never import apps. Apps never import each other. `src/` is production code only: it imports test support (`apps/*/test/`) only from `.spec`, `.test` and `.stories` files. Test support may import anything.
