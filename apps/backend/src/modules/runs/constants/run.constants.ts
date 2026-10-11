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

export const STEP_EXECUTORS = Symbol('STEP_EXECUTORS');

export const RUN_STEPS_CHANNEL_NAME = 'run-steps';

export const CURRENT_MESSAGE_SEPARATOR = '\n';

export const ISO_DATE_LENGTH = 10;
