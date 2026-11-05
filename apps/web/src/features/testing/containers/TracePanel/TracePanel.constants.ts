import { StatusKind } from '@/shared/ui/display/StatusDot';
import { RunNodeState } from '@/shared/ui/flow/RunNode';

export const TRACE_LEGEND: readonly { state: RunNodeState; status: StatusKind }[] = [
  { state: RunNodeState.Done, status: StatusKind.Ok },
  { state: RunNodeState.Running, status: StatusKind.Run },
  { state: RunNodeState.Failed, status: StatusKind.Err },
  { state: RunNodeState.Escalated, status: StatusKind.Warn },
  { state: RunNodeState.Ended, status: StatusKind.Ink },
  { state: RunNodeState.Skipped, status: StatusKind.Idle },
];
