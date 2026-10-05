# Example: the identity module

[Back to the docs](../README.md)

A tour of a real backend module, file by file. The code is not pasted here, because pasted code goes stale. Open each link and read the file next to this page.

The `identity` module owns users, sessions, workspaces, memberships and invite links. It lives in [modules/identity](../../apps/backend/src/modules/identity/). There is no separate `workspaces` module: workspaces, members and invite links are all part of `identity`. Ask in review before you create a new module.

We follow two real operations, in the order you would write them:

- `createWorkspace`: a signed-in user creates a workspace. It runs before the user has any workspace.
- `updateInviteLinkRole`: an owner or admin changes the role the invite link gives. It runs inside a workspace and checks permissions.

Concepts used here are explained in [004 Request lifecycle](../learn/004-request-lifecycle.md), [005 Request context](../learn/005-request-context.md), [006 Transactions and RLS](../learn/006-transactions-and-rls.md) and [007 Errors](../learn/007-errors.md).

## 1. GraphQL SDL

[graphql/workspaces.graphql](../../apps/backend/src/modules/identity/graphql/workspaces.graphql)

The schema comes first. A module can have several `.graphql` files; `identity` has `identity.graphql` and `workspaces.graphql`. Each file adds to the root `Query` and `Mutation` with `extend type`.

- Find `createWorkspace` and `updateInviteLinkRole` under `extend type Mutation`.
- The input types (`CreateWorkspaceInput`, `UpdateInviteLinkRoleInput`) sit in the same file.
- After you change a `.graphql` file, run `mise run codegen`. The generated types go to a gitignored file, `platform/graphql-server/generated/schema.generated.ts`, so never commit it.

## 2. Types and input validation

Before the use case, write what it takes and returns.

- [typedefs/workspace.typedefs.ts](../../apps/backend/src/modules/identity/typedefs/workspace.typedefs.ts): the module's own interfaces, such as `CreateWorkspaceInput` and `WorkspaceMembership`. They are not the generated GraphQL types.
- [schemas/workspace-input.schema.ts](../../apps/backend/src/modules/identity/schemas/workspace-input.schema.ts): the zod schemas. Notice that the field names are enum values (`WorkspaceField`), and the name limit `WORKSPACE_NAME_MAX_LENGTH` comes from `@agent-ic/contracts`, because the web form uses the same limit.
- [helpers/workspace-input.helpers.ts](../../apps/backend/src/modules/identity/helpers/workspace-input.helpers.ts): `parseWorkspaceInput` throws `InvalidWorkspaceInputError` with one issue per bad field, so the web form can show the error next to the field. The field-to-reason map is `WORKSPACE_FIELD_REASON` in [constants/workspace.constants.ts](../../apps/backend/src/modules/identity/constants/workspace.constants.ts).

## 3. The use case

[use-cases/create-workspace.use-case.ts](../../apps/backend/src/modules/identity/use-cases/create-workspace.use-case.ts)

A use case is one `@Injectable()` class with one method, `execute(ctx, input)`. It should read like the business flow. What to notice:

- **Permissions first.** There is no workspace yet, so it only checks that the caller is signed in with `requireUserActor(ctx)`.
- **One transaction.** `TenantTransactionService.run(workspaceId, work)` opens a transaction and tells Postgres which workspace it is in. Row-level security then hides the rows of every other workspace.
- **No `new Date()`, no `randomUUID()`.** `ClockService` and `IdService` give the time and the ids, so a test can replace them.
- **Public ids.** Inside the backend an id is a UUID. Outside it has a prefix (`IdPrefix.Workspace`). `ids.toPublic` adds the prefix.
- **Related rows in the same transaction.** The owner membership and the first invite link are created together with the workspace, through [InviteLinksService](../../apps/backend/src/modules/identity/services/invite-links.service.ts).

Now the version that runs inside a workspace: [use-cases/update-invite-link-role.use-case.ts](../../apps/backend/src/modules/identity/use-cases/update-invite-link-role.use-case.ts).

- **`authorize(ctx, resource, action)` is the first line.** It checks the caller's role against `PERMISSION_MATRIX` in [permission.constants.ts](../../packages/contracts/src/permissions/permission.constants.ts) and throws when the role is not allowed. The helper is [authorize.helpers.ts](../../apps/backend/src/platform/context/helpers/authorize.helpers.ts).
- **Where `ctx.workspaceId` comes from.** The web app sends the header `x-workspace-id`. The platform checks that the user is a member and fills `ctx.workspaceId` and `ctx.workspaceRole` ([use-case-ctx.service.ts](../../apps/backend/src/platform/context/services/use-case-ctx.service.ts)). A use case never reads the header.
- **Errors are classes.** [role-not-invitable.error.ts](../../apps/backend/src/modules/identity/errors/role-not-invitable.error.ts) extends `DomainError` and sets a `kind` and a `reason`. The web app turns the reason into a translated message.
- **No use case calls another use case.** Shared logic lives in a service, here `InviteLinksService`.

## 4. The repository

[repositories/workspaces.repository.ts](../../apps/backend/src/modules/identity/repositories/workspaces.repository.ts)

The repository is the only place with Drizzle and SQL. It reads `txHost.tx`, which is the open transaction.

- Every query also filters by `workspaceId`, even though row-level security protects it too. Two locks are better than one.
- A missing row is `null`, never `undefined`.
- The table is [db/workspaces.table.ts](../../apps/backend/src/modules/identity/db/workspaces.table.ts): it has `workspaceIdColumn()`, `tenantIsolationPolicy` and `.enableRLS()`. The migrations are in [apps/backend/migrations](../../apps/backend/migrations/).

## 5. The resolver

[resolvers/create-workspace.resolver.ts](../../apps/backend/src/modules/identity/resolvers/create-workspace.resolver.ts)

The resolver is thin: take the context and the input, call one use case, map the result to the GraphQL type.

- The method name must match the field name in the SDL.
- `toGraphqlMembership` is in [helpers/workspace-graphql.helpers.ts](../../apps/backend/src/modules/identity/helpers/workspace-graphql.helpers.ts). It maps the module's types to the generated ones, for example the role enum.
- A resolver never imports a service or a repository. `pnpm depcruise` fails if it does.
- Compare with [update-invite-link-role.resolver.ts](../../apps/backend/src/modules/identity/resolvers/update-invite-link-role.resolver.ts): same shape, a different mapper.

## 6. The module

[identity.module.ts](../../apps/backend/src/modules/identity/identity.module.ts) and [index.ts](../../apps/backend/src/modules/identity/index.ts)

- A new use case goes under `providers`, a new resolver under `resolvers`.
- `defineModule` mounts resolvers only in the `api` role and processors only in the `worker` role. Look at `controllers` (the REST `AuthController`) and `processors` (the recurring clean-up) in the same file.
- The app refuses to boot when a GraphQL root field has no resolver ([resolver-binding-check.service.ts](../../apps/backend/src/platform/graphql-server/services/resolver-binding-check.service.ts)), so a forgotten line shows up at once.
- `index.ts` is what other modules may import. It never exports use cases or resolvers.

## 7. The tests (optional)

- [use-cases/update-invite-link-role.use-case.spec.ts](../../apps/backend/src/modules/identity/use-cases/update-invite-link-role.use-case.spec.ts): a use case spec runs against a real Postgres with RLS, so Docker must be running. See "refuses an operator". Test names describe behaviour, not calls.
- [use-cases/create-workspace.use-case.spec.ts](../../apps/backend/src/modules/identity/use-cases/create-workspace.use-case.spec.ts): the owner, the invite link, and the field-by-field errors.
- [repositories/workspaces.repository.spec.ts](../../apps/backend/src/modules/identity/repositories/workspaces.repository.spec.ts): a cross-tenant case. Workspace B never sees workspace A.
- Helpers (`createIdentityTestbed`, `createOwnedWorkspace`, `addMember`, `ownerCtx`) are in [test/support/helpers](../../apps/backend/test/support/helpers/); `workspaceCtx` is in [test/support/fixtures](../../apps/backend/test/support/fixtures/).
- Run the backend tests with `mise exec -- pnpm --filter backend test`. Run `mise run codegen` first, because specs import generated types. Rules for tests: [docs/rules/testing.md](../rules/testing.md).

## Also in this module

- Rate limits on public operations: [constants/rate-limit.constants.ts](../../apps/backend/src/modules/identity/constants/rate-limit.constants.ts) (see [012](../learn/012-cache-and-rate-limits.md)).
- A recurring job: [processors/clean-up-auth-records.processor.ts](../../apps/backend/src/modules/identity/processors/clean-up-auth-records.processor.ts) and its [job](../../apps/backend/src/modules/identity/jobs/clean-up-auth-records.job.ts).
- Events other modules react to: [events/](../../apps/backend/src/modules/identity/events/).

Next: the web side of the same operations, [Auth and settings](auth-and-settings.md).
