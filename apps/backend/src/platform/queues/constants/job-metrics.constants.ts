export enum JobMetricName {
  Processed = 'jobs_processed_total',
  Duration = 'job_duration_seconds',
  Wait = 'job_wait_seconds',
  Active = 'jobs_active',
}

export enum JobMetricHelp {
  Processed = 'Jobs the worker finished, by queue, job and outcome',
  Duration = 'Time the worker spent running a job in seconds',
  Wait = 'Time a job waited in the queue before its first attempt in seconds',
  Active = 'Jobs the worker is running now',
}

export enum JobMetricLabel {
  Queue = 'queue',
  Job = 'job_name',
  Outcome = 'outcome',
}

export enum JobOutcome {
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export const FIRST_ATTEMPT = 0;
export const NO_WAIT_MS = 0;
export const JOB_DURATION_BUCKETS_SECONDS: readonly number[] = [
  0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300,
];
export const JOB_WAIT_BUCKETS_SECONDS: readonly number[] = [
  0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60, 300,
];
