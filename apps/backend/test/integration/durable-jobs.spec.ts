import { randomUUID } from 'node:crypto';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { INestApplication } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { APP_DATABASE } from '@/platform/database/constants/database-token.constants';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { OUTBOX_GRACE_PERIOD_SECONDS } from '@/platform/queues/constants/outbox.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { outboxMessages } from '@/platform/queues/db/outbox-message.table';
import { OutboxRepository } from '@/platform/queues/repositories/outbox.repository';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { OutboxSweeperService } from '@/platform/queues/services/outbox-sweeper.service';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';
import type { OutboxMessage } from '@/platform/queues/typedefs/outbox.typedefs';
import {
  PROBE_WAIT_INTERVAL_MS,
  PROBE_WAIT_TIMEOUT_MS,
  ProbeJobName,
  ProbeListener,
} from '@test/support/constants/async-jobs.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { createProbeWorker, userCtx } from '@test/support/helpers/async-jobs.helpers';
import { probeSignedUpEvent } from '@test/support/jobs/probe-signed-up.job';
import { recordProbeJob } from '@test/support/jobs/record-probe.job';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';

class ProbeRollback extends Error {}

class ProbeOutage extends Error {}

const WAIT = { timeout: PROBE_WAIT_TIMEOUT_MS, interval: PROBE_WAIT_INTERVAL_MS };
const DURABLE = { durable: true };
const PERMISSION_DENIED = { cause: { code: '42501' } };
const COMPLETED_STATE = 'completed';
const PAST_GRACE_MS = (OUTBOX_GRACE_PERIOD_SECONDS + 1) * MILLISECONDS_PER_SECOND;

const probeIdOf = (envelope: JobEnvelope): unknown => envelope.data['probeId'];

describe('durable jobs', () => {
  let app: INestApplication;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let jobs: JobsService;
  let domainEvents: DomainEventsService;
  let sweeper: OutboxSweeperService;
  let outbox: OutboxRepository;
  let clock: ClockService;
  let systemDb: SystemDatabaseService;
  let appDb: AppDatabase;
  let recorder: ProbeCallsRecorderService;
  let queue: Queue<JobEnvelope>;

  const workspaceCtx = (): UseCaseCtx => ({ ...userCtx(), workspaceId: randomUUID() });

  const rowsFor = async (probeId: string): Promise<OutboxMessage[]> => {
    const rows = await systemDb.db.select().from(outboxMessages);
    return rows.filter((row) => probeIdOf(row.envelope) === probeId);
  };

  const onlyRowFor = async (probeId: string): Promise<OutboxMessage> => {
    const [row] = await rowsFor(probeId);
    if (row === undefined) {
      throw new MissingTestDataError(probeId);
    }
    return row;
  };

  const callsFor = (probeId: string): number =>
    recorder.calls.filter((call) => call.probeId === probeId).length;

  const waitUntilHandled = (probeId: string): Promise<void> =>
    vi.waitFor(() => expect(recorder.probeIds()).toContain(probeId), WAIT);

  const sweepAfterGrace = (): Promise<number> => {
    const later = new Date(clock.now().getTime() + PAST_GRACE_MS);
    vi.spyOn(clock, 'now').mockReturnValue(later);
    return sweeper.sweep();
  };

  beforeAll(async () => {
    app = await createProbeWorker(TestRedisPrefix.DurableJobs);
    txHost = app.get(TransactionHost);
    jobs = app.get(JobsService);
    domainEvents = app.get(DomainEventsService);
    sweeper = app.get(OutboxSweeperService);
    outbox = app.get(OutboxRepository);
    clock = app.get(ClockService);
    systemDb = app.get(SystemDatabaseService);
    appDb = app.get<AppDatabase>(APP_DATABASE);
    recorder = app.get(ProbeCallsRecorderService);
    queue = app.get(QueuesService).get(QueueName.Notify);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await queue.obliterate({ force: true });
    await app.close();
  });

  it('runs a committed durable job once and removes its outbox row', async () => {
    const probeId = randomUUID();

    await txHost.withTransaction(() =>
      jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId }, DURABLE),
    );
    await waitUntilHandled(probeId);

    expect(await rowsFor(probeId)).toEqual([]);
    expect(callsFor(probeId)).toBe(1);
  });

  it('leaves no row and no job after a rollback', async () => {
    const rolledBack = randomUUID();
    const committed = randomUUID();

    await expect(
      txHost.withTransaction(async () => {
        await jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId: rolledBack }, DURABLE);
        throw new ProbeRollback();
      }),
    ).rejects.toThrow(ProbeRollback);
    await txHost.withTransaction(() =>
      jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId: committed }, DURABLE),
    );
    await waitUntilHandled(committed);

    expect(await rowsFor(rolledBack)).toEqual([]);
    expect(recorder.probeIds()).not.toContain(rolledBack);
  });

  it('keeps the row when the queue add fails and the sweeper sends it later', async () => {
    const probeId = randomUUID();
    vi.spyOn(queue, 'add').mockRejectedValueOnce(new ProbeOutage());

    await txHost.withTransaction(() =>
      jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId }, DURABLE),
    );

    expect(await rowsFor(probeId)).toHaveLength(1);
    expect(await sweeper.sweep()).toBe(0);
    expect(await sweepAfterGrace()).toBe(1);
    await waitUntilHandled(probeId);
    expect(await rowsFor(probeId)).toEqual([]);
    expect(callsFor(probeId)).toBe(1);
  });

  it('re-sends with the same job id when the row was not deleted, and runs the job once', async () => {
    const probeId = randomUUID();
    vi.spyOn(outbox, 'delete').mockRejectedValueOnce(new ProbeOutage());

    await txHost.withTransaction(() =>
      jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId }, DURABLE),
    );
    await waitUntilHandled(probeId);
    const row = await onlyRowFor(probeId);
    await vi.waitFor(async () => {
      expect(await queue.getJobState(row.id)).toBe(COMPLETED_STATE);
    }, WAIT);

    expect(await sweepAfterGrace()).toBe(1);
    expect(await rowsFor(probeId)).toEqual([]);
    expect(await queue.getJobState(row.id)).toBe(COMPLETED_STATE);
    expect(callsFor(probeId)).toBe(1);
  });

  it('runs a durable job once when the same job id is enqueued twice', async () => {
    const probeId = randomUUID();
    const options = { ...DURABLE, jobId: randomUUID() };

    await txHost.withTransaction(async () => {
      await jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId }, options);
      await jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId }, options);
    });
    await waitUntilHandled(probeId);
    await txHost.withTransaction(() =>
      jobs.enqueue(workspaceCtx(), recordProbeJob, { probeId }, options),
    );

    expect(await queue.getJobState(options.jobId)).toBe(COMPLETED_STATE);
    expect(await rowsFor(probeId)).toEqual([]);
    expect(callsFor(probeId)).toBe(1);
  });

  it('writes one outbox row per listener for a durable domain event', async () => {
    const probeId = randomUUID();
    vi.spyOn(queue, 'add').mockRejectedValue(new ProbeOutage());

    await txHost.withTransaction(() =>
      domainEvents.emit(workspaceCtx(), probeSignedUpEvent, { probeId }, DURABLE),
    );
    const rows = await rowsFor(probeId);
    vi.restoreAllMocks();

    expect(rows.map((row) => row.name).toSorted()).toEqual(
      [ProbeJobName.Audit, ProbeJobName.Welcome].toSorted(),
    );
    expect(await sweepAfterGrace()).toBe(2);
    await vi.waitFor(() => {
      const listeners = recorder.calls
        .filter((call) => call.probeId === probeId)
        .map((call) => call.listener);
      expect(listeners.toSorted()).toEqual([ProbeListener.Audit, ProbeListener.Welcome]);
    }, WAIT);
  });

  it('lets the app role insert outbox rows but never read or delete them', async () => {
    await expect(appDb.select().from(outboxMessages)).rejects.toMatchObject(PERMISSION_DENIED);
    await expect(appDb.delete(outboxMessages)).rejects.toMatchObject(PERMISSION_DENIED);
  });
});
