import type { ConversationMode } from '@/modules/conversations';
import type { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import type { runs } from '@/modules/runs/db/runs.table';

export type RunMode = ConversationMode;

export interface RunFailure {
  readonly reason: string;
  readonly message: string;
  readonly nodeId: string | null;
}

export type RunTriggerInputValue = string | number | boolean | null;

export type RunTriggerInput = Readonly<Record<string, RunTriggerInputValue>>;

export interface Run {
  readonly id: string;
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly agentId: string;
  readonly versionId: string;
  readonly mode: RunMode;
  readonly trigger: RunTrigger;
  readonly triggerNodeId: string | null;
  readonly triggerInput: RunTriggerInput | null;
  readonly status: RunStatus;
  readonly lastCoveredMessageId: string;
  readonly error: RunFailure | null;
  readonly traceId: string | null;
  readonly createdAt: Date;
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;
}

export type NewRun = Omit<typeof runs.$inferInsert, 'createdAt'>;

export type ProactiveRunTrigger = Exclude<RunTrigger, RunTrigger.Message>;

export type FinishedRunStatus = RunStatus.Succeeded | RunStatus.Failed | RunStatus.Escalated;

export interface RunEnd {
  readonly status: FinishedRunStatus;
  readonly error: RunFailure | null;
  readonly finishedAt: Date;
}
