# How to build a feature

This guide is for developers who are new to agent-ic. It shows how one feature goes from the GraphQL schema to a screen. Every example is real code from the repository.

Read the pages in this order:

| #   | Page                                                       | What you learn                                                                   |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | [Run and debug locally](run-and-debug.md)                  | start the stack, read logs and traces, find emails, open the database            |
| 2   | [Backend walkthrough](backend-walkthrough.md)              | the `identity` module file by file: SDL, use case, repository, resolver, test     |
| 3   | [Web walkthrough](web-walkthrough.md)                      | the `auth` and `settings` features file by file: operation, hook, view, container, route |
| 4   | [Worked example: rename a workspace](rename-workspace.md)  | every step for a small resolver plus a screen, in order                          |
| 5   | [Checklists](checklists.md)                                | a new module, a new table, a new background job, a new screen                    |
| 6   | [From pull request to production](shipping.md)             | checks, review, merge, deploy, new environment variables                         |
| 7   | [Starter backlog](backlog.md)                              | work that is left in the MVP scope for team management and settings              |

## The big picture

agent-ic has two apps in one repository:

- `apps/backend` is a NestJS app. The web app talks to it through GraphQL at `/api/graphql`. Login, sign-up and other session calls are REST under `/api/auth`.
- `apps/web` is a React app. It uses Apollo Client for GraphQL and TanStack Router for pages.
- `packages/contracts` holds what both apps share: roles, permissions, error reasons, limits.

A request goes through the same layers every time:

```
web container -> data hook -> GraphQL operation
  -> backend resolver -> use case -> service / repository -> Postgres
```

The backend layers are strict:

- A **resolver** turns a GraphQL field into one use case call. Nothing else.
- A **use case** is one business operation. It checks permissions first, then runs in one transaction.
- A **repository** is the only place with SQL (Drizzle).
- A **service** holds logic that two or more use cases share.

The web layers are strict too:

- `communication/` talks to the API.
- `logic/` holds behaviour without fetching.
- `view/` draws things from props.
- `containers/` wires the three together into a screen.
- `routes/` picks the container for a URL.

Tools check these rules. `mise run check` fails when a file is in the wrong folder, imports the wrong layer or has a comment.

## Rules you will meet on day one

The full list is in [AGENTS.md](../../AGENTS.md) and [docs/rules/](../rules/). The ones juniors hit most:

1. No comments in code. Name things well instead.
2. No hardcoded values. Put names in enums and constants files.
3. Every file lives at `<area>/<kind folder>/<topic>.<kind>.ts`, for example `use-cases/create-workspace.use-case.ts`.
4. Imports are absolute: `@/modules/identity/...`, never `../`.
5. User-facing text goes into the EN and UK translation files. Never put text in a component.
6. On the web, screens use components from `apps/web/src/shared/ui`. Radix is allowed only there.
7. Missing API data on the web is `null`, never `undefined`.

## Tests

Tests are optional during the MVP. Write them where they help. Existing tests must keep passing. When you write one, follow [docs/rules/testing.md](../rules/testing.md). Each walkthrough shows a real test you can copy.

## Where else to look

| Need                                   | Read                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| What the product does                  | [docs/mvp-scope.md](../mvp-scope.md)                    |
| Why the code looks like this           | [docs/architecture.md](../architecture.md), [docs/adr/](../adr/) |
| Where every file goes                  | [docs/rules/structure.md](../rules/structure.md)        |
| Backend module anatomy                 | [apps/backend/AGENTS.md](../../apps/backend/AGENTS.md)  |
| Web feature anatomy                    | [apps/web/AGENTS.md](../../apps/web/AGENTS.md)          |
| How we review pull requests            | [CONTRIBUTING.md](../../CONTRIBUTING.md)                |
