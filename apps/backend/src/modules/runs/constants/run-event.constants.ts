import type { EnqueueOptions } from '@/platform/queues/typedefs/job.typedefs';

export enum RunEventName {
  Escalated = 'runs.escalated',
}

export const RUN_EVENT_EMIT_OPTIONS: Readonly<Record<RunEventName, EnqueueOptions>> = {
  [RunEventName.Escalated]: { durable: true },
};
