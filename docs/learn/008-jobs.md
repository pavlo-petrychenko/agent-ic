# 008 Jobs

[Back to the docs](../README.md)

## What it is

A job is work that runs later, in the worker, outside the request. A use case says "do this" and moves on. The worker takes the job from a queue in Redis (BullMQ), runs it, and retries it if it fails.

A job is made with `defineJob({ queue, name, schema })`. A processor class handles it and calls one use case.

## Why we have it

- Slow or external work (an email, an AI provider) must not hold a request or a database transaction open.
- A job leaves only after the commit. If the data rolls back, the job is never sent.
- A failed job retries by itself: 5 attempts, with exponential backoff from 2 seconds.
- A schedule can run a job every N seconds. The cleanup of old auth records does this.

## How it works

```
use case --enqueue--> after-commit buffer --(commit)--> Redis queue --> worker
                      (dropped on rollback)                              |
                                         JobExecutionService: check envelope, build system ctx
                                                                         |
                                                  @ProcessJob processor --> one use case
```

1. A use case calls `JobsService.enqueue`. It checks the data against the job's zod schema and wraps it in an envelope: version, data, workspace id, trace id and who started it.
2. Inside a transaction, the add waits in the after-commit buffer (page 006). It runs on commit and is dropped on rollback. Outside a transaction it runs at once.
3. The envelope goes to a BullMQ queue in Redis.
4. A worker that serves that queue takes it. `JobExecutionService` checks the envelope and the payload, then builds a system ctx with the same workspace id, trace id and original initiator.
5. The processor marked `@ProcessJob(job)` runs `handle(ctx, data)`. It calls one use case.

**Retries.** A failure is reported with the trace id, then `jobFailureActionFor` decides. A `DomainError` gives up at once. An `UpstreamError` retries only when `retryable` is true. A rate limit retries and a plan limit gives up. Anything else retries. Giving up means BullMQ's `UnrecoverableError`. Completed jobs are kept 1 day and failed jobs 7 days.

**Queues.** `QueueName` has six. Today `notify` carries the two email jobs and `timers` carries the auth cleanup and the outbox sweeper. `runs-reactive`, `runs-proactive`, `outbound` and `ingest` exist, but no job uses them yet. A worker serves only the queues in its `--queues` list. Locally one worker serves all six. The Helm chart has `worker-runs` (all but `ingest`) and `worker-ingest`.

## Durable jobs

The add after the commit can fail: the process dies right after the commit, or Redis is down at that moment. The data is committed, but the job is lost. For work that must not be lost, pass `{ durable: true }`:

```
this.jobs.enqueue(ctx, job, data, { durable: true })
this.domainEvents.emit(ctx, event, data, { durable: true })
```

```
use case tx --insert row--> outbox.messages
     | commit
     v
after commit --add(jobId = row id)--> Redis queue --> worker
     +--delete row
sweeper, every 5 s --rows older than 30 s--> add(same jobId) --> delete row
```

1. Inside the use case's transaction, a row goes into `outbox.messages`: a new id, the queue, the job name and the whole envelope. It commits or rolls back with the data.
2. After the commit, the job is added with `jobId` set to the row id. Then the row is deleted.
3. Inside a transaction, if the add or the delete fails, the error is reported and not thrown, because the data is already committed. The row stays.
4. A sweeper job on `timers` runs every 5 seconds in the worker. In one transaction it takes up to 100 rows older than 30 seconds, adds each with the same `jobId`, and deletes them. `FOR UPDATE SKIP LOCKED` keeps two workers off the same row. If one add fails, the transaction rolls back and the sweep job retries.

What you get:

- **At-least-once delivery.** BullMQ ignores an add for a `jobId` it still holds (completed 1 day, failed 7), so a re-send usually does not run twice. That is not a guarantee. **Every durable job must be safe to repeat.**
- **Outside a transaction** the row is written on the plain pool and the add runs at once. An error then reaches the caller, as with a normal enqueue.
- **Who can do what.** The `app` role may only insert rows. `SELECT`, `UPDATE` and `DELETE` are revoked. The delete and the sweep go through `SystemDatabaseService`, and `platform/queues` is on its allow-list.
- **Normal jobs do not change.** No code uses the flag yet.

## Example use (hypothetical)

Not built: there is no Telegram gateway and no runs module yet. The names are invented.

```
Telegram message -> gateway controller -> one use case, one transaction:
    1. save the customer message
    2. jobs.enqueue(ctx, startRunJob, { messageId }, { durable: true })
after the commit: runs-reactive queue -> worker -> StartRunProcessor -> start-run use case
```

The gateway has already answered Telegram, so a lost job means a customer who never gets a reply and nobody who knows. That is why the job is durable. The start-run use case first looks for a run with this `messageId` and does nothing if it exists. That makes a second delivery harmless.

## Add one

- [ ] Job name in an enum in `constants/<m>-job.constants.ts`, for example `IdentityJobName.CleanUpAuthRecords = 'identity.clean-up-auth-records'`.
- [ ] File `jobs/<topic>.job.ts` with `defineJob({ queue, name, schema })`. Pick the queue from `QueueName` in [queue.constants.ts](../../apps/backend/src/platform/queues/constants/queue.constants.ts). The zod schema holds IDs only, never whole records.
- [ ] Enqueue from a use case: inject `JobsService` and call `this.jobs.enqueue(ctx, job, data)`. Inside a transaction, the job waits for the commit and is dropped on rollback. Never call `queue.add()`.
- [ ] Work that must not be lost: add `{ durable: true }`, and make the job safe to repeat.
- [ ] A processor in `processors/<topic>.processor.ts`: an `@Injectable()` class with `@ProcessJob(job)` and `handle(ctx, data)`, which calls one use case. Example: [clean-up-auth-records.processor.ts](../../apps/backend/src/modules/identity/processors/clean-up-auth-records.processor.ts).
- [ ] The use case it calls runs as the system actor of the job's workspace. Check that with `requireSystemActor(ctx)`.
- [ ] A recurring job adds `@ScheduleJob(defineJobSchedule({ job, everySeconds, data }))` to the processor.
- [ ] Register the processor under `processors` in the module's `defineModule`, and its use case under `providers`.
- [ ] Reacting to another module's event? Use a listener instead (page 009).
- [ ] Watch it run: open the queue board at `https://queues.local.agent-ic.pavlop.dev` and read `mise run logs worker`.
- [ ] `mise run check` and `mise exec -- pnpm test` pass.

## In the code

- [platform/queues/](../../apps/backend/src/platform/queues/): everything about jobs.
- [jobs.service.ts](../../apps/backend/src/platform/queues/services/jobs.service.ts): `enqueue`, normal and durable.
- [job-execution.service.ts](../../apps/backend/src/platform/queues/services/job-execution.service.ts): the envelope check, the system ctx, the failure rules.
- [job-workers.service.ts](../../apps/backend/src/platform/queues/services/job-workers.service.ts) and [job-schedules.service.ts](../../apps/backend/src/platform/queues/services/job-schedules.service.ts): one BullMQ worker per queue, and the `@ScheduleJob` registration.
- [queue.helpers.ts](../../apps/backend/src/platform/queues/helpers/queue.helpers.ts): the retry options.
- The outbox: [outbox-message.table.ts](../../apps/backend/src/platform/queues/db/outbox-message.table.ts), [outbox.repository.ts](../../apps/backend/src/platform/queues/repositories/outbox.repository.ts), [outbox-sweeper.service.ts](../../apps/backend/src/platform/queues/services/outbox-sweeper.service.ts) and [sweep-outbox.processor.ts](../../apps/backend/src/platform/queues/processors/sweep-outbox.processor.ts).
- A real job: [clean-up-auth-records.job.ts](../../apps/backend/src/modules/identity/jobs/clean-up-auth-records.job.ts), a scheduled job on `timers`.
- Specs: [async-jobs.spec.ts](../../apps/backend/test/integration/async-jobs.spec.ts) shows commit, rollback, give-up and schedules. [durable-jobs.spec.ts](../../apps/backend/test/integration/durable-jobs.spec.ts) shows the outbox, a failed add and a re-send.

## Pitfalls

- The payload holds IDs and flat values only: strings, numbers, booleans, null and string lists. Load the record inside the use case.
- Never call `queue.add()` in a use case. The commit may still fail. Use `JobsService`.
- Every job can run twice, because of retries. Write it so a second run does nothing new.
- A job on a queue that no worker serves waits forever. The outbox sweeper needs a worker that serves `timers`.
- List a processor under `processors`, so that only workers load it. Two handlers for the same queue and job name stop the app at startup.
- An unknown job or a bad payload fails with no retry.
- `durable` costs an insert and a delete for each job. Use it only where losing the job would break the product.

Next: [009 Domain events](009-domain-events.md)
