# 0015. Jobs and events after commit; a durable outbox for critical paths

- **Status:** Accepted; amended 2026-10-04: internal events are named **domain events** (`domainEvents.emit`, `@OnDomainEvent`) to avoid a clash with the product's external events (architecture.md D80); amended 2026-10-04: a listener is declared as a `DomainEventSubscription` (event, queue, name) in the listening module's core module, and `@OnDomainEvent(subscription)` marks its handler (architecture.md D112); amended 2026-10-05: listeners are declared by `defineModule({ listeners })`, not by a core module, and subscriptions are made with `defineDomainEventSubscription` (architecture.md D143, D145); amended 2026-10-05: the outbox is built in `platform/queues`: the row is deleted after the job is added with `jobId` set to the row id, rather than marked done, and the sweeper re-sends rows older than a grace period (architecture.md D191)
- **Date:** 2026-10-03

## Context
- A use case changes data in Postgres, then starts work in a worker. Postgres and Redis are two systems, and one step cannot write to both.
- If a job is added before the commit, a worker can start before the data exists.
- If a job is added after the commit, a short gap remains. If Redis is down or the pod dies in that gap, the job is lost.
- For most jobs, a lost job is acceptable. For some paths it breaks the product, for example a customer who never gets a reply.

## Decision
1. **Jobs and events are dispatched after the commit.**
   - Use cases call `jobs.enqueue(ctx, job)` or `domainEvents.emit(ctx, event)`. They never call `queue.add()` directly.
   - Inside a transaction, the platform holds the call until the commit. After a rollback, it drops the call.
2. **Two kinds of message:**
   - **command** (`jobs.enqueue`): "do this job"; exactly one receiver.
   - **domain event** (`domainEvents.emit`): "this happened"; zero or more listeners.
     - A listener is an `@OnDomainEvent(Event, { queue })` class in the listening module's jobs module.
     - The platform creates one job per listener, so each listener retries on its own.
     - A listener is a transport: it calls one use case (ADR 0012).
3. **Durable mode for critical paths:** `{ durable: true }`.
   - The use case also writes an **outbox row** in the same transaction.
   - The after-commit dispatch sends the job and marks the row done.
   - A sweeper checks every few seconds and re-sends rows that are not done.
   - Critical paths in the MVP:
     - incoming message → run;
     - external event or API-channel message → run;
     - escalation → notify operators;
     - source sync and KB re-index.
4. **Delivery is at-least-once.** Every job must be safe to repeat. For example, the flow engine skips finished steps, and sends use idempotency keys.
5. **Live UI updates (Redis pub/sub) are not jobs.** They are published after the commit, and they may be lost.

## Consequences
- Normal jobs start within milliseconds of the commit, and durable jobs do too. The sweeper only acts after a failure.
- Use cases have one API for all side effects. Durability is one flag.
- The outbox table is small (rows are marked done and deleted after a short time). The sweeper uses the `app_system` role (ADR 0013).
- Someone must decide which paths are durable. A new critical path must set the flag.

## Alternatives considered
- **Outbox for every job:** no decision per path, but more writes and rows for jobs where a loss is acceptable.
- **Per-case reconcilers** (cron jobs that look for broken states): work, but each one is custom code.
- **A polling relay only:** adds 100–500 ms to every reply.
- **A `LISTEN/NOTIFY` relay:** fast, but needs a direct connection that bypasses PgBouncer.
- **Commands only, or events only:** commands only means the sender must know every reaction; events only is indirect for work with one obvious handler.
