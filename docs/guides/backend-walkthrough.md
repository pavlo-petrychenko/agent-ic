# Backend walkthrough: the identity module

[Back to the guide](README.md)

The `identity` module owns users, sessions, workspaces, memberships and invite links. It lives in `apps/backend/src/modules/identity/`. There is no separate `workspaces` module: workspaces are part of `identity` (architecture.md D175).

We follow two real operations in the order you would write them:

- `createWorkspace`: a signed-in user creates a workspace. It runs before the user has a workspace.
- `updateInviteLinkRole`: an owner or admin changes the role of the invite link. It runs inside a workspace and checks permissions.

## 1. GraphQL SDL

File: `modules/identity/graphql/workspaces.graphql`

The schema comes first. A module can have more than one `.graphql` file; `identity` has `identity.graphql` and `workspaces.graphql`. Each file extends the root types:

```graphql
extend type Mutation {
  createWorkspace(input: CreateWorkspaceInput!): Membership!
  updateInviteLinkRole(input: UpdateInviteLinkRoleInput!): InviteLink!
}

type Workspace {
  id: ID!
  name: String!
  timeZone: String!
  memberCount: Int!
}

input CreateWorkspaceInput {
  name: String!
  timeZone: String!
}
```

After you change any `.graphql` file, run:

```sh
mise run codegen
```

It writes the TypeScript types to `src/platform/graphql-server/generated/schema.generated.ts` and the merged schema to `packages/api-schema/`. Both are gitignored, so never commit them.

## 2. Types and input validation

Before the use case, write what it takes and returns.

- `typedefs/workspace.typedefs.ts` holds plain interfaces such as `CreateWorkspaceInput` and `WorkspaceMembership`. These are the module's own types, not the GraphQL ones.
- `schemas/workspace-input.schema.ts` holds the zod schema:

```ts
export const createWorkspaceInputSchema = z.object({
  [WorkspaceField.Name]: z.string().trim().min(1).max(WORKSPACE_NAME_MAX_LENGTH),
  [WorkspaceField.TimeZone]: z.string().refine(isSupportedTimeZone),
});
```

- `helpers/workspace-input.helpers.ts` has `parseWorkspaceInput(schema, input)`. It throws `InvalidWorkspaceInputError` with one issue per bad field, so the web form can show the error next to the field.

Note the names: `WorkspaceField.Name` is an enum value from `constants/workspace.constants.ts`, and `WORKSPACE_NAME_MAX_LENGTH` comes from `@agent-ic/contracts`, because the web form uses the same limit.

## 3. Use case

File: `use-cases/create-workspace.use-case.ts`

A use case is an `@Injectable()` class with one method, `execute(ctx, input)`. It reads like the business flow.

```ts
async execute(ctx: UseCaseCtx, input: CreateWorkspaceInput): Promise<WorkspaceMembership> {
  const { userId } = requireUserActor(ctx);
  const data = parseWorkspaceInput(createWorkspaceInputSchema, input);
  const workspaceId = this.ids.generate();
  return this.tenantTransactions.run(workspaceId, async () => {
    const now = this.clock.now();
    await this.workspaces.insert({ id: workspaceId, workspaceId, name: data.name, ... });
    await this.memberships.insertIfAbsent({ ..., role: WorkspaceRole.Owner, ... });
    await this.inviteLinks.issue(workspaceId, DEFAULT_INVITE_ROLE, userId);
    return { workspace: { id: this.ids.toPublic(IdPrefix.Workspace, workspaceId), ... }, role: WorkspaceRole.Owner };
  });
}
```

What to notice:

- **Permissions first.** `createWorkspace` has no workspace yet, so it only checks that the caller is signed in: `requireUserActor(ctx)`.
- **One transaction.** `TenantTransactionService.run(workspaceId, work)` opens a transaction and tells Postgres which workspace it is in. Row-level security (RLS) then hides every other workspace's rows.
- **No `new Date()`, no `randomUUID()`.** Use `ClockService` and `IdService`, so tests can replace them.
- **Public ids.** Inside the backend, ids are UUIDs. Outside, they carry a prefix such as `ws_`. `this.ids.toPublic(IdPrefix.Workspace, id)` makes one.

Now the version inside a workspace, `use-cases/update-invite-link-role.use-case.ts`:

```ts
async execute(ctx: UseCaseCtx, input: UpdateInviteLinkRoleInput): Promise<InviteLinkView> {
  const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
  const { role } = parseWorkspaceInput(inviteRoleInputSchema, input);
  if (!isInvitableRole(role)) {
    throw new RoleNotInvitableError(role);
  }
  return this.tenantTransactions.run(access.workspaceId, async () => {
    const current = await this.inviteLinks.findActiveForUpdate(access.workspaceId);
    ...
    await this.inviteLinks.updateRole(access.workspaceId, current.id, role);
    return this.invites.view({ ...current, role });
  });
}
```

- `authorize(ctx, resource, action)` is always the first line of a workspace use case. It reads the caller's role from `ctx` and checks it against `PERMISSION_MATRIX` in `packages/contracts/src/permissions/permission.constants.ts`. It throws `FORBIDDEN` when the role is not allowed.
- Where does `ctx.workspaceId` come from? The web app sends the header `x-workspace-id`. The backend checks on every request that the user is a member and sets `ctx.workspaceId` and `ctx.workspaceRole`. You never read the header yourself.
- Errors are classes in `errors/`, one per file, extending `DomainError`. `RoleNotInvitableError` sets a `kind` and a `reason` from `ErrorReason` in contracts. The web app turns the reason into a translated message.

A use case never calls another use case. If two use cases need the same logic, move it to a service (`InviteLinksService` above).

## 4. Repository

File: `repositories/workspaces.repository.ts`

The repository is the only place with Drizzle. It reads `txHost.tx`, which is the open transaction.

```ts
@Injectable()
export class WorkspacesRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(workspace: NewWorkspace): Promise<void> {
    await this.txHost.tx.insert(workspaces).values(workspace);
  }

  async findById(workspaceId: string): Promise<WorkspaceRecord | null> {
    const [workspace] = await this.txHost.tx
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.id, workspaceId)));
    return workspace ?? null;
  }
}
```

- Always filter by `workspaceId` too, even though RLS also protects you. Two locks are better than one.
- Return `null` when nothing is found, never `undefined`.
- The table is in `db/workspaces.table.ts`. See the [new table checklist](checklists.md#a-new-table) for how a table is made.

## 5. Resolver

File: `resolvers/create-workspace.resolver.ts`

The resolver is thin. It takes the context and the input, calls one use case and maps the result to the GraphQL type.

```ts
@Resolver()
export class CreateWorkspaceResolver {
  constructor(private readonly createWorkspaceUseCase: CreateWorkspaceUseCase) {}

  @Mutation()
  async createWorkspace(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: CreateWorkspaceInput,
  ): Promise<Membership> {
    return toGraphqlMembership(await this.createWorkspaceUseCase.execute(ctx, input));
  }
}
```

- The method name must match the field name in the SDL.
- `Membership` and `CreateWorkspaceInput` here are the generated GraphQL types.
- `toGraphqlMembership` lives in `helpers/workspace-graphql.helpers.ts`. It maps the module's types to GraphQL types, for example the contracts `WorkspaceRole` to the GraphQL `WorkspaceRole` enum.
- A resolver never imports a service or a repository. `pnpm depcruise` fails if it does.

## 6. Register it in the module

File: `identity.module.ts`

Add the use case to `providers` and the resolver to `resolvers`:

```ts
export class IdentityModule extends defineModule({
  global: true,
  providers: [WorkspacesRepository, ..., CreateWorkspaceUseCase, ...],
  resolvers: [..., CreateWorkspaceResolver, ...],
  controllers: [AuthController],
  processors: [CleanUpAuthRecordsProcessor],
  exports: [UsersRepository, SessionsService, ...],
}) {}
```

`defineModule` mounts resolvers only in the `api` role and processors only in the `worker` role. The app refuses to boot when a GraphQL root field has no resolver, so a missing line shows up at once.

`index.ts` is what other modules may import. It never exports use cases or resolvers.

## 7. Test (optional)

File: `use-cases/update-invite-link-role.use-case.spec.ts`

A use case spec runs against a real Postgres with RLS. Docker must be running; Vitest starts the database for you.

```ts
describe('UpdateInviteLinkRoleUseCase', () => {
  let testbed: IdentityTestbed;
  let updateRole: UpdateInviteLinkRoleUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    updateRole = testbed.module.get(UpdateInviteLinkRoleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMember(testbed, workspace);

    const attempt = updateRole.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
      { role: WorkspaceRole.Admin },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
```

- `createIdentityTestbed`, `createOwnedWorkspace`, `addMember` and `ownerCtx` are in `apps/backend/test/support/helpers/`.
- Test names describe behaviour: "refuses an operator", not "calls authorize".
- A repository test on a tenant table has a cross-tenant case. See `repositories/workspaces.repository.spec.ts`: workspace B never sees workspace A.
- Run only the backend tests with `mise exec -- pnpm --filter backend test`. Add a path to run one file. Run `mise run codegen` first, because the specs import generated types.

Rules for tests: [docs/rules/testing.md](../rules/testing.md).

## What comes next

The web side of the same operations: [Web walkthrough](web-walkthrough.md).
