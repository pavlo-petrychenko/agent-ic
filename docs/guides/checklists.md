# Checklists

[Back to the guide](README.md)

Tick every box before you open the pull request. Each list ends with the same step: `mise run check` and `mise exec -- pnpm test` pass.

## A new backend module

Create a module only for a new business area. Workspaces, members and invites are part of `identity`, not their own module. Ask in review when unsure.

- [ ] Folder `apps/backend/src/modules/<name>/`. Its root holds only `<name>.module.ts` and `index.ts`.
- [ ] `<name>.module.ts` exports `class <Name>Module extends defineModule({ providers, resolvers, controllers, processors, listeners, exports })`. Leave out the keys you do not need. See `modules/system/system.module.ts` for the smallest one.
- [ ] `index.ts` exports the module class and only what other modules may use (services, repositories, events). Never use cases or resolvers.
- [ ] One line in `DOMAIN_MODULES` in `apps/backend/src/app/constants/app-modules.constants.ts`.
- [ ] Every other file goes into a kind folder: `graphql/`, `resolvers/`, `use-cases/`, `services/`, `repositories/`, `db/`, `errors/`, `typedefs/`, `constants/`, `helpers/` and the others in [docs/rules/structure.md](../rules/structure.md). Create a folder only when it has a file.
- [ ] GraphQL SDL in `graphql/<name>.graphql`, using `extend type Query` and `extend type Mutation`. Then `mise run codegen`.
- [ ] Another module is used only through its `index.ts`: `import { X } from '@/modules/identity'`.
- [ ] If the module owns tables, follow the next list.
- [ ] `mise run check` and `mise exec -- pnpm test` pass.

## A new table

Every table that belongs to a workspace must have `workspace_id` and row-level security (RLS). A test fails without them.

- [ ] File `modules/<m>/db/<name>.table.ts`. The table is in the module's own Postgres schema, made with `moduleSchema('<m>')` from `@/platform/database/helpers/tenant-table.helpers`. `identity` makes it once, as `identitySchema` in `db/users.table.ts`, and every table file imports it.
- [ ] Column `workspaceId: workspaceIdColumn()`.
- [ ] `tenantIsolationPolicy('<table name>')` in the table's extra config.
- [ ] `.enableRLS()` on the table.
- [ ] Example to copy: `modules/identity/db/workspaces.table.ts`.
- [ ] Types for rows in `typedefs/`: `typeof table.$inferSelect` and `typeof table.$inferInsert`.
- [ ] Generate the migration: `mise exec -- pnpm --filter backend db:generate`. It writes a new SQL file in `apps/backend/migrations/`.
- [ ] Open the new SQL file and add at the end, one line per new table: `ALTER TABLE "<schema>"."<table>" FORCE ROW LEVEL SECURITY;`. drizzle-kit does not write it. See the end of `migrations/0003_identity-workspaces-invites.sql`.
- [ ] A new Postgres schema needs no grants: `0000_baseline-privileges.sql` gives the app roles access to every new schema and table.
- [ ] Apply it locally: `mise run db:migrate`.
- [ ] The migration only adds things (expand). Dropping or renaming a column is a separate, later pull request (contract), and its description says so.
- [ ] Never edit a migration after it is merged. Write a new one.
- [ ] A table that is not per workspace (rare: users, sessions) goes on `TENANT_EXEMPT_TABLES` in `apps/backend/test/support/constants/tenant-schema.constants.ts`. Ask in review first.
- [ ] Repository queries filter by `workspaceId` and run inside `TenantTransactionService.run(workspaceId, …)`.
- [ ] Optional test: a repository spec with a cross-tenant case, like `repositories/workspaces.repository.spec.ts`.
- [ ] `mise run check` and `mise exec -- pnpm test` pass. The tenant schema test (`test/integration/tenant-schema.spec.ts`) checks every table.

## A new background job

Use a job for slow work or for work after the commit, such as sending an email. A use case never does it inline.

- [ ] Job name in an enum in `constants/<m>-job.constants.ts`, for example `IdentityJobName.CleanUpAuthRecords = 'identity.clean-up-auth-records'`.
- [ ] File `jobs/<topic>.job.ts` with `defineJob({ queue, name, schema })`. Pick the queue from `QueueName` in `platform/queues/constants/queue.constants.ts`. The zod schema holds IDs only, never whole records.
- [ ] Enqueue from a use case: inject `JobsService` and call `this.jobs.enqueue(ctx, job, data)`. Inside a transaction, the job waits for the commit and is dropped on rollback. Never call `queue.add()`.
- [ ] A processor in `processors/<topic>.processor.ts`: an `@Injectable()` class with `@ProcessJob(job)` and `handle(ctx, data)`, which calls one use case. Example: `modules/identity/processors/clean-up-auth-records.processor.ts`.
- [ ] The use case it calls runs as the system actor of the job's workspace. Check that with `requireSystemActor(ctx)`.
- [ ] A recurring job adds `@ScheduleJob(defineJobSchedule({ job, everySeconds, data }))` to the processor.
- [ ] Register the processor under `processors` in the module's `defineModule`, and its use case under `providers`.
- [ ] Reacting to another module's event? Use a listener instead: see `modules/notifications/listeners/` and `jobs/send-confirmation-email.job.ts` (`defineDomainEventSubscription`).
- [ ] Watch it run: open the queue board at `https://queues.local.agent-ic.pavlop.dev` and read `mise run logs worker`.
- [ ] `mise run check` and `mise exec -- pnpm test` pass.

## A new screen

- [ ] Find the design for the screen. The screen names (`Settings-Team`, `Inbox-Operator`) are in [docs/design/mvp-scope.md](../design/mvp-scope.md).
- [ ] Pick the feature folder in `apps/web/src/features/`. Create a new feature only for a new product area.
- [ ] GraphQL operation in `communication/gql/{query,mutation}/<name>.graphql`, then `mise run codegen`.
- [ ] Data hook in `communication/hooks/use<Name>.ts`. It returns UI types, with `null` for missing data.
- [ ] API to UI mapping in `communication/helpers/<topic>.helpers.ts`; UI types in `typedefs/<topic>.typedefs.ts`.
- [ ] Workspace data that must never leak between workspaces uses `fetchPolicy: 'network-only'`.
- [ ] Views in `view/<Name>/`: props in, events out, components from `shared/ui` only. No fetching.
- [ ] A missing UI primitive goes into `apps/web/src/shared/ui/<Name>/` with a story and a test. Radix may appear only there.
- [ ] Container in `containers/<Name>/`: calls the hooks, passes data to views.
- [ ] Hide actions the role may not use with `can(role, resource, action)` from `@agent-ic/contracts`. The backend checks again.
- [ ] Export the container from the feature's `index.ts`.
- [ ] Route file in `routes/`. Inside a workspace: `w.$workspaceId.<path>.tsx`, wrapped in `SectionGate`. Then `mise run codegen`.
- [ ] A new sidebar section: add it to `WorkspaceSection`, `WORKSPACE_SECTION_PATHS`, `SECTION_RESOURCES` and, if it belongs in the sidebar, `NAV_GROUPS` (`features/workspace/constants/navigation.constants.ts`), plus `nav.sections.<name>` in `workspace.json`.
- [ ] All text in `shared/i18n/locales/en/<namespace>.json` and `uk/<namespace>.json`. A new namespace also goes into `Namespace` and `resources.constants.ts` in `shared/i18n/constants/`.
- [ ] Colours and spacing in `.module.scss` with tokens; Tailwind only for layout.
- [ ] Check it in EN and UK, light and dark.
- [ ] Screenshots for the pull request. See [From pull request to production](shipping.md).
- [ ] `mise run check` and `mise exec -- pnpm test` pass.
