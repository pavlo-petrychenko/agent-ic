import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import type { JobDefinition } from '@/platform/queues/job.definition';
import { ENVELOPE_VERSION } from '@/platform/queues/queue.constants';
import { QueueRegistry } from '@/platform/queues/queue.registry';
import type { JobData, JobEnvelope } from '@/platform/queues/queue.typedefs';

@Injectable()
export class JobsService {
  constructor(
    private readonly queues: QueueRegistry,
    private readonly afterCommit: AfterCommitService,
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
      initiatedBy: ctx.originator(),
    };
    await this.afterCommit.schedule(async () => {
      await this.queues.get(definition.queue).add(definition.name, envelope);
    });
  }
}
