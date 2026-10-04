# Testing rules

## Backend

- Every use case has a `*.spec.ts` next to it, running against **real Postgres** (Testcontainers) with RLS active.
- Only external gateways are faked (email, LLM, Telegram), with shared fakes from `platform/testing`. Our own classes are never mocked.
- Every repository on a tenant table has one cross-tenant test: workspace B sees nothing of workspace A.
- End-to-end tests through a booted app (GraphQL or HTTP) live in `apps/backend/test/`, for flows across modules.

## Web

- `view` components with behaviour have a React Testing Library test.
- Storybook stories only for reusable `shared/ui` components (Button, Input and similar).
- `communication` hooks are tested with Apollo `MockedProvider`. `logic` hooks and helpers use plain Vitest.
- Playwright end-to-end tests cover key user flows and run on the release pull request.

## General

- Tests describe behaviour ("rejects a reused refresh token"), not implementation.
- No snapshot tests of whole components.
- No coverage percentage gate. Reviewers check that new behaviour is tested.
- A bug fix comes with a test that fails without it.
