import type { JobAttempt } from '@/platform/queues/typedefs/job.typedefs';
export enum ProbeJobName {
  Record = 'probe-record',
  Reject = 'probe-reject',
  Welcome = 'probe-welcome-on-signed-up',
  Audit = 'probe-audit-on-signed-up',
  Scheduled = 'probe-scheduled',
  Flaky = 'probe-flaky',
}

export enum ProbeEventName {
  SignedUp = 'probe-signed-up',
}

export enum ProbeListener {
  Record = 'record',
  Welcome = 'welcome',
  Audit = 'audit',
  Scheduled = 'scheduled',
  Flaky = 'flaky',
}

export const PROBE_WAIT_TIMEOUT_MS = 10_000;
export const PROBE_WAIT_INTERVAL_MS = 20;
export const PROBE_USER_ID = 'usr_probe';
export const PROBE_WORKSPACE_ID = 'wsp_probe';
export const PROBE_TRACE_ID = 'trace-probe';
export const SCHEDULED_PROBE_ID = 'probe-scheduled';
export const SCHEDULED_PROBE_EVERY_SECONDS = 3_600;
export const FLAKY_PROBE_FAILED_ATTEMPTS = 1;
export const DURABLE_JOBS_TEST_START = new Date('2099-01-01T09:00:00.000Z');

export const RETRYABLE_ATTEMPT: JobAttempt = { final: false };
export const FINAL_ATTEMPT: JobAttempt = { final: true };
