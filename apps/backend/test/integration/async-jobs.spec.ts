import { randomUUID } from 'node:crypto';
import { Propagation, TransactionHost } from '@nestjs-cls/transactional';
import type { INestApplication } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ActorKind, SystemReason } from '@/platform/context/constants/actor.constants';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { jobKey } from '@/platform/queues/helpers/job.helpers';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';
import {
  PROBE_TRACE_ID,
  PROBE_USER_ID,
  PROBE_WAIT_INTERVAL_MS,
  PROBE_WAIT_TIMEOUT_MS,
  PROBE_WORKSPACE_ID,
  ProbeListener,
  SCHEDULED_PROBE_EVERY_SECONDS,
  SCHEDULED_PROBE_ID,
} from '@test/support/constants/async-jobs.constants';
import { createProbeWorker, userCtx } from '@test/support/helpers/async-jobs.helpers';
import { probeSignedUpEvent } from '@test/support/jobs/probe-signed-up.job';
import { recordProbeJob } from '@test/support/jobs/record-probe.job';
import { rejectProbeJob } from '@test/support/jobs/reject-probe.job';
import { scheduledProbeJob } from '@test/support/jobs/scheduled-probe.job';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';

class ProbeRollback extends Error {}

const WAIT = { timeout: PROBE_WAIT_TIMEOUT_MS, interval: PROBE_WAIT_INTERVAL_MS };

const probeIdOf = (envelope: JobEnvelope): unknown => envelope.data['probeId'];

describe('jobs and domain events', () => {
  let app: INestApplication;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let jobs: JobsService;
  let domainEvents: DomainEventsService;
  let recorder: ProbeCallsRecorderService;
  let queue: Queue<JobEnvelope>;

  const queuedProbeIds = async (): Promise<unknown[]> => {
    const queued = await queue.getJobs();
    return queued.map((job) => probeIdOf(job.data));
  };

  const waitUntilHandled = (probeId: string): Promise<void> =>
    vi.waitFor(() => expect(recorder.probeIds()).toContain(probeId), WAIT);

  const rollBack = (work: () => Promise<void>): Promise<void> =>
    txHost.withTransaction(async () => {
      await work();
      throw new ProbeRollback();
    });

  beforeAll(async () => {
    app = await createProbeWorker();
    txHost = app.get(TransactionHost);
    jobs = app.get(JobsService);
    domainEvents = app.get(DomainEventsService);
    recorder = app.get(ProbeCallsRecorderService);
    queue = app.get(QueuesService).get(QueueName.Notify);
  });

  afterAll(async () => {
    await app.get(QueuesService).get(QueueName.Timers).obliterate({ force: true });
    await queue.obliterate({ force: true });
    await app.close();
  });

  it('runs a committed job in the worker as the system actor', async () => {
    const probeId = randomUUID();

    await txHost.withTransaction(() => jobs.enqueue(userCtx(), recordProbeJob, { probeId }));
    await waitUntilHandled(probeId);

    const call = recorder.calls.find((recorded) => recorded.probeId === probeId);
    expect(call?.ctx.actor).toEqual({ kind: ActorKind.System, reason: SystemReason.Job });
    expect(call?.ctx.initiatedBy).toEqual({ kind: ActorKind.User, userId: PROBE_USER_ID });
    expect(call?.ctx.workspaceId).toBe(PROBE_WORKSPACE_ID);
    expect(call?.ctx.traceId).toBe(PROBE_TRACE_ID);
  });

  it('holds a job until the transaction commits', async () => {
    const probeId = randomUUID();
    let queuedBeforeCommit: unknown[] = [];

    await txHost.withTransaction(async () => {
      await jobs.enqueue(userCtx(), recordProbeJob, { probeId });
      queuedBeforeCommit = await queuedProbeIds();
    });

    expect(queuedBeforeCommit).not.toContain(probeId);
    await waitUntilHandled(probeId);
  });

  it('never runs a job enqueued in a rolled-back transaction', async () => {
    const rolledBack = randomUUID();
    const committed = randomUUID();

    await expect(
      rollBack(() => jobs.enqueue(userCtx(), recordProbeJob, { probeId: rolledBack })),
    ).rejects.toThrow(ProbeRollback);
    await txHost.withTransaction(() =>
      jobs.enqueue(userCtx(), recordProbeJob, { probeId: committed }),
    );
    await waitUntilHandled(committed);

    expect(recorder.probeIds()).not.toContain(rolledBack);
    expect(await queuedProbeIds()).not.toContain(rolledBack);
  });

  it('drops the jobs of a rolled-back savepoint and keeps the outer ones', async () => {
    const outer = randomUUID();
    const inner = randomUUID();

    await txHost.withTransaction(async () => {
      await jobs.enqueue(userCtx(), recordProbeJob, { probeId: outer });
      await expect(
        txHost.withTransaction(Propagation.Nested, async () => {
          await jobs.enqueue(userCtx(), recordProbeJob, { probeId: inner });
          throw new ProbeRollback();
        }),
      ).rejects.toThrow(ProbeRollback);
    });
    await waitUntilHandled(outer);

    expect(recorder.probeIds()).not.toContain(inner);
    expect(await queuedProbeIds()).not.toContain(inner);
  });

  it('enqueues right away outside a transaction', async () => {
    const probeId = randomUUID();

    await jobs.enqueue(userCtx(), recordProbeJob, { probeId });

    await waitUntilHandled(probeId);
    expect(recorder.probeIds()).toContain(probeId);
  });

  it('runs one job per domain event listener after the commit', async () => {
    const probeId = randomUUID();

    await txHost.withTransaction(() =>
      domainEvents.emit(userCtx(), probeSignedUpEvent, { probeId }),
    );

    await vi.waitFor(() => {
      const listeners = recorder.calls
        .filter((call) => call.probeId === probeId)
        .map((call) => call.listener);
      expect(listeners.toSorted()).toEqual([ProbeListener.Audit, ProbeListener.Welcome]);
    }, WAIT);
  });

  it('drops domain events emitted in a rolled-back transaction', async () => {
    const rolledBack = randomUUID();
    const committed = randomUUID();

    await expect(
      rollBack(() => domainEvents.emit(userCtx(), probeSignedUpEvent, { probeId: rolledBack })),
    ).rejects.toThrow(ProbeRollback);
    await jobs.enqueue(userCtx(), recordProbeJob, { probeId: committed });
    await waitUntilHandled(committed);

    expect(recorder.probeIds()).not.toContain(rolledBack);
  });

  it('gives up on a domain error without retrying', async () => {
    const probeId = randomUUID();

    await jobs.enqueue(userCtx(), rejectProbeJob, { probeId });

    await vi.waitFor(async () => {
      const failed = await queue.getFailed();
      const job = failed.find((candidate) => probeIdOf(candidate.data) === probeId);
      expect(job?.attemptsMade).toBe(1);
    }, WAIT);
  });

  it('rejects a payload that does not match the job schema', async () => {
    await expect(jobs.enqueue(userCtx(), recordProbeJob, { probeId: '' })).rejects.toThrow(
      ZodError,
    );
  });

  it('runs a scheduled job of a queue it serves as the system actor of no workspace', async () => {
    await vi.waitFor(() => expect(recorder.probeIds()).toContain(SCHEDULED_PROBE_ID), WAIT);

    const call = recorder.calls.find((recorded) => recorded.listener === ProbeListener.Scheduled);
    const schedulers = await queue.getJobSchedulers();
    expect(call?.ctx.actor).toEqual({ kind: ActorKind.System, reason: SystemReason.Job });
    expect(call?.ctx.initiatedBy).toEqual({
      kind: ActorKind.System,
      reason: SystemReason.Schedule,
    });
    expect(call?.ctx.workspaceId).toBeNull();
    expect(schedulers).toEqual([
      expect.objectContaining({
        key: jobKey(scheduledProbeJob.queue, scheduledProbeJob.name),
        every: SCHEDULED_PROBE_EVERY_SECONDS * MILLISECONDS_PER_SECOND,
      }),
    ]);
  });

  it('leaves the schedules of queues it does not serve to other workers', async () => {
    const timers = app.get(QueuesService).get(QueueName.Timers);

    expect(await timers.getJobSchedulers()).toEqual([]);
  });
});
