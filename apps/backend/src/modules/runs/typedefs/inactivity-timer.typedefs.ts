import type { TriggerInactivityNode } from '@agent-ic/flow';
import type { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import type { inactivityTimers } from '@/modules/runs/db/inactivity-timers.table';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';

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

export interface InactivityClaim {
  readonly now: Date;
  readonly leaseUntil: Date;
  readonly limit: number;
  readonly perWorkspace: number;
}

export type ClaimedInactivityTimer = Pick<InactivityTimer, 'id' | 'workspaceId' | 'dueAt'>;

export interface InactivityFire {
  readonly outcome: InactivityFireOutcome;
  readonly run: NewRun | null;
}

export type InactivityCheck =
  | { readonly outcome: InactivityFireOutcome }
  | { readonly versionId: string; readonly node: TriggerInactivityNode };
