# 006 Transactions and row-level security

[Back to the docs](../README.md)

## What it is

A use case runs in one database transaction. For data that belongs to a workspace, the transaction also names that workspace, and Postgres itself hides every other workspace's rows. This is row-level security (RLS).

There are three ways to reach the database:

| Way                                               | Use it for                                         | Sees                       |
| ------------------------------------------------- | -------------------------------------------------- | -------------------------- |
| `TenantTransactionService.run(workspaceId, work)` | work inside a workspace                            | only that workspace's rows |
| `txHost.withTransaction(work)`                    | work with no tenant: sign-up, login, a cleanup job | nothing in tenant tables   |
| `SystemDatabaseService`                           | rare lookups across workspaces                     | every row                  |

## Why we have it

If one workspace could read another's data, that would be the worst bug we can ship. A forgotten `where workspace_id = ...` in a query would cause it. So we do not rely on every query being right. The database refuses the row, even when the code forgets.

## How it works

```
use case
  -> authorize(ctx, ...)                    gives access.workspaceId
  -> tenantTransactions.run(workspaceId, () => {
        BEGIN
        set app.workspace_id = '<id>'   (local to this transaction)
        repository queries:  policy checks  workspace_id = app.workspace_id
        COMMIT, then the after-commit actions run
     })
```

1. `run` opens a transaction and sets `app.workspace_id` with `set_config(..., true)`. The setting lasts only until the transaction ends.
2. Every tenant table has a policy: a row is visible, and may be written, only when its `workspace_id` equals that setting.
3. With no setting, the app sees zero rows and cannot write.
4. A nested `run` for the same workspace joins the open transaction. A nested `run` for another workspace throws `TenantMismatchError`.

The app connects as the `app` role, which cannot skip RLS. `SystemDatabaseService` connects as `app_system`, which can. Tables also use `FORCE ROW LEVEL SECURITY`, so the policy applies to the table owner too.

### The after-commit buffer

Some work must happen only if the transaction commits: queue a job, publish a live update. `AfterCommitService.schedule(action)` puts the action in a buffer.

- On commit, the actions run in order.
- On rollback, they are dropped.
- Outside a transaction, the action runs at once.
- In a nested transaction, the actions move to the parent and wait for the outermost commit.
- If an action fails, the error is reported and the request does not fail.

`JobsService.enqueue` and `LiveUpdatesService.publish` both use it. Page 008 builds on this.

## Add one

A new table that belongs to a workspace. Every such table must have `workspace_id` and RLS. A test fails without them.

- [ ] File `modules/<m>/db/<name>.table.ts`. Make the table in the module's own Postgres schema with `moduleSchema('<m>')`. `identity` makes it once, as `identitySchema` in `modules/identity/db/users.table.ts`, and every table file imports it.
- [ ] Column `workspaceId: workspaceIdColumn()`.
- [ ] `tenantIsolationPolicy('<table name>')` in the table's extra config.
- [ ] `.enableRLS()` on the table.
- [ ] Example to copy: [workspaces.table.ts](../../apps/backend/src/modules/identity/db/workspaces.table.ts).
- [ ] Row types in `typedefs/`: `typeof table.$inferSelect` and `typeof table.$inferInsert`.
- [ ] Generate the migration: `mise exec -- pnpm --filter backend db:generate`. It writes a new SQL file in `apps/backend/migrations/`.
- [ ] Open the new SQL file. At the end, add one line per new table: `ALTER TABLE "<schema>"."<table>" FORCE ROW LEVEL SECURITY;`. drizzle-kit does not write it. See the end of [0003_identity-workspaces-invites.sql](../../apps/backend/migrations/0003_identity-workspaces-invites.sql).
- [ ] A new Postgres schema needs no grants. [0000_baseline-privileges.sql](../../apps/backend/migrations/0000_baseline-privileges.sql) gives the app roles access to every new schema and table.
- [ ] Apply it locally: `mise run db:migrate`.
- [ ] The migration only adds things (expand). Dropping or renaming a column is a separate, later pull request (contract), and its description says so.
- [ ] Never edit a migration after it is merged. Write a new one.
- [ ] A table that is not per workspace (rare: users, sessions) goes on `TENANT_EXEMPT_TABLES` in [tenant-schema.constants.ts](../../apps/backend/test/support/constants/tenant-schema.constants.ts). Ask in review first.
- [ ] Repository queries filter by `workspaceId` and run inside `TenantTransactionService.run(workspaceId, ...)`.
- [ ] Optional: a repository spec with a cross-tenant case, like [workspaces.repository.spec.ts](../../apps/backend/src/modules/identity/repositories/workspaces.repository.spec.ts).
- [ ] `mise run check` and `mise exec -- pnpm test` pass. The tenant schema test checks every table.

## In the code

- [platform/database/](../../apps/backend/src/platform/database/): the clients, `TenantTransactionService`, the after-commit buffer and the table helpers.
- [tenant-table.helpers.ts](../../apps/backend/src/platform/database/helpers/tenant-table.helpers.ts): `moduleSchema`, `workspaceIdColumn`, `tenantIsolationPolicy`.
- [tenant-transaction.service.ts](../../apps/backend/src/platform/database/services/tenant-transaction.service.ts): `run` and the mismatch guard.
- [after-commit.service.ts](../../apps/backend/src/platform/database/services/after-commit.service.ts): `schedule`.
- A tenant use case: [create-workspace.use-case.ts](../../apps/backend/src/modules/identity/use-cases/create-workspace.use-case.ts). It runs everything inside `tenantTransactions.run`.
- A use case with no tenant: [clean-up-auth-records.use-case.ts](../../apps/backend/src/modules/identity/use-cases/clean-up-auth-records.use-case.ts) uses `txHost.withTransaction`.
- A repository: [workspaces.repository.ts](../../apps/backend/src/modules/identity/repositories/workspaces.repository.ts). It reads `this.txHost.tx`, the current transaction.
- Specs: [tenant-transaction.service.spec.ts](../../apps/backend/src/platform/database/services/tenant-transaction.service.spec.ts) shows the isolation, and [tenant-schema.spec.ts](../../apps/backend/test/integration/tenant-schema.spec.ts) checks every table.

## Pitfalls

- `SystemDatabaseService` skips RLS. Only the allow-list in [.dependency-cruiser.cjs](../../.dependency-cruiser.cjs) may import it, and `pnpm depcruise` fails otherwise. Today two places use it: [membership-directory.repository.ts](../../apps/backend/src/modules/identity/repositories/membership-directory.repository.ts), which finds a user's workspaces before any workspace is chosen, and [outbox.repository.ts](../../apps/backend/src/platform/queues/repositories/outbox.repository.ts), which reads and deletes outbox rows. Filter by hand there.
- A repository must use `txHost.tx`. A query on another connection does not see the workspace setting and returns no rows.
- Do not hold a transaction open across an external call (email, AI provider). Use a job.
- Never call `queue.add()` or publish to Redis directly inside a use case. The commit may still fail. Use `JobsService` and `LiveUpdatesService`.
- `TenantMismatchError` is a plain `Error`, not a `DomainError`. It means a bug in the code, so the client gets a generic internal error.
- A table without `workspace_id` or without `FORCE ROW LEVEL SECURITY` fails the tenant schema test.

Next: [007 Errors](007-errors.md)
