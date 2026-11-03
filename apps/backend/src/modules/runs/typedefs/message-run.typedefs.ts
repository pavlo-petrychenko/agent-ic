import type { RunMode } from '@/modules/runs/typedefs/run.typedefs';

export interface MessageRunInput {
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly messageId: string;
  readonly agentId: string;
  readonly mode: RunMode;
  readonly versionId: string | null;
  readonly runId: string | null;
}
