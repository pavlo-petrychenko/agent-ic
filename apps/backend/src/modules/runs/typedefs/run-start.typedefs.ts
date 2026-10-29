import type { TriggeredRunOutcome } from '@/modules/runs/constants/run.constants';
import type {
  NewRun,
  ProactiveRunTrigger,
  RunMode,
  RunTriggerInput,
} from '@/modules/runs/typedefs/run.typedefs';

export interface RunStart {
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly versionId: string;
  readonly mode: RunMode;
  readonly triggerMessageId: string;
}

export type RunTarget = Omit<RunStart, 'versionId'>;

export interface TriggeredRunStart {
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly versionId: string;
  readonly trigger: ProactiveRunTrigger;
  readonly triggerNodeId: string;
  readonly triggerInput: RunTriggerInput | null;
}

export type TriggeredRun =
  | { readonly outcome: TriggeredRunOutcome.Started; readonly run: NewRun }
  | { readonly outcome: TriggeredRunOutcome.Busy };
