import type { TriggerInactivityNode } from '@agent-ic/flow';
import type { inactivityTimers } from '@/modules/runs/db/inactivity-timers.table';

export interface InactivityTimer {
  readonly id: string;
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly versionId: string;
  readonly nodeId: string;
  readonly anchorAt: Date;
  readonly attempt: number;
  readonly dueAt: Date | null;
  readonly leaseUntil: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type NewInactivityTimer = Omit<
  typeof inactivityTimers.$inferInsert,
  'leaseUntil' | 'createdAt' | 'updatedAt'
>;

export interface InactivityTimerPlan {
  readonly versionId: string;
  readonly node: TriggerInactivityNode;
  readonly attempt: number;
  readonly anchorAt: Date;
}
