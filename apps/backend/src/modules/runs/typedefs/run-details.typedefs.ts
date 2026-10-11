import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';

export interface GetRunInput {
  readonly id: string;
}

export interface RunTotals {
  readonly stepsRun: number;
  readonly stepsInFlow: number;
  readonly messagesSent: number;
}

export interface RunStepView extends Omit<RunStep, 'workspaceId' | 'runId' | 'input'> {
  readonly durationMs: number | null;
}

export interface RunView extends Omit<
  Run,
  'workspaceId' | 'mode' | 'trigger' | 'lastCoveredMessageId' | 'traceId'
> {
  readonly durationMs: number | null;
  readonly totals: RunTotals;
  readonly steps: readonly RunStepView[];
}
