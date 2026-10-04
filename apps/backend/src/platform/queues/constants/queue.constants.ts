export enum QueueName {
  RunsReactive = 'runs-reactive',
  RunsProactive = 'runs-proactive',
  Outbound = 'outbound',
  Notify = 'notify',
  Timers = 'timers',
  Ingest = 'ingest',
}

export enum JobBackoffType {
  Exponential = 'exponential',
}

export enum QueueEvent {
  Error = 'error',
  Failed = 'failed',
}

export enum QueueLogMessage {
  QueueError = 'queue error',
  WorkerError = 'worker error',
  JobFailed = 'job failed',
  WorkerStarted = 'worker started',
  WorkerStopped = 'worker stopped',
}

const SECONDS_PER_DAY = 86_400;

export const JOB_ATTEMPTS = 5;
export const JOB_BACKOFF_DELAY_MS = 2_000;
export const COMPLETED_JOB_RETENTION_SECONDS = SECONDS_PER_DAY;
export const FAILED_JOB_RETENTION_SECONDS = 7 * SECONDS_PER_DAY;
