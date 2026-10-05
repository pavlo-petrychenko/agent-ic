import type { JobsOptions } from 'bullmq';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { OUTBOX_GRACE_PERIOD_SECONDS } from '@/platform/queues/constants/outbox.constants';

export const outboxJobOptions = (messageId: string): JobsOptions => ({ jobId: messageId });

export const outboxSweepCutoff = (now: Date): Date =>
  new Date(now.getTime() - OUTBOX_GRACE_PERIOD_SECONDS * MILLISECONDS_PER_SECOND);
