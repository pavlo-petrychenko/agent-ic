export enum QueueMetricName {
  WaitingJobs = 'queue_waiting_jobs',
  OldestWaitingJobAge = 'queue_oldest_waiting_job_age_seconds',
  Jobs = 'queue_jobs',
}

export enum QueueMetricHelp {
  WaitingJobs = 'Jobs waiting in the queue',
  OldestWaitingJobAge = 'Age of the oldest waiting job in seconds',
  Jobs = 'Jobs in the queue by state',
}

export enum QueueMetricLabel {
  Queue = 'queue',
  State = 'state',
}

export const QUEUE_JOB_STATES = ['waiting', 'active', 'delayed', 'failed'] as const;

export const WAITING_JOB_STATE = 'wait';
export const OLDEST_JOB_INDEX = 0;
export const OLDEST_FIRST = true;
export const NO_WAIT_SECONDS = 0;
export const NO_JOBS = 0;
