# 009 Domain events

[Back to the docs](../README.md)

## What it is

A domain event is a fact that one module announces: "an email confirmation was requested". Other modules react to it. The sender does not know who listens.

An event is made with `defineDomainEvent({ name, schema })`. A listener is a class in another module, marked `@OnDomainEvent(subscription)`. It calls one use case.

An event is a layer on top of jobs (page 008). Each listener runs as its own job.

## Why we have it

A job is a command: the sender knows the one receiver. That couples modules. Sign-up should not import the email code, and it should not change when we add a second reaction.

With an event, `identity` says what happened and `notifications` decides what to do. A new reaction is a new listener. The sender stays as it is. Every listener also gets its own job, so one failing listener does not block the others or the sender.

## How it works

```
sign-up use case --emit(event)--> DomainEventsService
                                      | one job for each subscription (JobsService)
                                      v
                    after-commit buffer --(commit)--> Redis queue
                                                          |
                                                          v
                                     worker --> listener --> one use case
```

1. A use case calls `DomainEventsService.emit(ctx, event, data)`. It checks the data against the event's schema.
2. `emit` asks `DomainEventListenersService` for the subscriptions of this event. For each one it calls `JobsService.enqueue`. So every rule of page 008 applies: the jobs wait for the commit, are dropped on rollback, and retry on failure.
3. Each listener runs in the worker, as the system actor of the same workspace. It calls one use case.

A subscription is a job definition plus the event it listens to, made with `defineDomainEventSubscription({ event, queue, name })`. Listing the listener under `listeners` in `defineModule` registers the subscription in every role, so `api` and `gateway` know where to send. The listener itself is created only in the worker.

An event with no listener does nothing and is not an error.

**Durable events.** `emit(ctx, event, data, { durable: true })` passes the option to every job. That writes one outbox row per listener, in the same transaction. Page 008 explains what that gives you.

## The sign-up example

1. [sign-up.use-case.ts](../../apps/backend/src/modules/identity/use-cases/sign-up.use-case.ts) saves the user and emits `emailConfirmationRequestedEvent` with `{ userId }`.
2. [send-confirmation-email.job.ts](../../apps/backend/src/modules/notifications/jobs/send-confirmation-email.job.ts) subscribes `notifications` to it, on the `notify` queue.
3. [send-confirmation-email.listener.ts](../../apps/backend/src/modules/notifications/listeners/send-confirmation-email.listener.ts) handles it.
4. The listener calls `SendConfirmationEmailUseCase`, which issues a confirmation token for that user id and sends the email.

## Add one

A new event, and a listener in another module.

- [ ] Event name in an enum in `constants/<m>-event.constants.ts`, for example `IdentityEventName.EmailConfirmationRequested = 'identity.email-confirmation-requested'`.
- [ ] File `events/<topic>.event.ts` with `defineDomainEvent({ name, schema })`. The zod schema holds IDs only.
- [ ] Export the event from the module's `index.ts`. Listeners import it from there.
- [ ] Emit it from the use case, inside its transaction: inject `DomainEventsService` and call `await this.domainEvents.emit(ctx, event, data)`. Add `{ durable: true }` only for work that must not be lost.
- [ ] In the listening module, the subscription in `jobs/<topic>.job.ts`: `defineDomainEventSubscription({ event, queue, name })`. The job name goes in an enum in `constants/<m>-job.constants.ts`.
- [ ] The listener in `listeners/<topic>.listener.ts`: an `@Injectable()` class with `@OnDomainEvent(subscription)` and `handle(ctx, data)`, which calls one use case. Example: [send-confirmation-email.listener.ts](../../apps/backend/src/modules/notifications/listeners/send-confirmation-email.listener.ts).
- [ ] The use case it calls checks `requireSystemActor(ctx)`.
- [ ] Register the listener under `listeners` in the module's `defineModule`, and its use case under `providers`.
- [ ] Optional: a spec like the ones in [async-jobs.spec.ts](../../apps/backend/test/integration/async-jobs.spec.ts).
- [ ] `mise run check` and `mise exec -- pnpm test` pass.

## In the code

- [platform/domain-events/](../../apps/backend/src/platform/domain-events/): `DomainEventsService`, `DomainEventListenersService`, the `@OnDomainEvent` decorator and the `define...` helpers.
- [domain-events.service.ts](../../apps/backend/src/platform/domain-events/services/domain-events.service.ts): `emit`, a loop over the subscriptions that calls `JobsService.enqueue`.
- [domain-event.helpers.ts](../../apps/backend/src/platform/domain-events/helpers/domain-event.helpers.ts): `defineDomainEvent` and `defineDomainEventSubscription`.
- An event: [email-confirmation-requested.event.ts](../../apps/backend/src/modules/identity/events/email-confirmation-requested.event.ts).
- A module with listeners: [notifications.module.ts](../../apps/backend/src/modules/notifications/notifications.module.ts).
- Specs: [async-jobs.spec.ts](../../apps/backend/test/integration/async-jobs.spec.ts) shows one job per listener and the drop on rollback. [durable-jobs.spec.ts](../../apps/backend/test/integration/durable-jobs.spec.ts) shows one outbox row per listener. The probe listeners [audit-probe-listener.processor.ts](../../apps/backend/test/support/processors/audit-probe-listener.processor.ts) and [welcome-probe-listener.processor.ts](../../apps/backend/test/support/processors/welcome-probe-listener.processor.ts) listen to one event.

## Pitfalls

- A listener runs after the commit, in another process. The sender cannot wait for it or read its result. If you need an answer, call a service. An event is for "tell others".
- The event schema is the payload of every listener. Keep it to IDs, and let each listener load what it needs.
- Register a listener under `listeners`, not `providers`. Only `listeners` registers the subscription, so with `providers` the event finds nobody.
- A listener class without `@OnDomainEvent` stops the app at startup.
- Listeners run at least once and can run twice, like any job. Make them safe to repeat.
- A module that imports another module's event does it through that module's `index.ts`, never a deep path.

Next: [010 Live updates](010-live-updates.md)
