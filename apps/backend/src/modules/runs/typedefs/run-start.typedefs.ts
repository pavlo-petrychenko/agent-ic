import type { RunMode } from '@/modules/runs/typedefs/run.typedefs';

export interface RunStart {
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly versionId: string;
  readonly mode: RunMode;
  readonly triggerMessageId: string;
}

export type RunTarget = Omit<RunStart, 'versionId'>;
