import type { FlowDocument, FlowGraph, ScopeLookup } from '@agent-ic/flow';
import type { Message, MessageAuthor } from '@/modules/conversations';
import type { ResolvedPrompts } from '@/modules/prompts';
import type { BranchSettlement } from '@/modules/runs/typedefs/run-branch.typedefs';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run, RunEnd } from '@/modules/runs/typedefs/run.typedefs';
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
  readonly finalAttempt: boolean;
  readonly run: Run;
  readonly flow: FlowDocument;
  readonly graph: FlowGraph;
  readonly lookup: ScopeLookup;
  readonly trigger: MessageTriggerVariables;
  readonly history: readonly Message[];
  readonly today: Date;
  readonly prompts: ResolvedPrompts;
  readonly steps: Map<string, RunStep>;
  readonly background: Promise<BranchSettlement>[];
  ending: RunEnd | null;
}
