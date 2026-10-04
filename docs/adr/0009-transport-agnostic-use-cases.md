# 0009. Transport-agnostic use cases, permissions in the use case, service-locator context

- **Status:** Accepted; point 3 superseded by [0010](0010-nestjs-native-di.md); the cross-module rule superseded by [0012](0012-layering-transport-use-case-service-repository.md)
- **Date:** 2026-10-02

## Context
The same business operation is triggered from several places:
- `handleIncomingMessage`: the Telegram webhook, the API channel, the dev poller and the simulator;
- `startIngestion`: a GraphQL mutation, the refresh endpoint, a provider webhook and a scheduled job.

Process roles (`gateway`, `api`, workers) only assemble module code (see the server structure in architecture.md).

## Decision
1. **Use cases don't know their transport.** GraphQL resolvers, HTTP routes, job processors (and later a CLI or MCP) are thin **transports**. Each one:
   - parses the input;
   - builds the context (actor, workspace, trace id);
   - calls the use case;
   - maps the result and domain errors to its own format: GraphQL `extensions.code`, an HTTP status, or a job retry / `UnrecoverableError`.
2. **Permissions are enforced in the use case** (`ctx.authorize('knowledge:edit')`), so every current and future transport gets them. Transports only authenticate. System actors (jobs) are scoped to a workspace instead of a role.
3. **Dependencies come from a per-request context:**
   - a base `UseCase` class with a rich per-request **context** (db, repositories / services via `makeRepository` / `makeService`, gateways, pub/sub, queue, logger, trace id, actor);
   - use cases pull what they need from it;
   - external systems (Telegram, LLM, email, S3, Google, KMS) are abstract **gateway** classes with real and mock implementations.

## Consequences
- Little wiring, and the pattern is familiar to the team.
- Dependencies are implicit; a use case can reach any gateway. **Guardrails** we adopt to keep it in check:
  - the context and the gateways object are **typed**; new gateways are added deliberately;
  - another module is used only through its **public API** (`modules/<m>/index.ts`: use cases and read services), never its repositories. dependency-cruiser enforces this in CI;
  - base classes take **one context object**, not long positional constructor lists;
  - only external systems are mocked; database logic is tested against a real Postgres.
- Fits Express / Fastify naturally. With NestJS it would sit beside Nest's constructor DI rather than use it, which is worth weighing in the framework decision (D15).

## Alternatives considered
- **Explicit constructor injection (interfaces only for external systems):** visible dependencies and smaller test setup, but more wiring and a new pattern for the team.
- **Strict ports and adapters (interfaces for everything, including repositories):** the cleanest boundaries and pure unit tests, at roughly twice the files and discipline cost.
- **Direct imports:** the least code, but tests depend on module mocking, and infrastructure leaks into business logic.
