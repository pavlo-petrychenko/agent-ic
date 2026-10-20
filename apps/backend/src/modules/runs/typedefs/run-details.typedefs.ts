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

export interface RunStepView extends Omit<RunStep, 'workspaceId' | 'runId'> {
  readonly durationMs: number | null;
}

export interface RunView extends Omit<
  Run,
  'workspaceId' | 'mode' | 'trigger' | 'lastCoveredMessageId' | 'traceId'
> {
  readonly durationMs: number | null;
}

export interface SimulationRunsInput {
  readonly conversationId: string;
}

export interface SimulationRunSummary {
  readonly id: string;
  readonly status: Run['status'];
  readonly finishedAt: Date | null;
  readonly draftRevision: number | null;
}
