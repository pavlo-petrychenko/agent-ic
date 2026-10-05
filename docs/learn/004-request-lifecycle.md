# 004 Request lifecycle

[Back to the docs](../README.md)

## What it is

Every request takes the same road through the same layers. This page follows one request from a button click to Postgres and back. The example is "reset the team invite link" in Settings, then the REST variant.

## Why we have it

If every entry point looks the same, you know where to look. Permissions, transactions and errors are handled in one place instead of in each endpoint.

Tools check the rules. `pnpm depcruise` fails when a layer imports one it must not.

## How it works

```
WEB                                       BACKEND (api role)
InviteLinkPanel   (container)
  -> useInviteLink (data hook)
    -> ResetInviteLink.graphql
      -> Apollo links ---POST /api/graphql---> context built from the request
                                                 -> ResetInviteLinkResolver
                                                   -> ResetInviteLinkUseCase
                                                     -> service / repository
                                                       -> Postgres
      <-------------------------------------- resolver maps to the GraphQL type
    <- helper maps to the UI shape
  <- view draws it
```

On the web:

1. The container ([InviteLinkPanel.tsx](../../apps/web/src/features/settings/containers/InviteLinkPanel/InviteLinkPanel.tsx)) calls a hook. It never fetches.
2. The hook ([useInviteLink.ts](../../apps/web/src/features/settings/communication/hooks/useInviteLink.ts)) runs the generated operation and maps the answer to a UI type, with `null` for missing data.
3. The Apollo link chain adds `Authorization` and `x-workspace-id`, and refreshes the session once on `UNAUTHENTICATED`.

On the backend:

1. **Inbound adapter.** The resolver gets `@GraphqlCtx() ctx` and calls one use case. It maps the result to the generated GraphQL type.
2. **Use case.** It checks permissions first with `authorize(ctx, resource, action)`, then does its work in one transaction.
3. **Service or repository.** A repository is the only place with SQL. A service holds logic that two or more use cases share.

A use case without a workspace, such as login, has no `authorize` call. It validates input, checks rate limits, then opens its own transaction.

**REST variant.** A few endpoints are REST because they set or clear cookies: sign-up, login, refresh, logout, confirm email and reset password. `AuthController` has one method per endpoint. Each method gets `@HttpCtx() ctx`, calls one use case and sets or clears a cookie. `AuthRequestGuard` first rejects cross-origin and non-JSON requests, then `UseCaseCtxGuard` builds the ctx.

**The layer rules, each with its reason:**

- One inbound adapter call goes to one use case. So the business flow reads in one file.
- A use case checks permissions first and is one transaction. So a half-done change never commits and an unauthorised one never starts.
- No use case calls another use case. Shared logic goes to a service. So use cases stay a flat list of business operations.
- Calls go only down. A repository never imports a service.
- Resolvers return generated GraphQL types. Use cases return the module's typedefs. A helper maps between them.

## In the code

- [reset-invite-link.resolver.ts](../../apps/backend/src/modules/identity/resolvers/reset-invite-link.resolver.ts): a resolver is one method.
- [reset-invite-link.use-case.ts](../../apps/backend/src/modules/identity/use-cases/reset-invite-link.use-case.ts): `authorize`, then `TenantTransactionService.run`.
- [invite-links.repository.ts](../../apps/backend/src/modules/identity/repositories/invite-links.repository.ts): Drizzle queries through `txHost.tx`.
- [me.resolver.ts](../../apps/backend/src/modules/identity/resolvers/me.resolver.ts): the smallest query resolver.
- [auth.controller.ts](../../apps/backend/src/modules/identity/controllers/auth.controller.ts): the REST variant.
- Specs: [reset-invite-link.use-case.spec.ts](../../apps/backend/src/modules/identity/use-cases/reset-invite-link.use-case.spec.ts) tests a use case; [auth-flow.spec.ts](../../apps/backend/test/integration/auth-flow.spec.ts) calls the REST and GraphQL endpoints over HTTP.

## Pitfalls

- Logic in a resolver or controller. It belongs in the use case, or two entry points will drift apart.
- Calling a repository from a resolver. Go through a use case.
- Calling one use case from another to reuse code. Move the code into a service.
- Returning a generated GraphQL type from a use case. The use case returns the module's typedefs.
- Holding a transaction open across an external call, such as an HTTP request.

Next: back to [the docs](../README.md). More pages are coming.
