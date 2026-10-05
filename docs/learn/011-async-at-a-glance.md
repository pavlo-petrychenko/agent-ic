# 011 Async at a glance

[Back to the docs](../README.md)

## What it is

Pages 008 to 010 cover four ways to do something after the request is done or outside its transaction. This page puts them side by side, so you can pick one.

- **Job:** run this work later, in the worker. See [008](008-jobs.md).
- **Durable job:** the same, and it must not be lost. See [008](008-jobs.md).
- **Domain event:** tell other modules what happened. See [009](009-domain-events.md).
- **Live update:** tell open browser tabs to refetch. See [010](010-live-updates.md).

## Why we have it

They look alike: a use case sends a small message and something else reacts. But the promises differ. Choosing the wrong one gives you either lost work (a live update where a job was needed) or extra cost and coupling (a durable job where a plain one would do).

## How they compare

|                                      | Job                                     | Durable job                                   | Domain event                                              | Live update                                                                                                                     |
| ------------------------------------ | --------------------------------------- | --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Who sends it                         | a use case, `JobsService.enqueue`       | a use case, `enqueue(..., { durable: true })` | a use case, `DomainEventsService.emit`                    | a use case, `LiveUpdatesService.publish`                                                                                        |
| Who runs it                          | the worker, one processor, one use case | the same                                      | the worker, one listener per subscriber, each its own job | nobody runs it. Open tabs receive it through a subscription                                                                     |
| Where it waits                       | a BullMQ queue in Redis                 | an outbox row in Postgres, then the queue     | the queue, one job per listener                           | nowhere. Redis pub/sub keeps nothing                                                                                            |
| Waits for the commit                 | yes                                     | yes                                           | yes                                                       | yes                                                                                                                             |
| Dropped on rollback                  | yes                                     | yes (the row rolls back too)                  | yes                                                       | yes                                                                                                                             |
| Retries                              | 5 attempts, backoff from 2 s            | the same, and a sweeper re-sends a lost add   | per listener, like a job                                  | none                                                                                                                            |
| Survives a crash after the commit    | no                                      | yes, at-least-once                            | no, unless `durable: true`                                | no                                                                                                                              |
| Runs more than once                  | possible, on a retry                    | possible, so be safe to repeat                | possible, per listener                                    | not applicable                                                                                                                  |
| Payload                              | IDs, flat values                        | IDs, flat values                              | IDs, flat values                                          | IDs, flat values                                                                                                                |
| Where to look when it did not happen | queue board, worker logs                | the same, and old rows in `outbox.messages`   | the same, one job per listener                            | nothing is stored. Inside a transaction, a failed publish is reported with the trace id; outside one, the caller gets the error |

All four wait for the commit on purpose. They all go through the after-commit buffer (page 006), so none of them can announce something that was rolled back.

## Which one do I need?

1. Do you only want open tabs to show fresh data? Use a **live update**, and let the tab refetch. Nothing else is needed.
2. Does another module need to react, or might one later? The sender should not know who reacts. Use a **domain event**.
3. Otherwise, you know the one receiver and the work is slow or external. Use a **job**.
4. Would losing it break the product? A message that must start a run is one. Add `{ durable: true }` to the job or the event, and make the work safe to repeat.
5. Does it need to run on a timer? Use a **job** with `@ScheduleJob`.
6. Do you need the result now, inside the request? None of these. Call a service in the same transaction.

A durable job and a live update often go together. After a message is saved, a durable job starts the run, and a live update tells the operator's Inbox to refetch (hypothetical: neither exists yet).

## In the code

- [jobs.service.ts](../../apps/backend/src/platform/queues/services/jobs.service.ts): `enqueue`, normal and durable.
- [domain-events.service.ts](../../apps/backend/src/platform/domain-events/services/domain-events.service.ts): `emit`, built on `enqueue`.
- [live-updates.service.ts](../../apps/backend/src/platform/live-updates/services/live-updates.service.ts): `publish` and `subscribe`.
- [after-commit.service.ts](../../apps/backend/src/platform/database/services/after-commit.service.ts): the buffer all three share.
- Real use today: an event emitted in [sign-up.use-case.ts](../../apps/backend/src/modules/identity/use-cases/sign-up.use-case.ts) and a scheduled job in [clean-up-auth-records.processor.ts](../../apps/backend/src/modules/identity/processors/clean-up-auth-records.processor.ts). No code uses `durable` or a live update yet.

## Pitfalls

- A job is not an event. If the sender names the receiver, it is a job. If the sender does not care who listens, it is an event.
- `durable` is not "important". It costs a database write for each job. Use it only where losing the job would break the product.
- To see a stuck durable job, read the outbox as `app_system` with `mise run db:psql app_system`. Rows older than about 30 seconds mean the add keeps failing, or no worker serves `timers`.
- A live update is not a place to keep data. If the tab misses it, nothing replays it.

Next: back to [the docs](../README.md). More pages are coming.
