# Web walkthrough: the auth and settings features

[Back to the guide](README.md)

The web app lives in `apps/web/src/`. Each product area is a feature folder in `features/`. We follow two real screens in the order you would write them:

- **Create a workspace** (`features/auth`): the form a user sees after confirming the email. It calls `createWorkspace`.
- **Team invite link** (`features/settings`): the card in Settings, Team. It reads `inviteLink` and calls `updateInviteLinkRole`.

## Where things are

```
features/auth/
├── index.ts                       the only file routes and other features may import
├── communication/                 talks to the API
│   ├── gql/mutation/createWorkspace.graphql
│   ├── hooks/useCreateWorkspace.ts
│   ├── helpers/                   API shape to UI shape
│   └── fixtures/                  Apollo mocks for tests
├── logic/                         behaviour without fetching: hooks/, helpers/, schemas/
├── view/AuthForm/                 presentational: props in, events out
├── containers/WorkspaceStepPage/  wires communication, logic and view into a screen
└── constants/  typedefs/          shared by every layer of the feature
```

A feature may import another feature only through its `index.ts`. `pnpm depcruise` checks every import.

## 1. GraphQL operation

File: `features/auth/communication/gql/mutation/createWorkspace.graphql`

```graphql
mutation CreateWorkspace($input: CreateWorkspaceInput!) {
  createWorkspace(input: $input) {
    role
    workspace {
      id
      name
    }
  }
}
```

Ask only for the fields the screen uses. Run `mise run codegen`. It writes `createWorkspace.generated.ts` next to the file, with a typed `CreateWorkspaceDocument`. The web codegen reads the backend schema, so run it after a backend SDL change too.

## 2. Data hook

File: `features/auth/communication/hooks/useCreateWorkspace.ts`

Components never call Apollo directly. A data hook hides it and returns plain values.

```ts
export function useCreateWorkspace(): (request: CreateWorkspaceRequest) => Promise<string | null> {
  const [createWorkspace] = useMutation(CreateWorkspaceDocument, {
    refetchQueries: [MyWorkspacesDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (request) => {
      const { data } = await createWorkspace({ variables: { input: request } });
      return data?.createWorkspace.workspace.id ?? null;
    },
    [createWorkspace],
  );
}
```

- `refetchQueries` reloads the workspace list, because a new workspace was added.
- The hook returns `string | null`. Missing data is `null`, never `undefined`.

The settings hook `features/settings/communication/hooks/useInviteLink.ts` shows a query and two mutations together:

```ts
const { data, loading } = useQuery(InviteLinkDocument, { fetchPolicy: 'network-only' });
...
const changeRole = useCallback(
  async (role: WorkspaceRole) => {
    await updateRole({ variables: { input: { role: ROLE_TO_API[role] } } });
  },
  [updateRole],
);

return { link: toInviteLinkView(data?.inviteLink ?? null), loading, changeRole, reset };
```

- `fetchPolicy: 'network-only'` loads fresh data each time the screen opens. The invite link belongs to one workspace, so we never show the previous workspace's link from the cache.
- `ROLE_TO_API` and `ROLE_FROM_API` (`shared/api/constants/workspaceRole.constants.ts`) map between the GraphQL role enum and the contracts `WorkspaceRole`. The UI works only with the contracts enum.

## 3. API mapping helper

File: `features/settings/communication/helpers/inviteLink.helpers.ts`

The UI never sees generated API types. A helper turns them into a UI type from `typedefs/`:

```ts
export const toInviteLinkView = (link: ApiInviteLink | null): InviteLinkView | null =>
  link === null
    ? null
    : {
        url: link.url,
        role: ROLE_FROM_API[link.role],
        expiresAt: link.expiresAt,
        joinedCount: link.joinedCount,
      };
```

## 4. View

File: `features/settings/view/InviteLinkCard/InviteLinkCard.tsx`

A view draws props and calls callbacks. It does not fetch, and it may import only `shared/ui` from `shared/`.

```tsx
export function InviteLinkCard({ link, workspaceName, canEdit, roleOptions, onCopy, onReset, onRoleChange, ... }: InviteLinkCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card>
      <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
        {t('team.invite.title')}
      </Heading>
      ...
      {canEdit && (
        <Select aria-label={t('team.invite.role')} value={link.role} options={roleOptions} onChange={...} />
      )}
      <Button icon={IconName.Copy} onClick={onCopy}>
        {t('team.invite.copy')}
      </Button>
    </Card>
  );
}
```

- A component folder is flat: `InviteLinkCard.tsx`, `InviteLinkCard.typedefs.ts` (the props), `InviteLinkCard.module.scss`, `index.ts`.
- `Card`, `Heading`, `Select` and `Button` come from `apps/web/src/shared/ui`. Look there first. Each component has a story: run Storybook with `mise exec -- pnpm --filter web storybook`.
- Tailwind classes are for layout only (`flex`, `gap-3`). Colours, spacing and type go in `.module.scss` with the tokens from `shared/styles/tokens.css`.
- Every string comes from `t('...')`. The text is in `shared/i18n/locales/en/settings.json` and `shared/i18n/locales/uk/settings.json`. Add both. Plurals use `_one`, `_few`, `_many`, `_other` keys (Ukrainian needs all of them).

The auth view `features/auth/view/AuthForm/AuthForm.tsx` is even smaller. It is a `<form>` that calls `onSubmit` and renders its children. The fields are passed in by the container, because form hooks live in `shared/forms`, which a view may not import.

## 5. Container

File: `features/auth/containers/WorkspaceStepPage/WorkspaceStepPage.tsx`

The container is the screen. It calls the hooks and passes results to views.

```tsx
export function WorkspaceStepPage() {
  const { t } = useTranslation(Namespace.Auth);
  const navigate = useNavigate();
  const createWorkspace = useCreateWorkspace();
  const serverErrors = useServerErrors(WORKSPACE_STEP_REASON_FIELDS);
  const form = useAppForm({
    defaultValues: EMPTY_WORKSPACE_STEP_VALUES,
    validators: { onSubmit: createWorkspaceStepSchema({ name: tError('reason.INVALID_WORKSPACE_NAME') }) },
    onSubmit: async ({ value }) => {
      try {
        const workspaceId = await createWorkspace({ name: value.name.trim(), timeZone: browserTimeZone() });
        if (workspaceId !== null) {
          await navigate({ to: WORKSPACE_HOME_PATH, params: { workspaceId } });
        }
      } catch (error) {
        serverErrors.report(error);
      }
    },
  });

  return (
    <AuthPanel title={t('workspaceStep.title')} ...>
      <AuthForm onSubmit={() => void form.handleSubmit()}>
        <form.AppField name={WorkspaceStepField.Name}>
          {(field) => <field.TextField label={t('workspaceStep.create.name')} error={...} />}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton size={ButtonSize.Lg} fullWidth>{t('workspaceStep.submit')}</form.SubmitButton>
        </form.AppForm>
      </AuthForm>
    </AuthPanel>
  );
}
```

- `useAppForm` (`shared/forms/hooks/useAppForm.ts`) is TanStack Form with our `TextField`, `PasswordField` and `SubmitButton`.
- The zod schema in `logic/schemas/workspaceStep.schema.ts` checks the form before the request. It uses the same `WORKSPACE_NAME_MAX_LENGTH` from contracts as the backend.
- When the backend rejects the input, `useServerErrors` maps each error reason to a field or to a form message.

The settings container `features/settings/containers/InviteLinkPanel/InviteLinkPanel.tsx` shows two more patterns:

```tsx
const active = useActiveWorkspace(workspaceId);
const { link, changeRole, reset } = useInviteLink();
...
canEdit={active !== null && can(active.role, PermissionResource.Team, PermissionAction.Edit)}
```

- `useActiveWorkspace(workspaceId)` comes from `@/features/workspace` (its `index.ts`). It gives the current workspace's name, role and member count.
- `can(role, resource, action)` from contracts hides what the role may not do. The backend checks again with `authorize`, so hiding a button is for comfort, not for security.
- Success and failure show a toast with `useToast()` from `shared/ui/Toast`. `useErrorMessage()` turns any API error into translated text.

## 6. Route

File: `routes/auth.workspace.tsx`

A route file only checks access, reads params and renders one container. No logic.

```tsx
export const Route = createFileRoute('/auth/workspace')({
  beforeLoad: ({ location }) => requireSession(location),
  component: WorkspaceStepRoute,
});

function WorkspaceStepRoute() {
  return (
    <SessionGate>
      <WorkspaceStepPage />
    </SessionGate>
  );
}
```

Routes inside a workspace sit under `routes/w.$workspaceId.tsx`. That parent route already does three things for you:

- it sends a visitor without a session to the login page;
- it sets the workspace id, so every request carries `x-workspace-id`;
- it renders the app shell: the sidebar filtered by role, and the "workspace not available" state.

So a workspace page only needs the section check. `routes/w.$workspaceId.settings.team.tsx`:

```tsx
export const Route = createFileRoute('/w/$workspaceId/settings/team')({
  component: TeamRoute,
});

function TeamRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Team}>
      <TeamPage workspaceId={workspaceId} />
    </SectionGate>
  );
}
```

`SectionGate` shows the `NoAccess` screen when the role cannot open the section. The section's permission is in `SECTION_RESOURCES` in `features/workspace/constants/navigation.constants.ts`.

The file name is the URL: dots become slashes and `$workspaceId` is a parameter. After you add a route file, run `mise run codegen` to update `routeTree.gen.ts` (gitignored).

Export the container from the feature's `index.ts`, so the route can import it:

```ts
export { TeamPage } from '@/features/settings/containers/TeamPage';
```

## 7. Test (optional)

Two kinds of web tests help most:

- **A view test** next to the component, with React Testing Library. Example: `features/workspace/view/NoAccess/NoAccess.test.tsx`.
- **A route test** in `apps/web/test/integration/`. It renders the real router with Apollo mocks. Example: `test/integration/teamSettings.test.tsx`:

```tsx
it('opens Team for an owner and copies the invite link', async () => {
  const { router } = renderRoute(settingsPath, {
    mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildInviteLinkMock(), buildTeamMembersMock()],
  });

  await waitFor(() => expect(router.state.location.pathname).toBe(`${settingsPath}/team`));
  expect(await screen.findByText(INVITE_URL)).toBeInTheDocument();
});
```

The mocks live in the feature's `communication/fixtures/` (`team.fixture.ts`). `renderRoute`, `signInForTest` and `signOutForTest` are in `apps/web/test/support/helpers/`. Run the web tests with `mise exec -- pnpm --filter web test`.

Rules for tests: [docs/rules/testing.md](../rules/testing.md).

## What comes next

Put both halves together: [Worked example: rename a workspace](rename-workspace.md).
