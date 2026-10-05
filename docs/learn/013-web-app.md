# 013 The web app

[Back to the docs](../README.md)

The other half of the system: a React single-page app that talks to the backend through GraphQL.

## What it is

- `apps/web` is a Vite and React app. It uses function components and hooks only.
- Pages come from TanStack Router. Server data comes from Apollo Client.
- Each product area is a feature folder in `src/features/`: `auth`, `settings`, `workspace`, `status`.
- Code shared by all features is in `src/shared/`. Code that wires the whole app is in `src/app/`.

## Why we have it

- The browser should never know how the backend is built. It only knows the GraphQL schema, so the schema is the contract.
- Fetching, behaviour and drawing are different jobs. When they are mixed in one component, nothing can be reused or tested alone. So every feature has fixed layers, and a tool checks the imports.
- Text, role checks and styling are repeated in every screen, so each has one home: `shared/i18n`, `@agent-ic/contracts` and `shared/styles`.

## How it works

**Startup** ([bootstrap.tsx](../../apps/web/src/app/bootstrap.tsx))

```
main.tsx -> bootstrap()
  1. create the i18n instance (saved locale, else browser language, else the default)
  2. in parallel: load public/config.json, and try to refresh the session
  3. render <App>: providers (i18n, error boundary, Apollo, toasts) -> router
  on any failure: render StartupFailure
```

- The runtime config is validated by `shared/config` before the first render. It holds `graphqlPath`. Values that differ per environment come from this file, never from `import.meta.env`.

**Router.** Files in [routes/](../../apps/web/src/routes/) are the routes. The file name is the URL: dots become slashes, `$workspaceId` is a parameter. The Vite plugin and `mise run codegen` write `routeTree.gen.ts` (gitignored). A route file checks access, reads params and renders one container. No logic.

**Apollo.** The client in [apollo.client.ts](../../apps/web/src/shared/api/clients/apollo.client.ts) has a chain of three links, in this order:

```
error link  -> on UNAUTHENTICATED: refresh the session once, retry the request
auth link   -> adds Authorization (access token) and x-workspace-id headers
split link  -> subscriptions go over graphql-ws, everything else over HTTP
```

The cache stores objects by their `id`, so one update changes every screen that shows that object.

**Workspace.** The parent route `w.$workspaceId.tsx` requires a session, sets the workspace id for the auth link, and renders the app shell (sidebar and the "workspace not available" state). Child routes only add a `SectionGate` for the role.

**i18n.** Text lives in `shared/i18n/locales/{en,uk}/<namespace>.json`. Components call `t('key')`. Never write text in a component.

**Feature layers.** Each feature has `communication/` (API), `logic/` (behaviour), `storage/` (shared state), `view/` (drawing) and `containers/` (screens). From `shared`, a `view` may import only `shared/ui`. Another feature is used only through its `index.ts`. Radix is allowed only inside `shared/ui`. The full anatomy and the import table are in [apps/web/AGENTS.md](../../apps/web/AGENTS.md).

## Add one

A new screen. Tick every box before the pull request.

- [ ] Get the design for the screen. Ask when you do not have one.
- [ ] Pick the feature folder in `apps/web/src/features/`. Create a new feature only for a new product area.
- [ ] GraphQL operation in `communication/gql/{query,mutation}/<name>.graphql`, then `mise run codegen`.
- [ ] Data hook in `communication/hooks/use<Name>.ts`. It returns UI types, with `null` for missing data.
- [ ] API to UI mapping in `communication/helpers/<topic>.helpers.ts`; UI types in `typedefs/<topic>.typedefs.ts`.
- [ ] Workspace data that must never leak between workspaces uses `fetchPolicy: 'network-only'`.
- [ ] Views in `view/<Name>/`: props in, events out, components from `shared/ui` only. No fetching.
- [ ] A missing UI primitive goes into `apps/web/src/shared/ui/<group>/<Name>/` with a story and a test. The groups are listed in [structure.md](../rules/structure.md). Radix may appear only there.
- [ ] Container in `containers/<Name>/`: calls the hooks, passes data to views.
- [ ] Hide actions the role may not use with `can(role, resource, action)` from `@agent-ic/contracts`. The backend checks again.
- [ ] Export the container from the feature's `index.ts`.
- [ ] Route file in `routes/`. Inside a workspace: `w.$workspaceId.<path>.tsx`, wrapped in `SectionGate`. Then `mise run codegen`.
- [ ] A new sidebar section: add it to `WorkspaceSection`, `WORKSPACE_SECTION_PATHS`, `SECTION_RESOURCES` and, if it belongs in the sidebar, `NAV_GROUPS` (`features/workspace/constants/navigation.constants.ts`), plus `nav.sections.<name>` in `workspace.json`.
- [ ] All text in `shared/i18n/locales/en/<namespace>.json` and `uk/<namespace>.json`. A new namespace also goes into `Namespace` and `resources.constants.ts` in `shared/i18n/constants/`.
- [ ] Colours and spacing in `.module.scss` with tokens; Tailwind only for layout.
- [ ] Check it in EN and UK, light and dark.
- [ ] Screenshots for the pull request. See [014 Shipping](014-shipping.md).
- [ ] `mise run check` and `mise exec -- pnpm test` pass.

## In the code

- Startup and providers: [bootstrap.tsx](../../apps/web/src/app/bootstrap.tsx), [AppProviders.tsx](../../apps/web/src/app/providers/AppProviders/AppProviders.tsx), [router.tsx](../../apps/web/src/app/router.tsx).
- The three Apollo links: [errorLink.helpers.ts](../../apps/web/src/shared/api/helpers/errorLink.helpers.ts), [authLink.helpers.ts](../../apps/web/src/shared/api/helpers/authLink.helpers.ts), [splitLink.helpers.ts](../../apps/web/src/shared/api/helpers/splitLink.helpers.ts).
- One real feature with every layer: [features/settings](../../apps/web/src/features/settings/). The tour is in [Auth and settings](../examples/auth-and-settings.md).
- Roles and sections: [navigation.constants.ts](../../apps/web/src/features/workspace/constants/navigation.constants.ts) and [SectionGate.tsx](../../apps/web/src/features/workspace/containers/SectionGate/SectionGate.tsx).
- A test through the real router with Apollo mocks: [teamSettings.test.tsx](../../apps/web/test/integration/teamSettings.test.tsx). Test helpers are in [test/support](../../apps/web/test/support/).
- The primitives to reuse: [shared/ui](../../apps/web/src/shared/ui/). Run Storybook with `mise exec -- pnpm --filter web storybook`.

## Pitfalls

- **Forgetting codegen.** After a `.graphql` or route file changes, the generated files are stale and types fail. Run `mise run codegen`. The web codegen reads the backend schema, so run it after a backend schema change too.
- **Fetching in a view.** A view that calls a hook from `communication/` breaks the layer rule, and `pnpm depcruise` fails.
- **`undefined` from the API.** Map missing data to `null` in the mapping helper. The generated types already use `null`.
- **A stale workspace in the cache.** Without `network-only`, a workspace-scoped query can show the previous workspace's data for a moment.
- **Hiding a button is not security.** `can(...)` is for comfort. The backend checks the role again.
- **English only.** A key in `en/` but not in `uk/` shows English in the Ukrainian UI. Plurals need `_one`, `_few`, `_many` and `_other` in Ukrainian.
- **Raw colours.** Use the tokens in `shared/styles/tokens.css`, not hex values or pixel sizes.

Next: [014 Shipping](014-shipping.md)
