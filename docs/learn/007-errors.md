# 007 Errors

[Back to the docs](../README.md)

## What it is

When something goes wrong in the business, the code throws a `DomainError`. It is a class that says what kind of problem it is and why. One filter turns it into a clean answer for the client, in GraphQL or in REST.

A `DomainError` has:

| Field     | Meaning                                                                  |
| --------- | ------------------------------------------------------------------------ |
| `kind`    | the family: not found, forbidden, conflict, validation failed, and so on |
| `reason`  | a specific, stable name, such as `EMAIL_TAKEN`                           |
| `message` | a short sentence in English                                              |
| `fields`  | for a validation error, one `{ path, reason }` per bad field             |
| `details` | extra data for code and tests. It is not sent to the client              |

## Why we have it

A client cannot parse a sentence. It needs a stable name to decide what to show: "this email is taken" next to the email field. And a use case must not know about HTTP status codes. So the use case throws a business error, and one place maps it to a transport.

Anything that is not a `DomainError` is a bug or an outage. The client gets a generic message, never a stack trace. The details go to the logs, with the trace id.

## How it works

```
use case throws EmailTakenError
        |
 TransportExceptionFilter  (catches everything)
        |
  describeError(error)  ->  code, reason, message, status, fields
     |                  |
  GraphQL            REST
  extensions:        application/problem+json:
  code, reason,      status, code, reason,
  traceId, fields    traceId, errors
```

1. The kind picks the `ErrorCode` (`CONFLICT`, `FORBIDDEN`, ...) and the HTTP status.
2. The `reason` comes from `ErrorReason` in `packages/contracts`, so the web app uses the same names.
3. `UpstreamError` (an outside service failed) is not a `DomainError`. It becomes `UPSTREAM_ERROR` with status 502 and a `retryable` flag.
4. An `HttpException` below 500 keeps its status. An `HttpException` of 500 or more, and any other error, becomes `INTERNAL`.
5. `ErrorReporterService` logs it: a domain error at info level, an upstream error as a warning, anything unexpected as an error.

A limit error extends `LimitReachedError` and picks a scope. A `rate` limit answers 429. A `plan` limit answers 402.

### In a job

There is no client in a job, so `jobFailureActionFor` decides retry or give up:

- A domain error: give up. Trying again gives the same answer.
- A rate limit: retry later. A plan limit: give up.
- An upstream error: retry only when `retryable` is true. `UpstreamError.fromStatus` sets it for 5xx, 408 and 429.
- Any other error: retry.

On give up, `JobExecutionService` throws BullMQ's `UnrecoverableError`, so no more attempts happen.

## Add one

A new business error. Use [email-taken.error.ts](../../apps/backend/src/modules/identity/errors/email-taken.error.ts) as the model.

- [ ] Reuse an existing `ErrorReason` if one fits. Otherwise add a new value to `ErrorReason` in [errors.constants.ts](../../packages/contracts/src/errors/errors.constants.ts).
- [ ] The message goes in a constant in the module's `constants/<m>-error.constants.ts`, for example `EMAIL_TAKEN_MESSAGE`. No literal in the class.
- [ ] File `modules/<m>/errors/<name>.error.ts`: a class that extends `DomainError`, with `readonly kind = DomainErrorKind.<Kind>` and `readonly reason = ErrorReason.<Reason>`.
- [ ] Pick the kind by meaning: `NotFound`, `Forbidden`, `Unauthenticated`, `Conflict`, `ValidationFailed`, `LimitReached`, `PreconditionFailed` or `UnsupportedMediaType`.
- [ ] A validation error passes `fields`: `super(MESSAGE, { fields })`. See [invalid-workspace-input.error.ts](../../apps/backend/src/modules/identity/errors/invalid-workspace-input.error.ts).
- [ ] A limit error extends `LimitReachedError` and sets `scope` (`LimitScope.Rate` or `LimitScope.Plan`). See [rate-limited.error.ts](../../apps/backend/src/platform/rate-limit/errors/rate-limited.error.ts).
- [ ] Throw it from a use case or service. Never catch it only to hide it.
- [ ] Add the text for the new reason, in English and Ukrainian, under `reason.<REASON>` in `apps/web/src/shared/i18n/locales/en/errors.json` and `apps/web/src/shared/i18n/locales/uk/errors.json`. A web test fails without both.
- [ ] To show it next to a form field, add the reason to a reason-to-field map such as `SIGN_UP_REASON_FIELDS` in [confirmation.constants.ts](../../apps/web/src/features/auth/constants/confirmation.constants.ts).
- [ ] Optional: a spec that expects the use case to reject with the new class, like [sign-up.use-case.spec.ts](../../apps/backend/src/modules/identity/use-cases/sign-up.use-case.spec.ts).
- [ ] `mise run check` and `mise exec -- pnpm test` pass.

## In the code

- [platform/errors/](../../apps/backend/src/platform/errors/): the base classes, the filter, the mappers and the reporter.
- [domain.error.ts](../../apps/backend/src/platform/errors/errors/domain.error.ts), [upstream.error.ts](../../apps/backend/src/platform/errors/errors/upstream.error.ts) and [limit-reached.error.ts](../../apps/backend/src/platform/errors/errors/limit-reached.error.ts).
- [domain-error.constants.ts](../../apps/backend/src/platform/errors/constants/domain-error.constants.ts): the kinds and `ERROR_CODE_BY_KIND`. [http-status.constants.ts](../../apps/backend/src/platform/errors/constants/http-status.constants.ts): the statuses.
- [error-description.helpers.ts](../../apps/backend/src/platform/errors/helpers/error-description.helpers.ts): `describeError`, the one mapping that GraphQL and REST share.
- [transport-exception.filter.ts](../../apps/backend/src/platform/errors/filters/transport-exception.filter.ts): the global filter.
- [job-failure.helpers.ts](../../apps/backend/src/platform/errors/helpers/job-failure.helpers.ts): `jobFailureActionFor`.
- Module errors: [modules/identity/errors/](../../apps/backend/src/modules/identity/errors/).
- Specs: [graphql-error.helpers.spec.ts](../../apps/backend/src/platform/errors/helpers/graphql-error.helpers.spec.ts), [problem-details.helpers.spec.ts](../../apps/backend/src/platform/errors/helpers/problem-details.helpers.spec.ts) and [job-failure.helpers.spec.ts](../../apps/backend/src/platform/errors/helpers/job-failure.helpers.spec.ts).

## Pitfalls

- Do not throw a plain `Error` for something a user can cause. The client only gets "Something went wrong".
- Do not put secrets or user data in `message`. The client sees it.
- Do not swallow errors with an empty `catch`. Rethrow, or throw a domain error with `cause`.
- Wrap a failed outside call in `UpstreamError`, not a `DomainError`. Otherwise a job gives up on a failure that a retry would fix.
- A new `ErrorReason` without text in both languages fails a web test.
- Do not rename a reason. The web app and clients match on it.

Next: [008 Jobs](008-jobs.md)
