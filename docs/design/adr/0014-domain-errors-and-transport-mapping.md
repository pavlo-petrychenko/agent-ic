# 0014. Domain errors and their mapping per transport

- **Status:** Accepted
- **Date:** 2026-10-03

## Context
- Use cases don't know their transport (ADR 0009). The same failure, such as "agent not found" or "source limit reached", must come out correctly as a GraphQL error, an HTTP response, or a job that retries or gives up.
- Clients need stable machine-readable codes. Messages change; codes don't.
- The UI is in English and Ukrainian.

## Decision
- **One base class** in `platform/errors`: `DomainError` with:
  - `kind`, a fixed set: `NotFound`, `Forbidden`, `Unauthenticated`, `Conflict`, `ValidationFailed`, `LimitReached`, `PreconditionFailed`;
  - `code`, stable and specific, e.g. `AGENT_NOT_FOUND`;
  - an English developer `message` and optional `details`.
- Each module declares its own error classes in `domain/errors.ts`.
- External gateways throw `UpstreamError` with `retryable` set from the provider's response (429/5xx → true, other 4xx → false).
- **One mapper per transport,** also in `platform/errors`:

  | Kind | GraphQL `extensions.code` | HTTP | Job |
  |---|---|---|---|
  | NotFound | `NOT_FOUND` | 404 | give up (`UnrecoverableError`) |
  | Forbidden / Unauthenticated | `FORBIDDEN` / `UNAUTHENTICATED` | 403 / 401 | give up |
  | Conflict / PreconditionFailed | `CONFLICT` / `PRECONDITION_FAILED` | 409 / 412 | give up |
  | ValidationFailed | `BAD_USER_INPUT` + field paths | 422 | give up |
  | LimitReached | `LIMIT_REACHED` | 429 (rate) / 402 (plan) | give up, or delay for rate limits |
  | UpstreamError | `UPSTREAM_ERROR` | 502 | retry if `retryable` |
  | Anything else (bug, timeout) | `INTERNAL` + traceId, no internals | 500 | retry with backoff |

- **GraphQL:** every failure is thrown and lands in top-level `errors[]` with `extensions: { code, reason, fields?, traceId }`, where `reason` is the specific code. No result unions.
- **REST gateway:** RFC 9457 `application/problem+json` with `type`, `title`, `status`, `detail`, plus our `code`, `traceId` and `errors[]` for field problems.
- **User-facing text:** the web app maps `reason` (+ `details`) to EN/UK text. The backend never translates, and the public API returns English messages.
- Unknown errors are logged with their stack and trace id. Domain errors are logged at `info` / `warn`, not `error`.

## Consequences
- Use cases throw domain errors and never think about status codes or retries.
- Error codes are a contract. Renaming a code breaks clients, so the codes are listed in the docs together with the schema.
- The GraphQL schema doesn't say which errors a mutation can return. The web app handles them through one error link plus per-form field mapping.

## Alternatives considered
- **Errors as data (GraphQL result unions):** typed expected failures, at the cost of much more SDL and resolver mapping per mutation.
- **Stripe-style `{ error: { … } }` envelope for REST:** readable, but our own convention rather than a standard.
- **Backend translation by `ctx.locale`:** two i18n catalogues, and the backend would own UI wording.
