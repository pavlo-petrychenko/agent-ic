# apps/web

React single-page app built with Vite. Function components and hooks only. Rules that apply everywhere are in the root `AGENTS.md` and `docs/rules/`. Layout reference: `docs/architecture.md` section 11.4.

## Source layout

```
src/
├── main.tsx             mounts the app
├── app/                 providers (Apollo, i18n, router, auth session), error boundary, layouts
├── routes/              TanStack Router route files: validate params, pick a layout, render one container. No logic
├── features/<feature>/  one folder per product area
└── shared/              ui, api, config, i18n, forms, styles, testing. No feature knowledge
```

## Feature anatomy

Example, the `auth` feature:

```
features/auth/
├── communication/   login.graphql, login.generated.ts, useLogin.ts, useSession.ts; maps API types to frontend types
├── logic/           useLoginForm.ts, validatePassword.ts; no data fetching
├── storage/         session.store.ts; state shared across components, optional
├── view/            LoginForm/, PasswordField/; props in, events out
├── containers/      LoginScreen/; calls communication and logic hooks, composes view components
└── index.ts         public API: LoginScreen, useSession
```

| Layer | May import |
|---|---|
| `communication` | `communication` of the same feature, `shared` |
| `logic` | `logic`, `storage` of the same feature, `shared` |
| `storage` | nothing from the feature |
| `view` | `view`, `storage` of the same feature, `shared/ui` |
| `containers` | `communication`, `logic`, `storage`, `view`, `containers` of the same feature, `shared` |
| `routes` | a feature's `index.ts`, `shared`, `app` |

- Another feature is imported only through its `index.ts` (`@/features/auth`), never a deeper path.
- `shared/` never imports a feature.
- A container exists per screen or per independent panel, so panels fetch their own data and re-render locally.

## Conventions

- Component folders are PascalCase with the component file, its `.module.scss` and its test inside. Hooks are `useX.ts`. Helpers are camelCase.
- Radix primitives appear only inside `shared/ui`. Features use the wrapper components from there.
- Tailwind is for layout only. Colours, spacing scale, typography and states live in `.module.scss` using tokens.
- Server data lives in the Apollo cache. Do not copy it into stores. No `fetch` outside `shared/api`.
- Missing API data is `null`, never `undefined`.
- Imports use the `@/…` alias inside the app. No relative imports that cross a feature boundary.
- Generated files (`*.generated.ts`, `routeTree.gen.ts`) are gitignored. After changing a `.graphql` file or a route, run `pnpm codegen` (or `mise run codegen`).
- Runtime config lives in `public/config.json` and is validated by `shared/config` before the first render. Never read `import.meta.env` for values that differ per environment.
- User-facing text goes through `react-i18next` keys in `shared/i18n/locales/{en,uk}`; plural forms use the `_one/_few/_many/_other` suffixes.
- Design tokens are CSS variables in `shared/styles/tokens.css`. Use them in `.module.scss`; do not write raw colours or pixel values there.
- Tests: `view` components with behaviour use React Testing Library. `communication` hooks use Apollo `MockedProvider`. `logic` hooks and helpers use plain Vitest. Stories exist only for reusable `shared/ui` components.
