import { Injectable } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';
import { CLS_ID, ClsService } from 'nestjs-cls';
import { SystemReason } from '@/platform/context/context.constants';
import { UseCaseCtxFactory } from '@/platform/context/use-case-ctx.factory';
import { ErrorReporter } from '@/platform/errors/error.reporter';
import { JobFailureAction } from '@/platform/errors/errors.constants';
import { JobErrorMapper } from '@/platform/errors/job-error.mapper';
import {
  INVALID_JOB_PAYLOAD_MESSAGE,
  NON_ERROR_FAILURE_MESSAGE,
  UNKNOWN_JOB_MESSAGE,
} from '@/platform/queues/constants/job.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import { jobEnvelopeSchema } from '@/platform/queues/schemas/job-envelope.schema';
import { JobHandlersService } from '@/platform/queues/services/job-handlers.service';

@Injectable()
export class JobExecutionService {
  constructor(
    private readonly handlers: JobHandlersService,
    private readonly contexts: UseCaseCtxFactory,
    private readonly errors: JobErrorMapper,
    private readonly reporter: ErrorReporter,
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
    if (this.errors.actionFor(error) === JobFailureAction.GiveUp) {
      return new UnrecoverableError(
        error instanceof Error ? error.message : NON_ERROR_FAILURE_MESSAGE,
      );
    }
    return error instanceof Error ? error : new Error(NON_ERROR_FAILURE_MESSAGE, { cause: error });
  }
}
