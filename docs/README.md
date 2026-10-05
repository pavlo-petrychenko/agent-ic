# agent-ic docs

Start here. This page tells you what agent-ic is, where things are, and which pages to read in which order.

## The product

- agent-ic is an API-first platform for chat agents.
- A small business builds an agent visually as a flow graph, gives it knowledge from its own documents and extends it with custom tools.
- It publishes the agent to messengers such as Telegram.
- Built today: sign-up, login, workspaces, team invites and settings. The flow builder, knowledge, tools and channels are not built yet.
- The backend is a NestJS modular monolith on Postgres and Redis. The web app is a React single-page app. Both live in one pnpm and Turborepo monorepo.

## Repo map

| Folder         | What is in it                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/backend` | the NestJS app. [Module anatomy](../apps/backend/AGENTS.md)                                                                                                                    |
| `apps/web`     | the React app. [Feature anatomy](../apps/web/AGENTS.md)                                                                                                                        |
| `packages/`    | code both apps share: `contracts`, `flow`, `api-schema`, and the lint and TypeScript configs                                                                                   |
| `deploy/`      | the Dockerfiles for local use and production, and the Helm chart                                                                                                               |
| `tools/`       | the code behind the `mise run` commands, the structure and comment checks, the commit hooks                                                                                    |
| `docs/learn/`  | the numbered pages below: one idea per page, read in order                                                                                                                     |
| `docs/rules/`  | the rules, one page per topic: [code](rules/code.md), [architecture](rules/architecture.md), [structure](rules/structure.md), [testing](rules/testing.md), [git](rules/git.md) |

A request goes through the same layers every time. Page 004 shows it in full.

```
web container -> data hook -> GraphQL operation
  -> backend resolver -> use case -> service / repository -> Postgres
```

## Reading path

Read the pages in order. Each page ends with a link to the next.

| #   | Page                                                | What you learn                                                        |
| --- | --------------------------------------------------- | --------------------------------------------------------------------- |
| 001 | [Run and debug](learn/001-run-and-debug.md)         | start the stack, read logs and traces, find emails, open the database |
| 002 | [The big picture](learn/002-the-big-picture.md)     | the two apps, the three backend roles, Postgres and the two Redis     |
| 003 | [Code layout](learn/003-code-layout.md)             | where every file goes, modules and platform, how to add a module      |
| 004 | [Request lifecycle](learn/004-request-lifecycle.md) | one request from the screen to Postgres, and the layer rules          |

## Guides being moved

These pages from the old guide are still being moved into the learning path and the examples. Until then, read them here.

- [Backend walkthrough](guides/backend-walkthrough.md): the `identity` module file by file.
- [Web walkthrough](guides/web-walkthrough.md): the `auth` and `settings` features file by file.
- [Worked example: rename a workspace](guides/rename-workspace.md): every step for a small resolver plus a screen, in order.
- [Checklists](guides/checklists.md): a new table, a new background job, a new screen.
- [From pull request to production](guides/shipping.md): checks, review, merge, deploy, new environment variables.
- [Starter backlog](guides/backlog.md): work that is left in the MVP scope for team management and settings.

## Rules you will meet on day one

The full list is in [AGENTS.md](../AGENTS.md) and [docs/rules/](rules/code.md). The ones people hit most:

1. No comments in code. Name things well instead.
2. No hardcoded values. Put names in enums and constants files.
3. Every file lives at `<area>/<kind folder>/<topic>.<kind>.ts`, for example `use-cases/create-workspace.use-case.ts`.
4. Imports are absolute: `@/modules/identity/...`, never `../`.
5. User-facing text goes into the EN and UK translation files. Never put text in a component.
6. On the web, screens use components from `apps/web/src/shared/ui`. Radix is allowed only there.
7. Missing API data on the web is `null`, never `undefined`.

Tools check these rules. `mise run check` fails when a file is in the wrong folder, imports the wrong layer or has a comment.

## Tests

Tests are optional during the MVP. Write them where they help. Existing tests must keep passing. When you write one, follow [testing.md](rules/testing.md). The walkthroughs point to real tests you can copy.

## More

- [CONTRIBUTING.md](../CONTRIBUTING.md): setup, branches, pull requests and review.
- [apps/backend/AGENTS.md](../apps/backend/AGENTS.md): backend module anatomy, commands and roles.
- [apps/web/AGENTS.md](../apps/web/AGENTS.md): web feature anatomy.
- Packages: what each one holds and must not hold is in its `README.md`: [contracts](../packages/contracts/README.md), [flow](../packages/flow/README.md), [api-schema](../packages/api-schema/README.md), [oxc-config](../packages/oxc-config/README.md), [tsconfig](../packages/tsconfig/README.md).
