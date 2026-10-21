import type { EnqueueOptions } from '@/platform/queues/typedefs/job.typedefs';

export enum UsageEventName {
  ThresholdReached = 'usage.threshold-reached',
}

export const USAGE_THRESHOLD_EMIT_OPTIONS: EnqueueOptions = { durable: true };
