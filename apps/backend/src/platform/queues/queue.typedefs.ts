import type { Actor } from '@/platform/context/context.typedefs';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';

import type { JobDefinition } from './job.definition';
import type { ENVELOPE_VERSION } from './queue.constants';

export type JobDataValue = string | number | boolean | null | readonly string[];

export type JobData = Readonly<Record<string, JobDataValue>>;

export interface JobEnvelope {
  readonly version: typeof ENVELOPE_VERSION;
  readonly data: JobData;
  readonly workspaceId: string | null;
  readonly traceId: string;
  readonly initiatedBy: Actor;
}

export interface JobHandler<TData extends JobData> {
  handle(ctx: UseCaseCtx, data: TData): Promise<void>;
}

export interface RegisteredJobHandler {
  readonly definition: JobDefinition<JobData>;
  readonly handler: JobHandler<JobData>;
}
