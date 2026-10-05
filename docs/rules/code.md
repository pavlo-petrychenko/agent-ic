# Code rules

Enforced by oxlint, oxfmt, `tools/check-comments.ts`, `tools/check-structure.ts` and `tsc`. See [guardrails](../../CONTRIBUTING.md#guardrails). Where each file goes is in [structure.md](structure.md).

1. **No comments.** Only tool directives are allowed: `oxlint-disable-next-line <rule>`, `@ts-expect-error`, `/// <reference>`. If code needs a comment, rename or extract until it doesn't. No JSDoc, no README inside modules. Enforced by `pnpm check:comments` (pre-commit and CI) on `.ts`, `.tsx`, `.js`, `.cjs`, `.mjs` and `.scss` files.
2. **Backend: classes** for use cases, services, repositories, gateways, resolvers, controllers, processors and listeners. Logic without state is a pure function in `helpers/` (D24).
3. **Web: functional.** Function components, hooks, pure helpers (D53).
4. **TypeScript strict.**
   - No `any`, no non-null `!`.
   - `enum`s are fine. Use string enums so values stay readable in the database and logs.
   - No default exports, except where a tool requires them (route files, config files, stories).
5. **Naming.**
   - Backend files are `<topic>.<kind>.ts` in the folder of their kind (`use-cases/sign-up.use-case.ts`), with kebab-case topics.
   - Backend classes end with their kind (`SignUpUseCase`, `UsersRepository`, `ClockService`, `PlatformAdminGuard`).
   - Web component folders are PascalCase, hooks are `useX.ts`, helpers are `x.helpers.ts`.
6. **No barrel files**, except the public `index.ts` of a backend module or a web feature, and the `index.ts` of a component folder.
7. **Errors.** Throw `DomainError` subclasses. Never return error objects. Never catch and ignore.
8. **No `console.*`.** Use the logger.
9. **No `process.env`** outside `apps/backend/src/platform/config`.
10. **Time, randomness and ids are services.** Use `ClockService`, `IdService` and `SecureTokenService`, never `new Date()`, `randomUUID()` or `Math.random()` in domain code. They are services even though they hold no state, so tests can replace them.
11. **Frontend types use `null`, never `undefined`,** for missing API data.
12. **Imports are absolute.** In apps, `@/…` in source and `@test/…` in test support. In a package, `@<package>/…` in source (`@contracts/permissions/permission.constants`) and `@test/…` in test support, declared as `paths` in the package's `tsconfig.json`. Other packages by name (`@agent-ic/contracts`). Relative paths and Node subpath imports (`#…`) are never used, not even within one folder. Imports have no blank lines between them; the formatter sorts them. Root config files that Vite or Storybook load before any alias exists are the only exception. Why the aliases look this way: `docs/rules/structure.md` rule 8.
13. **No hardcoding, not even in placeholder code.**
    - No magic strings or numbers: paths, prefixes, ports, hosts, header names, status values, log messages, exit codes.
    - A fixed set of values is an `enum`. Any other value is a named constant.
    - Configuration comes only from env, read and validated by the zod config in `platform/config`. Never set an env value inline in a `package.json` script, a Dockerfile or code. Values belong in `.env.example` (compose passes them on) and in the zod schema.
    - Inputs that choose behaviour at start-up, such as the backend role or the worker queues, are CLI arguments parsed by the `serve` command.
    - A value used by two areas has one home, in the lower area (`MILLISECONDS_PER_SECOND` lives in `platform/clock`).
14. **Types, constants and helpers live in their own kind folders, one file per topic.**
    - `typedefs/<topic>.typedefs.ts` holds interfaces and type aliases.
    - `constants/<topic>.constants.ts` holds constants and enums.
    - `helpers/<topic>.helpers.ts` holds pure helper functions, including mappers between shapes.
    - `schemas/<topic>.schema.ts` holds zod schemas.
    - A class file declares the class and nothing else. Spec files may keep small local helpers.
15. **No value classes.** Data is an interface in `typedefs/`, and logic on data is a helper. Definitions of jobs, events, channels, cache entries and rate-limit policies are made with `defineJob`, `defineDomainEvent`, `defineChannel`, `defineCacheEntry` and `defineRateLimitPolicy`, not with abstract definition classes.
16. **Service or helper.** A class with state or injected dependencies is a service. Logic without state is a helper, a plain function that tests call directly. The only exception is time, randomness and ids (rule 10).

## What enforces what

| Rule | Tool |
|---|---|
| 1 | `tools/check-comments.ts` |
| 4 (`any`, `!`, default export) | oxlint `typescript/no-explicit-any`, `typescript/no-non-null-assertion`, `import/no-default-export` |
| 8, 9 | oxlint `no-console`, `node/no-process-env` |
| 5 (file layout), 6, 14 (folders and suffixes) | `tools/check-structure.ts` |
| 6, 12 (boundaries) | dependency-cruiser |
| 12 (relative and `#` imports) | oxlint `no-restricted-imports` in `apps/*/src`, `apps/*/test`, `packages/*/src` and `packages/*/test` (generated files are exempt); oxfmt sorts imports |
| 13, 15, 16 | review |
| Everything else | review |
