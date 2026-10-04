import { HANDLE_METHOD, JOB_KEY_SEPARATOR } from '@/platform/queues/constants/job.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import type { JobData, JobDefinition, JobHandler } from '@/platform/queues/typedefs/job.typedefs';

export const defineJob = <TData extends JobData>(
  definition: JobDefinition<TData>,
): JobDefinition<TData> => Object.freeze({ ...definition });

export const jobKey = (queue: QueueName, name: string): string =>
  `${queue}${JOB_KEY_SEPARATOR}${name}`;

export const isJobHandler = (value: unknown): value is JobHandler<JobData> =>
  typeof value === 'object' &&
  value !== null &&
  HANDLE_METHOD in value &&
  typeof value[HANDLE_METHOD] === 'function';
