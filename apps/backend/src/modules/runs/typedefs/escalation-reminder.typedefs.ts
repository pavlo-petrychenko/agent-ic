import type { DeliveryJobData } from '@/modules/runs/typedefs/notification-delivery.typedefs';

export interface EscalationHandoff {
  readonly reminderAfterMinutes: number | null;
  readonly fallbackAfterMinutes: number | null;
  readonly fallbackTemplate: string;
}

export interface FireEscalationTimerResult {
  readonly deliveries: readonly DeliveryJobData[];
}
