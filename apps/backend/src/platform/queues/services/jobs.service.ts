import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ClockService } from '@/platform/clock/services/clock.service';
import { getOriginator } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import { IdService } from '@/platform/ids/services/id.service';
import { ENVELOPE_VERSION } from '@/platform/queues/constants/job.constants';
import { outboxJobOptions } from '@/platform/queues/helpers/outbox.helpers';
import { OutboxRepository } from '@/platform/queues/repositories/outbox.repository';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type {
  JobData,
  JobDefinition,
  JobEnqueueOptions,
  JobEnvelope,
} from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class JobsService {
  constructor(
    private readonly queues: QueuesService,
    private readonly afterCommit: AfterCommitService,
    private readonly outbox: OutboxRepository,
    private readonly ids: IdService,
    private readonly clock: ClockService,
  ) {}

  async enqueue<TData extends JobData>(
    ctx: UseCaseCtx,
    definition: JobDefinition<TData>,
    data: TData,
    options?: JobEnqueueOptions,
  ): Promise<void> {
    const envelope: JobEnvelope = {
      version: ENVELOPE_VERSION,
      data: definition.schema.parse(data),
      workspaceId: ctx.workspaceId,
      traceId: ctx.traceId,
      initiatedBy: getOriginator(ctx),
    };
    const jobId = options?.jobId;
    if (options?.durable === true) {
      const id = jobId === undefined ? this.ids.generate() : z.uuid().parse(jobId);
      await this.enqueueDurable(definition, envelope, id);
      return;
    }
    await this.afterCommit.schedule(async () => {
      await this.queues.get(definition.queue).add(definition.name, envelope, { jobId });
    });
  }

  private async enqueueDurable<TData extends JobData>(
    definition: JobDefinition<TData>,
    envelope: JobEnvelope,
    id: string,
  ): Promise<void> {
    await this.outbox.insert({
      id,
      queue: definition.queue,
      name: definition.name,
      envelope,
      workspaceId: envelope.workspaceId,
      createdAt: this.clock.now(),
    });
    await this.afterCommit.schedule(async () => {
      await this.queues.get(definition.queue).add(definition.name, envelope, outboxJobOptions(id));
      await this.outbox.delete(id);
    });
  }
}
