import type { FlowNode } from '@agent-ic/flow';
import type { Message } from '@/modules/conversations';
import type { ResolvedPrompts } from '@/modules/prompts';
import type { StepTrace, StepTranscript } from '@/modules/runs/typedefs/agent-transcript.typedefs';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface StepScope {
  readonly variables: StepData;
  readonly history: readonly Message[];
  readonly transcripts: readonly StepTranscript[];
  readonly today: Date;
  readonly prompts: ResolvedPrompts;
}

export interface StepExecution<TNode extends FlowNode> {
  readonly ctx: UseCaseCtx;
  readonly run: Run;
  readonly stepId: string;
  readonly node: TNode;
  readonly branchKey: string;
  readonly scope: StepScope;
  readonly onTrace?: (trace: StepTrace) => void;
}

export interface StepOutcome {
  readonly port: string | null;
  readonly output: StepData;
}

export interface StepExecutor<TNode extends FlowNode = FlowNode> {
  readonly nodeType: TNode['type'];
  execute(execution: StepExecution<TNode>): Promise<StepOutcome>;
}
