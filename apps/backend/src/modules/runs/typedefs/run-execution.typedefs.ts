import type { FlowDocument, ScopeLookup } from '@agent-ic/flow';
import type { Message, MessageAuthor } from '@/modules/conversations';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface HistoryEntry {
  readonly author: MessageAuthor;
  readonly text: string;
}

export interface CurrentMessage {
  readonly text: string;
  readonly attachments: readonly unknown[];
}

export interface EndUser {
  readonly name: string | null;
  readonly language: string | null;
}

export interface MessageTriggerVariables {
  readonly message: CurrentMessage;
  readonly user: EndUser;
  readonly channel: string;
  readonly history: readonly HistoryEntry[];
  readonly today: string;
}

export interface RunWalk {
  readonly ctx: UseCaseCtx;
  readonly run: Run;
  readonly flow: FlowDocument;
  readonly lookup: ScopeLookup;
  readonly trigger: MessageTriggerVariables;
  readonly history: readonly Message[];
  readonly today: Date;
  readonly steps: Map<string, RunStep>;
}
