# Testing rules

## Backend

- Every use case has a `*.spec.ts` next to it, running against **real Postgres** (Testcontainers) with RLS active.
- Only external gateways are faked (email, LLM, Telegram), with the gateway's own `.fake.ts` or a fake from `apps/backend/test/support/fakes/`. Our own classes are never mocked. Time is replaced with `ManualClock`.
- Every repository on a tenant table has one cross-tenant test: workspace B sees nothing of workspace A.
- Unit specs sit next to the file they test. Specs through a booted app (GraphQL or HTTP) live in `apps/backend/test/integration/`, for flows across modules. Shared test support lives in `apps/backend/test/support/` by kind (`setup/`, `fakes/`, `fixtures/`, `helpers/`, `modules/`, and more) and is imported as `@test/support/…`. `src/` holds production code only.

## Web

- `view` components with behaviour have a React Testing Library test, next to the component. Shared test support lives in `apps/web/test/support/` and is imported as `@test/support/…`.
- Storybook stories only for reusable `shared/ui` components (Button, Input and similar).
- `communication` hooks are tested with Apollo `MockedProvider`. `logic` hooks and helpers use plain Vitest.
- No end-to-end browser tests. Flows across modules are covered by backend integration specs in `apps/backend/test/integration/`.

## General

- Tests describe behaviour ("rejects a reused refresh token"), not implementation.
- No snapshot tests of whole components.
- No coverage percentage gate. Reviewers check that new behaviour is tested.
- A bug fix comes with a test that fails without it.
