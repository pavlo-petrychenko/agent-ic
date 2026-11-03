import type {
  EscalationNode,
  NodeType,
  NotifyChannel,
  EscalationMode,
  FlowDocument,
} from '@agent-ic/flow';
import type { ApiReplyMode } from '@/modules/channels/constants/channel.constants';
import type { RunStepStatus, Run, RunStep } from '@/modules/runs';

export interface InboxDetailsGuard {
  readonly label: string;
  readonly nodeType: NodeType;
  readonly reason: string | null;
}

export interface InboxDetailsRunStep {
  readonly id: string;
  readonly nodeId: string;
  readonly label: string;
  readonly nodeType: NodeType | null;
  readonly status: RunStepStatus;
  readonly value: string | null;
}

export interface InboxDetailsRun {
  readonly id: string;
  readonly agentVersion: number | null;
  readonly startedAt: Date | null;
  readonly durationMs: number | null;
  readonly steps: readonly InboxDetailsRunStep[];
}

export interface InboxDetailsNotified {
  readonly names: readonly string[];
  readonly allOperators: boolean;
  readonly channels: readonly NotifyChannel[];
}

export interface InboxDetailsHandler {
  readonly name: string;
  readonly since: Date | null;
  readonly until: Date | null;
}

export interface InboxDetails {
  readonly guard: InboxDetailsGuard | null;
  readonly run: InboxDetailsRun | null;
  readonly channelName: string | null;
  readonly replyTarget: ApiReplyMode | null;
  readonly notified: InboxDetailsNotified | null;
  readonly handled: InboxDetailsHandler | null;
  readonly runsCount: number;
}

export interface InboxDetailsInput {
  readonly conversationId: string;
}

export type EscalationNotify = Extract<
  EscalationNode['config'],
  { readonly mode: EscalationMode.Escalate }
>['notify'];

export interface RunSnapshot {
  readonly run: Run;
  readonly versionNumber: number | null;
  readonly steps: readonly RunStep[];
  readonly flow: FlowDocument;
}
