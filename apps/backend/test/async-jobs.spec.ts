import { randomUUID } from 'node:crypto';
import { Propagation, TransactionHost } from '@nestjs-cls/transactional';
import type { INestApplication } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { ActorKind, SystemReason } from '@/platform/context/context.constants';
import type { AppTransactionAdapter } from '@/platform/db/database.typedefs';
import { DomainEventsService } from '@/platform/domain-events/domain-events.service';
import { JobsService } from '@/platform/queues/jobs.service';
import { QueueName } from '@/platform/queues/queue.constants';
import { QueueRegistry } from '@/platform/queues/queue.registry';
import type { JobEnvelope } from '@/platform/queues/queue.typedefs';
import {
  PROBE_TRACE_ID,
  PROBE_USER_ID,
  PROBE_WAIT_INTERVAL_MS,
  PROBE_WAIT_TIMEOUT_MS,
  PROBE_WORKSPACE_ID,
  ProbeListener,
} from '@test/support/async-jobs.constants';
import {
  probeSignedUpEvent,
  recordProbeJob,
  rejectProbeJob,
} from '@test/support/async-jobs.definitions';
import { createProbeWorker, userCtx } from '@test/support/async-jobs.helpers';
import { ProbeCallsRecorder } from '@test/support/probe-calls.recorder';

class ProbeRollback extends Error {}

const WAIT = { timeout: PROBE_WAIT_TIMEOUT_MS, interval: PROBE_WAIT_INTERVAL_MS };

const probeIdOf = (envelope: JobEnvelope): unknown => envelope.data['probeId'];

describe('jobs and domain events', () => {
  let app: INestApplication;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let jobs: JobsService;
  let domainEvents: DomainEventsService;
  let recorder: ProbeCallsRecorder;
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
    recorder = app.get(ProbeCallsRecorder);
    queue = app.get(QueueRegistry).get(QueueName.Notify);
  });

  afterAll(async () => {
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
});
