# 0010. NestJS with native DI; classes everywhere

- **Status:** Accepted; point 4 superseded by [0012](0012-layering-transport-use-case-service-repository.md)
- **Date:** 2026-10-02
- **Supersedes:** ADR 0009, point 3 (the service-locator context). Points 1 and 2 (transport-agnostic use cases, permissions in the use case) still hold.

## Context
- The backend needs schema-first GraphQL with subscriptions, REST routes for `gateway`, BullMQ consumers for workers, three process roles, and module boundaries that a team of 3 keeps without constant review.
- The framework and the dependency style come as a pair:
  - Nest is built around a DI container with module-level `exports`;
  - a service locator would sit beside that container and give up its main benefits.
- Team preference: classes for everything; plain functions only for pure helpers.

## Decision
1. **NestJS** for `apps/backend`, with the **Express** HTTP adapter (full compatibility with the Nest ecosystem; speed is irrelevant because LLM calls dominate) and the **Apollo** GraphQL driver (`@nestjs/apollo`, schema-first via `typePaths`, subscriptions via graphql-ws + Redis PubSub).
2. **Nest-native DI:**
   - use cases, repositories, gateways and services are `@Injectable()` classes with **constructor dependencies**;
   - external systems (Telegram, LLM, email, S3, Google, KMS) are **abstract gateway classes** used as DI tokens, bound to real or fake implementations per module or test.
3. **Per-request data travels as an explicit `ctx` argument:** `execute(ctx, input)`, where `ctx` holds the actor, workspace, trace id and `authorize()`. Cross-cutting state (trace id, logger, transaction) may additionally travel in AsyncLocalStorage (`nestjs-cls`, `@Transactional()`).
   **No `Scope.REQUEST` providers**: they rebuild the whole dependency chain on every request and don't fit jobs or subscriptions.
4. **Module boundaries = Nest `exports`.**
   - Each domain module exports only its public use cases and read services.
   - Injecting a non-exported provider from another module fails at startup.
   - dependency-cruiser still guards file-level imports.
5. **Core and transport modules per domain module:**
   - `ChannelsModule` (core): use cases, repositories, gateways;
   - `ChannelsGraphqlModule` / `ChannelsHttpModule` / `ChannelsJobsModule`: thin transports.

   Root modules per role import only what that role runs:
   - `ApiAppModule` → GraphQL modules;
   - `GatewayAppModule` → HTTP modules;
   - `WorkerAppModule` → jobs modules for the queues given in `--queues`, started with `createApplicationContext` (no HTTP server besides `/metrics` and `/health`).
6. **Classes everywhere:** use cases, repositories, gateways, resolvers, controllers, job processors, mappers with dependencies. Plain functions only for pure helpers (formatting, calculations, pure validation).

## Consequences
- Dependencies are visible in constructors, and the container does the wiring.
- Tests swap only external systems (`overrideProvider(TelegramGateway).useClass(FakeTelegramGateway)`) and run against a real Postgres.
- **Schema-first resolvers are class methods bound to SDL fields by name.** Argument and return types come from graphql-codegen types, but a missing or misnamed resolver surfaces at **runtime**, not at compile time. Mitigation: a CI boot test that builds the schema and checks the resolver bindings, plus codegen types on every resolver signature.
- The team must learn Nest (modules, providers, decorators, lifecycle). Nest is CommonJS-first, so ESM-only packages may need care.

## Alternatives considered
- **Express / Fastify + a service locator:** familiar and little wiring, but implicit dependencies, and boundaries only through dependency-cruiser.
- **Nest + a service-locator runner (`UseCaseRunner` building use cases outside the container):** two dependency mechanisms side by side; loses Nest's boundary enforcement and test overrides.
- **Request-scoped providers to inject `ctx`:** a performance cost from scope bubbling, and awkward for BullMQ and WebSocket.
