import { Injectable } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';
import { CLS_ID, ClsService } from 'nestjs-cls';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { ErrorReporterService } from '@/platform/errors/services/error-reporter.service';
import { JobHandlerRegistry } from '@/platform/queues/job-handler.registry';
import {
  INVALID_JOB_PAYLOAD_MESSAGE,
  NON_ERROR_FAILURE_MESSAGE,
  UNKNOWN_JOB_MESSAGE,
} from '@/platform/queues/queue.constants';
import type { QueueName } from '@/platform/queues/queue.constants';
import { jobEnvelopeSchema } from '@/platform/queues/queue.schema';

@Injectable()
export class JobRunner {
  constructor(
    private readonly handlers: JobHandlerRegistry,
    private readonly contexts: UseCaseCtxService,
    private readonly reporter: ErrorReporterService,
    private readonly cls: ClsService,
  ) {}

  async run(queue: QueueName, job: Job<unknown>): Promise<void> {
    const envelope = jobEnvelopeSchema.safeParse(job.data);
    if (!envelope.success) {
      throw new UnrecoverableError(INVALID_JOB_PAYLOAD_MESSAGE);
    }
    const registered = this.handlers.find(queue, job.name);
    if (registered === null) {
      throw new UnrecoverableError(UNKNOWN_JOB_MESSAGE);
    }
    const data = registered.definition.schema.safeParse(envelope.data.data);
    if (!data.success) {
      throw new UnrecoverableError(INVALID_JOB_PAYLOAD_MESSAGE);
    }
    const ctx = this.contexts.system({
      reason: SystemReason.Job,
      workspaceId: envelope.data.workspaceId,
      traceId: envelope.data.traceId,
      initiatedBy: envelope.data.initiatedBy,
    });
    await this.cls.run(async () => {
      this.cls.set(CLS_ID, ctx.traceId);
      try {
        await registered.handler.handle(ctx, data.data);
      } catch (error) {
        this.reporter.report(error, ctx.traceId);
        throw this.toFailure(error);
      }
    });
  }

  private toFailure(error: unknown): Error {
    if (jobFailureActionFor(error) === JobFailureAction.GiveUp) {
      return new UnrecoverableError(
        error instanceof Error ? error.message : NON_ERROR_FAILURE_MESSAGE,
      );
    }
    return error instanceof Error ? error : new Error(NON_ERROR_FAILURE_MESSAGE, { cause: error });
  }
}
