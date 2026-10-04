# apps/web

React single-page app built with Vite. Function components and hooks only. Rules that apply everywhere are in the root `AGENTS.md` and `docs/rules/`. The full structure spec, with the reason for every folder, is `docs/rules/structure.md`.

## Source layout

```
src/
├── main.tsx             mounts the app
├── app/                 bootstrap.tsx, router.tsx; components/, providers/, layouts/, constants/, typedefs/
├── routes/              TanStack Router route files: validate params, pick a layout, render one container. No logic
├── features/<feature>/  one folder per product area
└── shared/              api, config, forms, i18n, ui, styles. No feature knowledge
test/support/            setup/, components/, helpers/, constants/; imported as @test/support/…
```

## Kinds

Two levels. Kind folders inside each area, and component folders `<Name>/`.

| Kind | Folder | File | Why |
| --- | --- | --- | --- |
| Operation | `gql/{query,mutation,subscription,fragment}/` | `x.graphql`, with `x.generated.ts` beside it (gitignored) | the API contract in one place |
| Hook | `hooks/` | `useX.ts` | one hook per file |
| Helper | `helpers/` | `x.helpers.ts` | pure functions, including Apollo links and API to UI mapping |
| Presentational | `view/<Name>/` | component folder | props in, events out |
| Screen | `containers/<Name>/` | component folder | wires communication, logic and view |
| Outside features | `components/`, `layouts/`, `providers/`, `fields/` | component folder | same folder shape as in features |
| Context | `contexts/` | `x.context.ts` | shared React state |
| Client | `clients/` | `x.client.ts` | configured singletons (Apollo client, i18next) |
| Error | `errors/` | `x.error.ts` | error classes such as `AppError` |
| Schema, constants, types | `schemas/`, `constants/`, `typedefs/` | `x.schema.ts`, `x.constants.ts`, `x.typedefs.ts` | as on the backend |
| Fixture | `fixtures/` | `x.fixture.ts` | Apollo mocks and test data |
| Translations | `locales/{en,uk}/` | `*.json` | user-facing text |

A component folder is flat: `Name.tsx`, `Name.module.scss`, `Name.test.tsx`, `Name.typedefs.ts`, `Name.constants.ts`, `index.ts`, and when the component owns them, `useX.ts` and `x.context.ts`. Stories (`Name.stories.tsx`) exist only in `shared/ui`. A private sub-component is a nested folder.

## Feature anatomy

Example, the `status` feature:

```
features/status/
├── index.ts                         the only import point for routes and other features
├── constants/  typedefs/            shared by every layer of the feature
├── communication/                   talks to the API
│   ├── gql/query/serverStatus.graphql
│   ├── hooks/useServerStatus.ts
│   ├── helpers/serverStatus.helpers.ts     API to UI shape
│   └── fixtures/serverStatus.fixture.ts
├── logic/                           behaviour hooks and pure helpers, no data fetching
│   ├── hooks/useUptimeLabel.ts
│   └── helpers/uptime.helpers.ts
├── storage/                         state shared across components, optional
├── view/ServerStatus/               presentational, no data fetching
└── containers/StatusPage/           wires communication + logic + view into a screen
```

| Layer | May import |
|---|---|
| `communication` | `communication` of the same feature, the feature's `constants` and `typedefs`, `shared` |
| `logic` | `logic`, `storage` of the same feature, the feature's `constants` and `typedefs`, `shared` |
| `storage` | the feature's `constants` and `typedefs` only |
| `view` | `view`, `storage` of the same feature, the feature's `constants` and `typedefs`, `shared/ui` |
| `containers` | `communication`, `logic`, `storage`, `view`, `containers` of the same feature, the feature's `constants` and `typedefs`, `shared` |
| `routes` | a feature's `index.ts`, `shared`, `app` |

- Another feature is imported only through its `index.ts` (`@/features/status`), never a deeper path.
- `shared/` never imports a feature.
- A container exists per screen or per independent panel, so panels fetch their own data and re-render locally.

## Shared

```
shared/
├── api/      clients/ helpers/ errors/ schemas/ constants/ typedefs/
├── config/   helpers/ schemas/ constants/ typedefs/
├── forms/    hooks/ fields/ contexts/ helpers/ typedefs/
├── i18n/     clients/ hooks/ helpers/ locales/ constants/ typedefs/
├── ui/       component folders; the only place Radix may appear
└── styles/   tokens.css · global.scss · tailwind.css
```

## Conventions

- Component folders are PascalCase. Hooks are `useX.ts`. Helpers are camelCase files named `x.helpers.ts`.
- Radix primitives appear only inside `shared/ui`. Features use the wrapper components from there.
- Tailwind is for layout only. Colours, spacing scale, typography and states live in `.module.scss` using tokens.
- Server data lives in the Apollo cache. Do not copy it into stores. No `fetch` outside `shared/api`.
- Missing API data is `null`, never `undefined`.
- Imports are absolute: `@/…` in `src`, `@test/…` in test support. Never relative, not even inside one folder. No blank lines between imports.
- Generated files (`*.generated.ts`, `routeTree.gen.ts`) are gitignored. After changing a `.graphql` file or a route, run `pnpm codegen` (or `mise run codegen`).
- Runtime config lives in `public/config.json` and is validated by `shared/config` before the first render. Never read `import.meta.env` for values that differ per environment.
- User-facing text goes through `react-i18next` keys in `shared/i18n/locales/{en,uk}`; plural forms use the `_one/_few/_many/_other` suffixes.
- Design tokens are CSS variables in `shared/styles/tokens.css`. Use them in `.module.scss`; do not write raw colours or pixel values there.
- Tests sit next to the file (`Name.test.tsx`). `view` components with behaviour use React Testing Library. `communication` hooks use Apollo `MockedProvider`. `logic` hooks and helpers use plain Vitest. Stories exist only for reusable `shared/ui` components.
- A pull request that changes UI includes screenshots of every changed story or screen, stored on the `pr-assets` branch.
