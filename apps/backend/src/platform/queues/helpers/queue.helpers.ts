import type { DefaultJobOptions } from 'bullmq';
import {
  COMPLETED_JOB_RETENTION_SECONDS,
  FAILED_JOB_RETENTION_SECONDS,
  JOB_ATTEMPTS,
  JOB_BACKOFF_DELAY_MS,
  JobBackoffType,
} from '@/platform/queues/constants/queue.constants';

export const defaultJobOptions = (): DefaultJobOptions => ({
  attempts: JOB_ATTEMPTS,
  backoff: { type: JobBackoffType.Exponential, delay: JOB_BACKOFF_DELAY_MS },
  removeOnComplete: { age: COMPLETED_JOB_RETENTION_SECONDS },
  removeOnFail: { age: FAILED_JOB_RETENTION_SECONDS },
});
