import { describe, expect, it, vi } from 'vitest';
import type { AfterCommitService } from '@/platform/database/services/after-commit.service';
import type { IdService } from '@/platform/ids/services/id.service';
import { sweepOutboxJob } from '@/platform/queues/jobs/sweep-outbox.job';
import type { OutboxRepository } from '@/platform/queues/repositories/outbox.repository';
import { JobsService } from '@/platform/queues/services/jobs.service';
import type { QueuesService } from '@/platform/queues/services/queues.service';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';

const JOB_ID = '11111111-1111-7111-8111-111111111111';

type AddFn = (
  name: string,
  data: unknown,
  options: { readonly jobId?: string; readonly delay?: number },
) => Promise<void>;

type InsertFn = (message: unknown) => Promise<void>;

const createService = (add: AddFn, insert: InsertFn) =>
  new JobsService(
    { get: () => ({ add }) } as unknown as QueuesService,
    { schedule: (work: () => Promise<void>) => work() } as unknown as AfterCommitService,
    {
      insert,
      delete: vi.fn<() => Promise<void>>(),
    } as unknown as OutboxRepository,
    { generate: () => JOB_ID } as unknown as IdService,
  );

describe('JobsService', () => {
  it('passes a delay to BullMQ', async () => {
    const add = vi.fn<AddFn>().mockResolvedValue(undefined);
    const service = createService(add, vi.fn<InsertFn>());

    await service.enqueue(
      workspaceSystemCtx('workspace-1'),
      sweepOutboxJob,
      {},
      {
        jobId: JOB_ID,
        delayMs: 60_000,
      },
    );

    expect(add).toHaveBeenCalledWith(sweepOutboxJob.name, expect.any(Object), {
      jobId: JOB_ID,
      delay: 60_000,
    });
  });

  it('stores the delay in the outbox envelope for a durable job', async () => {
    const add = vi.fn<AddFn>().mockResolvedValue(undefined);
    const insert = vi.fn<InsertFn>().mockResolvedValue(undefined);
    const service = createService(add, insert);

    await service.enqueue(
      workspaceSystemCtx('workspace-1'),
      sweepOutboxJob,
      {},
      {
        durable: true,
        jobId: JOB_ID,
        delayMs: 60_000,
      },
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: JOB_ID,
        envelope: expect.objectContaining({ delayMs: 60_000 }),
      }),
    );
    expect(add).toHaveBeenCalledWith(sweepOutboxJob.name, expect.any(Object), {
      jobId: JOB_ID,
      delay: 60_000,
    });
  });
});
