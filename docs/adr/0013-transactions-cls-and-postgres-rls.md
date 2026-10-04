# 0013. Transactions through CLS; tenant isolation with repositories + Postgres RLS

- **Status:** Accepted
- **Date:** 2026-10-03

## Context
- A use case is the transaction boundary (ADR 0012). It may span repositories and services of several modules, plus an outbox row, and all of them must commit or roll back together.
- The platform stores businesses' documents and their customers' conversations. One query that forgets `workspace_id` would leak one tenant's data to another, and that is the worst bug we could ship.
- Postgres sits behind PgBouncer in transaction mode (homeserver), and later RDS Proxy (AWS). Session-level settings don't survive between transactions.

## Decision
**Transactions:**
- `nestjs-cls` + `@nestjs-cls/transactional` with the Drizzle adapter. The use case's `execute()` is marked `@Transactional()`.
- Services and repositories read `txHost.tx`, which is the open transaction or the pool, and so join automatically.
- `ctx` stays about *who* is acting (actor, workspace). The transaction, trace id and log fields travel in AsyncLocalStorage.
- **Rules:**
  - no fire-and-forget work inside a use case; side effects go through the outbox;
  - **no transaction held across an external call** (LLM, Telegram, HTTP). Use cases that make external calls, such as running a step or ingesting a source, wrap their database work in short explicit transactions instead of one `@Transactional()`.

**Tenant isolation, in two layers:**
1. **Repositories** always filter by `ctx.workspaceId`.
   - Every tenant table has `workspace_id`, and its indexes start with it.
   - A schema test fails if a tenant table lacks `workspace_id` or an RLS policy.
2. **Row-Level Security** as a safety net:
   - Every tenant table has `ENABLE` + `FORCE ROW LEVEL SECURITY` with the policy
     `workspace_id = nullif(current_setting('app.workspace_id', true), '')::uuid`.
     When the setting is missing, no rows are visible (fail closed).
   - Every tenant transaction starts with `set_config('app.workspace_id', ctx.workspaceId, true)`, which is transaction-local and so safe with PgBouncer. A platform helper does this when `@Transactional()` (or an explicit short transaction) opens with a `ctx`.
   - Policies are defined in the Drizzle schema (`pgPolicy`) and ship with migrations.

**Database roles:**
- `app_owner` runs migrations.
- `app` is used by all application code. It doesn't own the tables and has no `BYPASSRLS`.
- `app_system` has `BYPASSRLS` and is reached only through an explicit `SystemDb` provider in `platform/`. Only cross-tenant system work uses it: the outbox relay, schedulers scanning all workspaces, analytics rollups, and pre-workspace identity lookups such as "which workspaces does this user belong to".

## Consequences
- A forgotten filter returns nothing instead of another tenant's rows. Cross-tenant access is explicit (`SystemDb`) and easy to find in review.
- Every tenant query runs in a transaction. The overhead is negligible for our query shapes.
- A query that "returns nothing" may mean the setting wasn't applied. The helper logs a warning when a tenant table is queried without one, in dev and tests.
- **Tests:**
  - each test runs in a transaction that is rolled back;
  - RLS is active in tests (the `app` role), so leaks are caught there;
  - one cross-tenant test per repository checks that a second workspace sees nothing.
- AsyncLocalStorage is implicit. A call that escapes the async chain runs outside the transaction, which is why fire-and-forget is banned.

## Alternatives considered
- **Transaction carried in `ctx` (`database.transaction(ctx, txCtx => …)`):** explicit, but every call site must pass `txCtx`, and using the outer `ctx` by mistake silently writes outside the transaction.
- **Repositories only, without RLS:** simplest, but one missed filter is a data leak.
- **Repositories now, RLS later:** retrofitting means wrapping every query in a transaction and finding every cross-tenant query after the fact. That costs much more than starting with it.
- **Schema or database per tenant:** strong isolation, but migrations and connections multiply with tenants, and it conflicts with KB-scoped search and analytics across one schema per module.
