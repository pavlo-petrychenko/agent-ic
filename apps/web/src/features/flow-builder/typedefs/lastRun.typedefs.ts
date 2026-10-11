import type { RunStatus } from '@/shared/api/generated/schema.generated';

export interface LastSimulationRun {
  status: RunStatus;
  finishedAt: string | null;
  draftRevision: number | null;
}

export interface LastSimulationRunResult {
  run: LastSimulationRun | null;
  loaded: boolean;
}
