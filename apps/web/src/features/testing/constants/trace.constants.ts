import { RunStepStatus } from '@/shared/api/generated/schema.generated';
import { RunNodeState } from '@/shared/ui/flow/RunNode';

export const TRACE_CELL_SEPARATOR = ':';

export const TRACE_NODE = { width: 220, height: 36 } as const;

export const TRACE_GAP = { x: 16, y: 18 } as const;

export const STEP_NODE_STATES: Readonly<Record<RunStepStatus, RunNodeState>> = {
  [RunStepStatus.Succeeded]: RunNodeState.Done,
  [RunStepStatus.Running]: RunNodeState.Running,
  [RunStepStatus.Failed]: RunNodeState.Failed,
};

export const FOCUS_STEP_STATUSES: ReadonlySet<RunStepStatus> = new Set([
  RunStepStatus.Running,
  RunStepStatus.Failed,
]);
