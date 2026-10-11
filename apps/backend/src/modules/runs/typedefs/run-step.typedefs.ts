import type { RunStepStatus } from '@/modules/runs/constants/run.constants';
import type { RunFailure } from '@/modules/runs/typedefs/run.typedefs';

export type StepData = Readonly<Record<string, unknown>>;

export interface RunStep {
  readonly id: string;
  readonly workspaceId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly branchKey: string;
  readonly status: RunStepStatus;
  readonly attempt: number;
  readonly input: StepData;
  readonly output: StepData | null;
  readonly port: string | null;
  readonly error: RunFailure | null;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
}
