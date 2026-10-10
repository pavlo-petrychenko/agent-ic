import type { FlowNode } from '@agent-ic/flow';
import type { Message } from '@/modules/conversations';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface StepScope {
  readonly variables: StepData;
  readonly history: readonly Message[];
  readonly today: Date;
}

export interface StepExecution<TNode extends FlowNode> {
  readonly ctx: UseCaseCtx;
  readonly run: Run;
  readonly node: TNode;
  readonly branchKey: string;
  readonly scope: StepScope;
}

export interface StepOutcome {
  readonly port: string | null;
  readonly output: StepData;
}

export interface StepExecutor<TNode extends FlowNode = FlowNode> {
  readonly nodeType: TNode['type'];
  execute(execution: StepExecution<TNode>): Promise<StepOutcome>;
}
