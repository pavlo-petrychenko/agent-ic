import { Injectable } from '@nestjs/common';
import { getOriginator } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { AfterCommitScheduler } from '@/platform/db/after-commit/after-commit.scheduler';
import type { JobDefinition } from '@/platform/queues/job.definition';
import { ENVELOPE_VERSION } from '@/platform/queues/queue.constants';
import { QueueRegistry } from '@/platform/queues/queue.registry';
import type { JobData, JobEnvelope } from '@/platform/queues/queue.typedefs';

@Injectable()
export class JobsService {
  constructor(
    private readonly queues: QueueRegistry,
    private readonly afterCommit: AfterCommitScheduler,
  ) {}

  async enqueue<TData extends JobData>(
    ctx: UseCaseCtx,
    definition: JobDefinition<TData>,
    data: TData,
  ): Promise<void> {
    const envelope: JobEnvelope = {
      version: ENVELOPE_VERSION,
      data: definition.schema.parse(data),
      workspaceId: ctx.workspaceId,
      traceId: ctx.traceId,
      initiatedBy: getOriginator(ctx),
    };
    await this.afterCommit.schedule(async () => {
      await this.queues.get(definition.queue).add(definition.name, envelope);
    });
  }
}
