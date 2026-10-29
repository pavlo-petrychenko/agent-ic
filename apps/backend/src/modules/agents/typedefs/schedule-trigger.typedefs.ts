import type { TriggerScheduleNode } from '@agent-ic/flow';

export interface LiveScheduleTriggerRow {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly versionId: string;
  readonly publishedAt: Date | null;
  readonly scheduleNodes: readonly unknown[];
}

export interface LiveScheduleTrigger {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly versionId: string;
  readonly publishedAt: Date;
  readonly node: TriggerScheduleNode;
}

export interface LiveScheduleTriggerState {
  readonly trigger: LiveScheduleTrigger;
  readonly paused: boolean;
}
