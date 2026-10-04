import type { DefaultJobOptions } from 'bullmq';

import {
  COMPLETED_JOB_RETENTION_SECONDS,
  FAILED_JOB_RETENTION_SECONDS,
  JOB_ATTEMPTS,
  JOB_BACKOFF_DELAY_MS,
  HANDLE_METHOD,
  JOB_KEY_SEPARATOR,
  JobBackoffType,
} from './queue.constants';
import type { QueueName } from './queue.constants';
import type { JobData, JobHandler } from './queue.typedefs';

export const defaultJobOptions = (): DefaultJobOptions => ({
  attempts: JOB_ATTEMPTS,
  backoff: { type: JobBackoffType.Exponential, delay: JOB_BACKOFF_DELAY_MS },
  removeOnComplete: { age: COMPLETED_JOB_RETENTION_SECONDS },
  removeOnFail: { age: FAILED_JOB_RETENTION_SECONDS },
});

export const jobKey = (queue: QueueName, name: string): string =>
  `${queue}${JOB_KEY_SEPARATOR}${name}`;

export const isJobHandler = (value: unknown): value is JobHandler<JobData> =>
  typeof value === 'object' &&
  value !== null &&
  HANDLE_METHOD in value &&
  typeof value[HANDLE_METHOD] === 'function';
