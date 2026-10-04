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
export const ENVELOPE_VERSION = 1;
export const UNKNOWN_JOB_MESSAGE = 'No handler is registered for this job.';
export const INVALID_JOB_PAYLOAD_MESSAGE = 'The job payload is not valid.';
export const DUPLICATE_JOB_HANDLER_MESSAGE = 'A handler is already registered for this job.';
export const JOB_KEY_SEPARATOR = '/';
export const HANDLE_METHOD = 'handle';
export const NON_ERROR_FAILURE_MESSAGE = 'The job failed with a non-error value.';
