export enum ProbeJobName {
  Record = 'probe-record',
  Reject = 'probe-reject',
  Welcome = 'probe-welcome-on-signed-up',
  Audit = 'probe-audit-on-signed-up',
}

export enum ProbeEventName {
  SignedUp = 'probe-signed-up',
}

export enum ProbeListener {
  Record = 'record',
  Welcome = 'welcome',
  Audit = 'audit',
}

export const PROBE_WAIT_TIMEOUT_MS = 10_000;
export const PROBE_WAIT_INTERVAL_MS = 20;
export const PROBE_USER_ID = 'usr_probe';
export const PROBE_WORKSPACE_ID = 'wsp_probe';
export const PROBE_TRACE_ID = 'trace-probe';
