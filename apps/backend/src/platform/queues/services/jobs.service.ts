import { Injectable } from '@nestjs/common';
import { getOriginator } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import { ENVELOPE_VERSION } from '@/platform/queues/constants/job.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { JobData, JobDefinition, JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class JobsService {
  constructor(
    private readonly queues: QueuesService,
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
      initiatedBy: getOriginator(ctx),
    };
    await this.afterCommit.schedule(async () => {
      await this.queues.get(definition.queue).add(definition.name, envelope);
    });
  }
}
