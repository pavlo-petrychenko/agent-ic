import type { ConversationMode } from '@/modules/conversations';
import type { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';

export type RunMode = ConversationMode;

export interface RunFailure {
  readonly reason: string;
  readonly message: string;
  readonly nodeId: string | null;
}

export interface Run {
  readonly id: string;
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly agentId: string;
  readonly versionId: string;
  readonly mode: RunMode;
  readonly trigger: RunTrigger;
  readonly status: RunStatus;
  readonly lastCoveredMessageId: string;
  readonly error: RunFailure | null;
  readonly traceId: string | null;
  readonly createdAt: Date;
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;
}
