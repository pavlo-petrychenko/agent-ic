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
