# Architecture rules

Enforced by dependency-cruiser (`pnpm depcruise`, CI) where a rule names a path or a file suffix, by review otherwise. Background: ADRs 0009 to 0015 and [architecture.md](../architecture.md) section 11.

## Backend

1. **Layers:** transport, use case, service, repository.
   - A transport (`*.resolver.ts`, `*.controller.ts`, `*.processor.ts`) calls **one** use case and never touches services or repositories.
   - A use case (`*.use-case.ts`) never calls another use case.
   - Calls only go down: a repository never imports a service, a service never imports a use case.
2. **Another module is used only through its `index.ts`** (services and repositories).
3. **`platform/` never imports `modules/`.**
4. A use case checks permissions first (`authorize(ctx, …)`).
5. One use case is one transaction. No transaction is held across an external call. No fire-and-forget.
6. Side effects go only through `jobs.enqueue` or `domainEvents.emit`, after the commit. Job payloads hold IDs only.
7. Drizzle and SQL only in repositories.
8. Every tenant table has `workspace_id` and an RLS policy. `SystemDb` is imported only from files on an allow-list in `.dependency-cruiser.cjs`.
9. Each module owns its Postgres schema. No joins across schemas.

Example: `identity` exposes `SessionsService` and `UsersRepository` through `modules/identity/index.ts`. `workspaces` imports them from `modules/identity`, never from `modules/identity/services/…`.

## Web

1. **Feature layers**
   - `routes` import a feature `index.ts`.
   - `containers` import their own feature's `communication`, `logic`, `storage` and `view`.
   - `communication` imports `shared` and its own `communication` files only.
   - `logic` imports `shared`, `logic` and `storage`.
   - `view` imports `view`, `storage` and `shared/ui`.
   - `storage` imports nothing in the feature.
2. **Another feature only through its `index.ts`.** `shared/` never imports a feature.
3. **Radix only inside `shared/ui`.**
4. Tailwind only for layout. Visual styles live in `.module.scss` with tokens.
5. Server data lives only in the Apollo cache. No `fetch` outside `shared/api`.

Example: `features/auth` exports `LoginScreen` and `useSession` from `features/auth/index.ts`. A route imports `LoginScreen` from `@/features/auth`.

## Repo

`apps` import `packages` only. Packages never import apps. Apps never import each other.
