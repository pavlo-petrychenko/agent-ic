# Code rules

Enforced by oxlint, oxfmt, `tools/check-comments.ts` and `tsc`. See [guardrails](../../CONTRIBUTING.md#guardrails).

1. **No comments.** Only tool directives are allowed: `oxlint-disable-next-line <rule>`, `@ts-expect-error`, `/// <reference>`. If code needs a comment, rename or extract until it doesn't. No JSDoc, no README inside modules. Enforced by `pnpm check:comments` (pre-commit and CI) on `.ts`, `.tsx`, `.js`, `.cjs`, `.mjs` and `.scss` files.
2. **Backend: classes** for use cases, services, repositories, gateways, resolvers, controllers and processors. Plain functions only for pure helpers (D24).
3. **Web: functional.** Function components, hooks, pure helpers (D53).
4. **TypeScript strict.**
   - No `any`, no non-null `!`.
   - `enum`s are fine. Use string enums so values stay readable in the database and logs.
   - No default exports, except where a tool requires them (route files, config files, stories).
5. **Naming.**
   - Backend files are `kebab-case.<type>.ts` (`sign-up.use-case.ts`).
   - Backend classes end with their type (`SignUpUseCase`, `UsersRepository`).
   - Web component folders are PascalCase, hooks are `useX.ts`, helpers are camelCase.
6. **No barrel files**, except the public `index.ts` of a backend module or a web feature.
7. **Errors.** Throw `DomainError` subclasses. Never return error objects. Never catch and ignore.
8. **No `console.*`.** Use the logger.
9. **No `process.env`** outside `apps/backend/src/platform/config`.
10. **Time and ids.** Use `Clock` and `IdService` in domain code, never `new Date()` or `randomUUID()` directly.
11. **Frontend types use `null`, never `undefined`,** for missing API data.
12. **Imports.** `@/…` alias inside an app; packages by name (`@agent-ic/contracts`); no relative imports across a module or feature boundary.

## What enforces what

| Rule | Tool |
|---|---|
| 1 | `tools/check-comments.ts` |
| 4 (`any`, `!`, default export) | oxlint `typescript/no-explicit-any`, `typescript/no-non-null-assertion`, `import/no-default-export` |
| 8, 9 | oxlint `no-console`, `node/no-process-env` |
| 6, 12 (boundaries) | dependency-cruiser |
| Everything else | review |
