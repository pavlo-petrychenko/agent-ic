import { Injectable } from '@nestjs/common';

import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { AfterCommitScheduler } from '@/platform/db/after-commit/after-commit.scheduler';

import type { JobDefinition } from './job.definition';
import { ENVELOPE_VERSION } from './queue.constants';
import { QueueRegistry } from './queue.registry';
import type { JobData, JobEnvelope } from './queue.typedefs';

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
      initiatedBy: ctx.originator(),
    };
    await this.afterCommit.schedule(async () => {
      await this.queues.get(definition.queue).add(definition.name, envelope);
    });
  }
}
