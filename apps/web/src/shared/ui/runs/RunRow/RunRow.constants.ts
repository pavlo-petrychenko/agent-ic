import { StatusKind } from '@/shared/ui/display/StatusDot/StatusDot.constants';

export enum RunStatus {
  Running = 'running',
  Ok = 'ok',
  Escalated = 'escalated',
  Failed = 'failed',
}

export const RUN_STATUS_DOT_KINDS: Readonly<Record<RunStatus, StatusKind>> = {
  [RunStatus.Running]: StatusKind.Run,
  [RunStatus.Ok]: StatusKind.Ok,
  [RunStatus.Escalated]: StatusKind.Warn,
  [RunStatus.Failed]: StatusKind.Err,
};
