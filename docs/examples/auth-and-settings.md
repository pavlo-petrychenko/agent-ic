# Example: auth and settings

[Back to the docs](../README.md)

A tour of two real web features, layer by layer. The code is not pasted, so it cannot go stale. Open each link next to this page. The concepts are in [013 The web app](../learn/013-web-app.md).

We follow two screens, in the order you would write them:

- **Create a workspace** ([features/auth](../../apps/web/src/features/auth/)): the form a user sees after confirming the email. It calls `createWorkspace`.
- **Team invite link** ([features/settings](../../apps/web/src/features/settings/)): the card in Settings, Team. It reads `inviteLink` and calls `updateInviteLinkRole`. The backend side of both is in [the identity module](identity-module.md).

## Where things are

Take `features/auth` as the model:

```
features/auth/
  index.ts          the only file routes and other features may import
  communication/    gql/, hooks/, helpers/, fixtures/     talks to the API
  logic/            hooks/, helpers/, schemas/            behaviour, no fetching
  view/             AuthForm/, AuthPanel/, ...            props in, events out
  containers/       WorkspaceStepPage/, ...               wires the layers into a screen
  constants/  typedefs/                                   shared by every layer
```

Another feature may import this one only through [index.ts](../../apps/web/src/features/auth/index.ts). `pnpm depcruise` checks every import.

## 1. The GraphQL operation

[communication/gql/mutation/createWorkspace.graphql](../../apps/web/src/features/auth/communication/gql/mutation/createWorkspace.graphql)

- Ask only for the fields the screen uses.
- Run `mise run codegen`. It writes `createWorkspace.generated.ts` next to the file, with a typed `CreateWorkspaceDocument`. The web codegen reads the backend schema, so run it after a backend schema change too.
- Settings has the query and two mutations for the invite link: [inviteLink.graphql](../../apps/web/src/features/settings/communication/gql/query/inviteLink.graphql), [updateInviteLinkRole.graphql](../../apps/web/src/features/settings/communication/gql/mutation/updateInviteLinkRole.graphql), [resetInviteLink.graphql](../../apps/web/src/features/settings/communication/gql/mutation/resetInviteLink.graphql).

## 2. The data hook

[communication/hooks/useCreateWorkspace.ts](../../apps/web/src/features/auth/communication/hooks/useCreateWorkspace.ts)

Components never call Apollo directly. A data hook hides it and returns plain values.

- `refetchQueries` reloads the workspace list, because a new workspace was added.
- The hook returns `string | null`. Missing data is `null`, never `undefined`.

[settings useInviteLink.ts](../../apps/web/src/features/settings/communication/hooks/useInviteLink.ts) shows one query and two mutations in one hook:

- `fetchPolicy: 'network-only'` loads fresh data each time the screen opens. An invite link belongs to one workspace, so we never show the previous workspace's link from the cache.
- Each mutation writes its answer straight into the query result in the cache, so the card updates without a second request.
- `ROLE_TO_API` and `ROLE_FROM_API` in [workspaceRole.constants.ts](../../apps/web/src/shared/api/constants/workspaceRole.constants.ts) map between the GraphQL role enum and the contracts `WorkspaceRole`. The UI works only with the contracts enum.

## 3. The API mapping helper

[inviteLink.helpers.ts](../../apps/web/src/features/settings/communication/helpers/inviteLink.helpers.ts)

The UI never sees generated API types. `toInviteLinkView` turns the API shape into the UI type in [typedefs/inviteLink.typedefs.ts](../../apps/web/src/features/settings/typedefs/inviteLink.typedefs.ts), and maps the role.

## 4. The view

[view/InviteLinkCard/InviteLinkCard.tsx](../../apps/web/src/features/settings/view/InviteLinkCard/InviteLinkCard.tsx)

A view draws props and calls callbacks. It does not fetch.

- A component folder is flat: the component, [InviteLinkCard.typedefs.ts](../../apps/web/src/features/settings/view/InviteLinkCard/InviteLinkCard.typedefs.ts) (the props), a `.module.scss` and `index.ts`.
- `Card`, `Heading`, `Select` and `Button` come from [shared/ui](../../apps/web/src/shared/ui/). Look there first. Each component has a story.
- Tailwind classes are for layout only. Colours, spacing and type go in the `.module.scss` with the tokens from [tokens.css](../../apps/web/src/shared/styles/tokens.css).
- Every string comes from `t('...')`. The text is in `shared/i18n/locales/en/settings.json` and `uk/settings.json`. Plurals use `_one`, `_few`, `_many` and `_other` keys.
- The auth view [AuthForm.tsx](../../apps/web/src/features/auth/view/AuthForm/AuthForm.tsx) is even smaller: a `<form>` that calls `onSubmit` and renders its children. The container passes the fields in, because form hooks live in `shared/forms`, which a view may not import.

## 5. The container

[containers/WorkspaceStepPage/WorkspaceStepPage.tsx](../../apps/web/src/features/auth/containers/WorkspaceStepPage/WorkspaceStepPage.tsx)

The container is the screen. It calls the hooks and passes the results to views.

- `useAppForm` ([useAppForm.ts](../../apps/web/src/shared/forms/hooks/useAppForm.ts)) is TanStack Form with our `TextField`, `PasswordField` and `SubmitButton`.
- The zod schema in [workspaceStep.schema.ts](../../apps/web/src/features/auth/logic/schemas/workspaceStep.schema.ts) checks the form before the request. It uses the same `WORKSPACE_NAME_MAX_LENGTH` from contracts as the backend.
- When the backend rejects the input, [useServerErrors.ts](../../apps/web/src/features/auth/logic/hooks/useServerErrors.ts) maps each error reason to a field or a form message.

The settings container [InviteLinkPanel.tsx](../../apps/web/src/features/settings/containers/InviteLinkPanel/InviteLinkPanel.tsx) shows more patterns:

- `useActiveWorkspace(workspaceId)` comes from `@/features/workspace` (its `index.ts`). It gives the current workspace's name, role and member count.
- `can(role, resource, action)` from contracts hides what the role may not do. The backend checks again, so hiding a button is for comfort, not for security.
- A success or failure shows a toast with `useToast()` from `shared/ui/Toast`. `useErrorMessage()` turns an API error into translated text.
- [TeamPage.tsx](../../apps/web/src/features/settings/containers/TeamPage/TeamPage.tsx) puts two independent panels on one page. Each panel fetches its own data.

## 6. The route

[routes/auth.workspace.tsx](../../apps/web/src/routes/auth.workspace.tsx)

A route file only checks access, reads params and renders one container. No logic. It uses `requireSession` and `SessionGate` from the auth feature.

Routes inside a workspace sit under [routes/w.$workspaceId.tsx](../../apps/web/src/routes/w.$workspaceId.tsx). That parent route already does three things:

- it sends a visitor without a session to the login page;
- it sets the workspace id, so every request carries `x-workspace-id`;
- it renders the app shell: the sidebar filtered by role, and the "workspace not available" state.

A workspace page then only needs the section check, as in [w.$workspaceId.settings.team.tsx](../../apps/web/src/routes/w.$workspaceId.settings.team.tsx). `SectionGate` shows the `NoAccess` screen when the role cannot open the section. The section's permission is in `SECTION_RESOURCES` in [navigation.constants.ts](../../apps/web/src/features/workspace/constants/navigation.constants.ts).

The file name is the URL. After you add a route file, run `mise run codegen` to update `routeTree.gen.ts` (gitignored). Export the container from the feature's `index.ts`, so the route can import it.

## 7. The tests (optional)

- **A view test** next to the component, with React Testing Library. Example: [NoAccess.test.tsx](../../apps/web/src/features/workspace/view/NoAccess/NoAccess.test.tsx).
- **A route test** in [apps/web/test/integration](../../apps/web/test/integration/). It renders the real router with Apollo mocks. Example: [teamSettings.test.tsx](../../apps/web/test/integration/teamSettings.test.tsx), with mocks from [team.fixture.ts](../../apps/web/src/features/settings/communication/fixtures/team.fixture.ts). For the first screen see [workspaceStep.test.tsx](../../apps/web/test/integration/workspaceStep.test.tsx).
- `renderRoute`, `signInForTest` and `signOutForTest` are in [test/support/helpers](../../apps/web/test/support/helpers/).
- Run the web tests with `mise exec -- pnpm --filter web test`. Rules for tests: [docs/rules/testing.md](../rules/testing.md).

Next: put both halves together in [rename a workspace](rename-workspace.md) or [save the language to the account](save-language.md).
