import {
  HANDLE_METHOD,
  JOB_CURRENT_ATTEMPT,
  JOB_DEFAULT_ATTEMPTS,
  JOB_KEY_SEPARATOR,
} from '@/platform/queues/constants/job.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import type {
  AttemptedJob,
  JobAttempt,
  JobData,
  JobDefinition,
  JobHandler,
  JobSchedule,
} from '@/platform/queues/typedefs/job.typedefs';

export const defineJob = <TData extends JobData>(
  definition: JobDefinition<TData>,
): JobDefinition<TData> => Object.freeze({ ...definition });

export const defineJobSchedule = <TData extends JobData>(
  schedule: JobSchedule<TData>,
): JobSchedule<TData> => Object.freeze({ ...schedule });

export const jobKey = (queue: QueueName, name: string): string =>
  `${queue}${JOB_KEY_SEPARATOR}${name}`;

export const isJobHandler = (value: unknown): value is JobHandler<JobData> =>
  typeof value === 'object' &&
  value !== null &&
  HANDLE_METHOD in value &&
  typeof value[HANDLE_METHOD] === 'function';

export const jobAttemptOf = ({ attemptsMade, opts }: AttemptedJob): JobAttempt => ({
  final: attemptsMade + JOB_CURRENT_ATTEMPT >= (opts.attempts ?? JOB_DEFAULT_ATTEMPTS),
});
