export enum RunStatus {
  Queued = 'queued',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Escalated = 'escalated',
}

export enum RunStepStatus {
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export enum RunTrigger {
  Message = 'message',
}

export const ROOT_BRANCH_KEY = 'root';

export const RUNS_SCHEMA = 'runs';

export const FIRST_STEP_ATTEMPT = 1;

export const UNFINISHED_RUN_STATUSES: readonly RunStatus[] = [RunStatus.Queued, RunStatus.Running];
