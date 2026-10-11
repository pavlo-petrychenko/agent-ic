import type { RunStepStatus } from '@/modules/runs/constants/run.constants';

export interface RunStepsInput {
  readonly runId: string;
}

export interface RunStepUpdate {
  readonly runId: string;
  readonly stepId: string;
  readonly nodeId: string;
  readonly status: RunStepStatus;
}
