# Checklists

[Back to the docs](../README.md)

Tick every box before you open the pull request. Each list ends with the same step: `mise run check` and `mise exec -- pnpm test` pass.

A new backend module: see "Add one" in [003 Code layout](../learn/003-code-layout.md#add-one-a-new-backend-module).

A new table: see "Add one" in [006 Transactions and row-level security](../learn/006-transactions-and-rls.md#add-one).

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
