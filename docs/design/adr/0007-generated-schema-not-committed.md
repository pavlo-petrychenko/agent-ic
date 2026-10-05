# 0007. The merged GraphQL schema is generated, not committed

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
SDL is written per module inside `apps/backend` (ADR 0005). The web app and the API test SDK need the merged schema for codegen. They must not reach into backend source; Turbo needs a dependency it can see.

## Decision
- `packages/api-schema` holds `schema.graphql`, **generated** by a Turbo task (`backend#schema:print`) and **gitignored**.
- Consumers' codegen depends on that package, so Turbo runs it first and caches the result.
- CI builds the schema for both the PR and `main` and diffs them with graphql-inspector to flag breaking changes.
- A root `graphql.config.ts` points editors at the module SDL files, so autocomplete works without a build.

## Consequences
- No merge conflicts or noise from a large generated file. PR diffs show the per-module `.graphql` changes directly.
- A fresh clone has to run the build (or `pnpm dev`) before the web app's codegen works. Turbo does this automatically.
- If the public API ships, CI publishes the schema to a registry (e.g. Hive or Apollo GraphOS) on release, not by committing it.

## Alternatives considered
- **Commit `schema.graphql` with a "file is up to date" check in CI:** works without a build and makes the contract visible, but causes merge conflicts and duplicates what the per-module `.graphql` diffs already show.
- **Web codegen globbing into backend source (as in the reference repo):** no extra step, but Turbo can't see the dependency without hand-written `inputs`, and the web app depends on backend internals.
