# Worked example: rename a workspace

[Back to the guide](README.md)

This page lists every step to add one small feature: an owner or admin renames the workspace in Settings, General. It is not built yet, so you can use it as your first task. The screen is `Settings-General` in [docs/mvp-scope.md](../mvp-scope.md) (UC-14).

The code below is a sketch that follows the real patterns. Copy the shape, then check names against the files it points to. Read the [backend walkthrough](backend-walkthrough.md) and the [web walkthrough](web-walkthrough.md) first.

## Before you start

- Branch from `main`: `git switch -c feat/rename-workspace`.
- Start the stack: `mise run start`. See [Run and debug locally](run-and-debug.md).
- Who may rename? `PERMISSION_MATRIX` in `packages/contracts/src/permissions/permission.constants.ts` gives `workspace_settings: edit` to owners and admins only. We use `PermissionResource.WorkspaceSettings` with `PermissionAction.Edit`. Nothing changes in contracts.

## Backend

All files are in `apps/backend/src/modules/identity/`.

### 1. SDL

In `graphql/workspaces.graphql`, add the field and its input:

```graphql
extend type Mutation {
  renameWorkspace(input: RenameWorkspaceInput!): Membership!
}

input RenameWorkspaceInput {
  name: String!
}
```

It returns `Membership`, like `createWorkspace`, so the web app gets the workspace back with its `id`. Run `mise run codegen`.

### 2. Types and schema

- In `typedefs/workspace.typedefs.ts`, add:

```ts
export interface RenameWorkspaceInput {
  readonly name: string;
}
```

- In `schemas/workspace-input.schema.ts`, add a schema. Share the name rule with `createWorkspaceInputSchema`, so both stay the same:

```ts
const workspaceNameSchema = z.string().trim().min(1).max(WORKSPACE_NAME_MAX_LENGTH);

export const renameWorkspaceInputSchema = z.object({
  [WorkspaceField.Name]: workspaceNameSchema,
});
```

A bad name already maps to `ErrorReason.InvalidWorkspaceName` through `WORKSPACE_FIELD_REASON`, and the web app already has EN and UK text for it. No new error class is needed.

### 3. Repository

In `repositories/workspaces.repository.ts`, add a method. Filter by `workspaceId`:

```ts
async rename(workspaceId: string, name: string, updatedAt: Date): Promise<void> {
  await this.txHost.tx
    .update(workspaces)
    .set({ name, updatedAt })
    .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.id, workspaceId)));
}
```

### 4. Use case

New file `use-cases/rename-workspace.use-case.ts`:

```ts
@Injectable()
export class RenameWorkspaceUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly workspaces: WorkspacesRepository,
    private readonly memberships: WorkspaceMembershipsService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RenameWorkspaceInput): Promise<WorkspaceMembership> {
    const access = authorize(ctx, PermissionResource.WorkspaceSettings, PermissionAction.Edit);
    const { name } = parseWorkspaceInput(renameWorkspaceInputSchema, input);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      await this.workspaces.rename(access.workspaceId, name, this.clock.now());
      return this.memberships.describe(access.workspaceId, access.role);
    });
  }
}
```

- `authorize` is the first line.
- `WorkspaceMembershipsService.describe` (`services/workspace-memberships.service.ts`) already builds a `WorkspaceMembership` with the public id and the member count. Reuse it.

### 5. Resolver

New file `resolvers/rename-workspace.resolver.ts`. Copy `create-workspace.resolver.ts`:

```ts
@Resolver()
export class RenameWorkspaceResolver {
  constructor(private readonly renameWorkspaceUseCase: RenameWorkspaceUseCase) {}

  @Mutation()
  async renameWorkspace(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: RenameWorkspaceInput,
  ): Promise<Membership> {
    return toGraphqlMembership(await this.renameWorkspaceUseCase.execute(ctx, input));
  }
}
```

`RenameWorkspaceInput` and `Membership` here are the generated types from `@/platform/graphql-server/generated/schema.generated`.

### 6. Module

In `identity.module.ts`, add `RenameWorkspaceUseCase` to `providers` and `RenameWorkspaceResolver` to `resolvers`.

### 7. Test (optional)

New file `use-cases/rename-workspace.use-case.spec.ts`. Copy `update-invite-link-role.use-case.spec.ts` and write two cases:

- "renames the workspace for its owner": `createOwnedWorkspace`, then `execute(ownerCtx(workspace), { name: 'New name' })`, then expect `workspace.name` to be the new name.
- "refuses a builder": `addMember`, then `workspaceCtx(memberId, workspace.workspaceId, WorkspaceRole.Builder)`, then expect `PermissionDeniedError`.

### 8. Try it

Open the GraphQL endpoint at `https://local.agent-ic.pavlop.dev/api/graphql` and send the mutation with `Authorization: Bearer <token>` and `x-workspace-id: ws_...`. The easiest way is to build the screen below and watch the request in the browser's network tab.

## Web

All files are in `apps/web/src/`.

### 9. A new section

The section list lives in the `workspace` feature, because the sidebar and `SectionGate` use it. In `features/workspace/constants/navigation.constants.ts`:

- add `General = 'general'` to `WorkspaceSection`;
- add `[WorkspaceSection.General]: '/w/$workspaceId/settings/general'` to `WORKSPACE_SECTION_PATHS`;
- add `[WorkspaceSection.General]: PermissionResource.WorkspaceSettings` to `SECTION_RESOURCES`.

In `features/workspace/typedefs/navigation.typedefs.ts`, exclude `General` from `PlaceholderSection`, like `Team`. Add `"general"` under `nav.sections` in `shared/i18n/locales/en/workspace.json` and `uk/workspace.json`. `NoAccess` uses that name.

### 10. Operation and data hook

New file `features/settings/communication/gql/mutation/renameWorkspace.graphql`:

```graphql
mutation RenameWorkspace($input: RenameWorkspaceInput!) {
  renameWorkspace(input: $input) {
    role
    workspace {
      id
      name
      memberCount
    }
  }
}
```

Run `mise run codegen`. Then `features/settings/communication/hooks/useRenameWorkspace.ts`:

```ts
export function useRenameWorkspace(): (name: string) => Promise<void> {
  const [renameWorkspace] = useMutation(RenameWorkspaceDocument);

  return useCallback(
    async (name) => {
      await renameWorkspace({ variables: { input: { name } } });
    },
    [renameWorkspace],
  );
}
```

The answer has the workspace `id`. Apollo stores every workspace once by its id, so the sidebar and the workspace switcher show the new name without a refetch.

### 11. Form schema

New file `features/settings/logic/schemas/workspaceName.schema.ts`. Copy `features/auth/logic/schemas/workspaceStep.schema.ts`; it uses `WORKSPACE_NAME_MAX_LENGTH` from contracts.

### 12. View

New folder `features/settings/view/WorkspaceNameCard/` with `WorkspaceNameCard.tsx`, `WorkspaceNameCard.typedefs.ts` and `index.ts`. It is a `Card` from `shared/ui` with a heading, a short description and a `<form noValidate>` that calls `onSubmit`. The field and the button come in as `children`, because a view may not import `shared/forms`. `features/auth/view/AuthForm/AuthForm.tsx` shows the form part.

### 13. Container

New folder `features/settings/containers/GeneralPage/`. The container:

- reads the current name with `useActiveWorkspace(workspaceId)` from `@/features/workspace`;
- builds the form with `useAppForm`, default value the current name, and the schema from step 11;
- calls `useRenameWorkspace()` on submit;
- shows a toast: `useToast()` on success, `useErrorMessage()` for the error text, as in `InviteLinkPanel.tsx`;
- renders `PageHeader` (copy `TeamPage.tsx`) and `WorkspaceNameCard` with `form.AppField` and `form.SubmitButton` inside.

Export it from `features/settings/index.ts`.

### 14. Settings navigation

In `features/settings/constants/route.constants.ts`, add `GENERAL_PATH = '/w/$workspaceId/settings/general'`. In `features/settings/containers/SettingsShell/SettingsShell.tsx`, add a `NavItem` for General in the "Workspace" group. Show it when `canOpenSection(active.role, WorkspaceSection.General)`, the same way Team is shown.

### 15. Route

New file `routes/w.$workspaceId.settings.general.tsx`. Copy `w.$workspaceId.settings.team.tsx` and use `WorkspaceSection.General` and `GeneralPage`. Run `mise run codegen`.

### 16. Translations

Add the keys to `shared/i18n/locales/en/settings.json` and `uk/settings.json`: `nav.general`, the page title and subtitle, the card title, the field label, the button and the success toast. Write the Ukrainian text yourself or ask a teammate; do not leave English in the UK file.

### 17. Test (optional)

Copy `apps/web/test/integration/teamSettings.test.tsx`. Add `buildRenameWorkspaceMock` to a fixture in `features/settings/communication/fixtures/`. Test that an owner sees the form and that a builder sees `NoAccess`.

## Finish

1. `mise run check` and `mise exec -- pnpm test` pass.
2. Open the screen as an owner, rename, and check that the sidebar shows the new name. Switch to Ukrainian with the EN/UK switch in the sidebar, set your system to dark mode (the app follows it), and look again.
3. Take screenshots (EN and UK, light and dark) for the pull request. See [From pull request to production](shipping.md).
4. The change is about 300 lines, so one pull request is fine. Title: `feat(settings): rename the workspace`.
