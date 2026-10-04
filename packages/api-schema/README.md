# @agent-ic/api-schema

The merged GraphQL schema of the dashboard API, `schema.graphql`. It is generated from the module SDL files in `apps/backend/src/modules/**/*.graphql` and is not committed (ADR 0007).

Generate it with `pnpm codegen` (or `mise run codegen`). Turbo runs `backend#schema:print`, which builds the backend and writes this file. A consumer's codegen task depends on `backend#schema:print`, so Turbo generates the schema first.

Must not hold: hand-written schema, code, or anything else.
