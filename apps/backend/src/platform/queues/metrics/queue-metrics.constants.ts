export enum QueueMetricName {
  WaitingJobs = 'queue_waiting_jobs',
  OldestWaitingJobAge = 'queue_oldest_waiting_job_age_seconds',
}

export enum QueueMetricHelp {
  WaitingJobs = 'Jobs waiting in the queue',
  OldestWaitingJobAge = 'Age of the oldest waiting job in seconds',
}

export enum QueueMetricLabel {
  Queue = 'queue',
}

export const WAITING_JOB_STATE = 'wait';
export const OLDEST_JOB_INDEX = 0;
export const OLDEST_FIRST = true;
export const NO_WAIT_SECONDS = 0;
export const MILLISECONDS_PER_SECOND = 1_000;
