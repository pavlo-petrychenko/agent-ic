import { Injectable } from '@nestjs/common';
import { context, ROOT_CONTEXT } from '@opentelemetry/api';
import { z } from 'zod';
import { getOriginator } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  DETACHED_TRACE_CONTEXT,
  ENVELOPE_VERSION,
} from '@/platform/queues/constants/job.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import { scheduledEnvelope } from '@/platform/queues/helpers/job.helpers';
import { outboxJobOptions } from '@/platform/queues/helpers/outbox.helpers';
import { currentTraceContext } from '@/platform/queues/helpers/queue-telemetry.helpers';
import { OutboxRepository } from '@/platform/queues/repositories/outbox.repository';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type {
  JobData,
  JobDefinition,
  JobEnqueueOptions,
  JobEnvelope,
  JobSchedulerRepeat,
} from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class JobsService {
  constructor(
    private readonly queues: QueuesService,
    private readonly afterCommit: AfterCommitService,
    private readonly outbox: OutboxRepository,
    private readonly ids: IdService,
  ) {}

  async enqueue<TData extends JobData>(
    ctx: UseCaseCtx,
    definition: JobDefinition<TData>,
    data: TData,
    options?: JobEnqueueOptions,
  ): Promise<void> {
    const detached = options?.detachedTrace === true;
    const envelope: JobEnvelope = {
      version: ENVELOPE_VERSION,
      data: definition.schema.parse(data),
      workspaceId: ctx.workspaceId,
      traceId: ctx.traceId,
      traceContext: detached ? DETACHED_TRACE_CONTEXT : currentTraceContext(),
      initiatedBy: getOriginator(ctx),
      ...(options?.delayMs === undefined ? {} : { delayMs: options.delayMs }),
    };
    const jobId = options?.jobId;
    if (options?.durable === true) {
      const id = jobId === undefined ? this.ids.generate() : z.uuid().parse(jobId);
      await this.enqueueDurable(definition, envelope, id, detached, options.delayMs);
      return;
    }
    await this.afterCommit.schedule(() =>
      this.inTrace(detached, async () => {
        await this.queues.get(definition.queue).add(definition.name, envelope, {
          jobId,
          ...(options?.delayMs === undefined ? {} : { delay: options.delayMs }),
        });
      }),
    );
  }

  async upsertScheduler<TData extends JobData>(
    ctx: UseCaseCtx,
    definition: JobDefinition<TData>,
    schedulerId: string,
    repeat: JobSchedulerRepeat,
    data: TData,
  ): Promise<void> {
    const envelope = scheduledEnvelope(ctx.workspaceId, definition.schema.parse(data), ctx.traceId);
    await this.afterCommit.schedule(async () => {
      await this.queues
        .get(definition.queue)
        .upsertJobScheduler(schedulerId, repeat, { name: definition.name, data: envelope });
    });
  }

  async removeScheduler(queue: QueueName, schedulerId: string): Promise<void> {
    await this.afterCommit.schedule(async () => {
      await this.queues.get(queue).removeJobScheduler(schedulerId);
    });
  }

  private async enqueueDurable<TData extends JobData>(
    definition: JobDefinition<TData>,
    envelope: JobEnvelope,
    id: string,
    detached: boolean,
    delayMs?: number,
  ): Promise<void> {
    await this.outbox.insert({
      id,
      queue: definition.queue,
      name: definition.name,
      envelope,
      workspaceId: envelope.workspaceId,
    });
    await this.afterCommit.schedule(async () => {
      await this.inTrace(detached, () =>
        this.queues
          .get(definition.queue)
          .add(definition.name, envelope, outboxJobOptions(id, delayMs)),
      );
      await this.outbox.delete(id);
    });
  }

  private inTrace<T>(detached: boolean, work: () => Promise<T>): Promise<T> {
    return detached ? context.with(ROOT_CONTEXT, work) : work();
  }
}
