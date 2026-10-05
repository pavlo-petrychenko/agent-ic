# 005 Request context

[Back to the docs](../README.md)

## What it is

Every use case takes a `ctx` as its first argument. The `ctx` is a small read-only object that says who is acting, in which workspace, and which request this is.

| Field                          | Meaning                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `actor`                        | who acts: a user, an API channel, the system or nobody                       |
| `initiatedBy`                  | who started the work, when the actor is the system (a job); otherwise `null` |
| `workspaceId`, `workspaceRole` | the workspace of this call and the actor's role in it, or `null`             |
| `traceId`                      | one id for the whole request, in logs, errors and jobs                       |
| `locale`, `clientIp`           | language and caller address                                                  |

The type is `UseCaseCtx` in [use-case-ctx.typedefs.ts](../../apps/backend/src/platform/context/typedefs/use-case-ctx.typedefs.ts).

## Why we have it

A use case must not read a request, a header or a token. That would tie business code to HTTP, and a job has no HTTP request at all. So each entry point builds a `ctx` first, and the use case only reads it. The same use case then runs from a resolver, a controller or a job, and a test can pass a hand-made `ctx`.

## How it works

```
 token + x-workspace-id + accept-language
              |
   UseCaseCtxService.create()
      1. token -> actor (no token = anonymous)
      2. public workspace id -> real id
      3. member of it? -> role, else no workspace
              |
            ctx  ->  use case  ->  authorize(ctx, ...)
```

The four actors are in [actor.typedefs.ts](../../apps/backend/src/platform/context/typedefs/actor.typedefs.ts):

- **User:** a signed-in person (`userId`).
- **ApiChannel:** a channel calling the gateway (`channelId`). The type exists, but nothing builds this actor yet.
- **System:** background work. Its reason is `job` or `schedule`.
- **Anonymous:** no token.

Each entry point builds the `ctx` its own way:

1. **GraphQL:** `GraphqlOptionsService` builds it once per request. A resolver reads it with `@GraphqlCtx()`.
2. **REST:** `UseCaseCtxGuard` builds it and stores it for the request. A controller reads it with `@HttpCtx()`. A controller without the guard gets `MissingHttpCtxError`.
3. **Jobs:** `JobExecutionService` builds a system `ctx` from the job's envelope. It keeps the workspace, the trace id and `initiatedBy` of the request that queued the job.

The workspace comes from the `x-workspace-id` header (for a WebSocket, from the connection parameters). If the user is not a member, the `ctx` has no workspace. Then `authorize` throws `WorkspaceAccessDeniedError`.

## In the code

- [platform/context/](../../apps/backend/src/platform/context/): all of it.
- [use-case-ctx.service.ts](../../apps/backend/src/platform/context/services/use-case-ctx.service.ts): `create` (a request) and `system` (a job).
- [use-case-ctx.helpers.ts](../../apps/backend/src/platform/context/helpers/use-case-ctx.helpers.ts):
  - `requireUserActor(ctx)` throws unless a user acts. It returns the user.
  - `requireSystemActor(ctx)` throws unless the system acts. Use it in a use case that only a job may run.
  - `getOriginator(ctx)` returns `initiatedBy`, or the actor if there is none.
- [authorize.helpers.ts](../../apps/backend/src/platform/context/helpers/authorize.helpers.ts): `authorize(ctx, resource, action)` needs a user, a workspace and a role that may do the action. It returns `{ userId, workspaceId, role }`.
- [workspace-access.service.ts](../../apps/backend/src/platform/context/services/workspace-access.service.ts): a port. The `identity` module implements it, so the platform never imports a module.
- Example: [me.resolver.ts](../../apps/backend/src/modules/identity/resolvers/me.resolver.ts) and [auth.controller.ts](../../apps/backend/src/modules/identity/controllers/auth.controller.ts).
- A use case that checks the actor first: [update-invite-link-role.use-case.ts](../../apps/backend/src/modules/identity/use-cases/update-invite-link-role.use-case.ts).
- Specs: [use-case-ctx.service.spec.ts](../../apps/backend/src/platform/context/services/use-case-ctx.service.spec.ts) and [authorize.helpers.spec.ts](../../apps/backend/src/platform/context/helpers/authorize.helpers.spec.ts).

### The trace id

The app keeps a per-request store (CLS, from `nestjs-cls`). Its request id is the OpenTelemetry trace id when a span is active, or a random one. `TraceIdService.current()` returns it, and it becomes `ctx.traceId`.

So the id in a log line, and in an error response is the same id. A job gets the trace id of the request that queued it: `JobExecutionService` sets it before the handler runs.

## Pitfalls

- A resolver or controller passes `ctx` to one use case. It never reads the token itself.
- Do not trust a workspace id from the input. Take `access.workspaceId` from `authorize`.
- `ctx.workspaceId` is the real id. The id the client sends is a public id with a prefix, and `IdService` converts it.
- `ctx` is `readonly`. To act as another actor, build a new one.
- A public call such as sign-up or login runs with an anonymous actor, so it cannot call `authorize`.

Next: [006 Transactions and row-level security](006-transactions-and-rls.md)
