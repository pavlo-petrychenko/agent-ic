# 0005. GraphQL schema-first for the dashboard API; REST for the gateway

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
- The product is API-first: the UI has no private endpoints, and the API should become public later.
- The flow builder, the Inbox and the settings screens read deeply nested data (agent → version → steps → prompts / KBs).
- The team already knows a schema-first GraphQL setup (SDL per module, codegen for typed frontend hooks).
- Channel ingress, on the other hand, has formats set by others (Telegram webhooks) or expected by businesses (POST a message, receive a webhook).

## Decision
- **Dashboard and management API: GraphQL, schema-first**, served by `api`.
  - SDL lives in plain `.graphql` files next to the resolvers: `apps/backend/src/modules/<m>/<m>.graphql`.
  - Resolvers are typed by codegen (`typescript-resolvers`), so a schema change that breaks a resolver fails `tsc`.
  - The merged schema is generated into `packages/api-schema` (see ADR 0007).
  - The web app's operations live in `.graphql` files next to each feature, and codegen produces typed documents or hooks.
- **Channel ingress: REST + webhooks**, served by `gateway`: Telegram webhooks, `POST /v1/channels/{id}/messages`, `POST /v1/channels/{id}/events`.

## Consequences
- One typed contract from the database to the UI. Breaking changes are caught in CI (graphql-inspector against `main`).
- The server needs:
  - DataLoader for every relation (N+1);
  - limits on query depth and complexity;
  - authorization in resolvers or services.
- Caching is per-entity on the client, not HTTP caching.
- The GraphQL server (Apollo Server / Yoga / Mercurius) and the web client are chosen later, together with the API framework.

## Alternatives considered
- **REST + OpenAPI (code-first, generated client):** simpler HTTP caching and tooling, but more round-trips or ad-hoc endpoints for the nested builder and Inbox data, and less familiar to the team.
- **SDL as `gql` strings in TS (as in the reference repo):** works, but loses `.graphql` editor tooling, schema linting and easy diffing.
- **GraphQL for the API channel too:** one style for us, but unusual for businesses' systems that just want to POST a message.
