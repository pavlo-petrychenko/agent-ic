import { NodeType } from '@agent-ic/flow';
import { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import { BadgeTone } from '@/shared/ui/display/Badge';
import { RunNodeState } from '@/shared/ui/flow/RunNode';

export const TRACE_CELL_SEPARATOR = ':';

export const TRACE_NODE = { width: 194, height: 36 } as const;

export const TRACE_GAP = { x: 10, y: 18 } as const;

export const STEP_NODE_STATES: Readonly<Record<RunStepStatus, RunNodeState>> = {
  [RunStepStatus.Succeeded]: RunNodeState.Done,
  [RunStepStatus.Running]: RunNodeState.Running,
  [RunStepStatus.Failed]: RunNodeState.Failed,
};

export const FOCUS_STEP_STATUSES: ReadonlySet<RunStepStatus> = new Set([
  RunStepStatus.Running,
  RunStepStatus.Failed,
]);

export enum OutputViewKind {
  Fields = 'fields',
  Json = 'json',
  Error = 'error',
}

export const JSON_INDENT = 2;
export const MS_PER_SECOND = 1000;
export const DURATION_FRACTION_DIGITS = 1;
export const EMPTY_FIELD_VALUE = '—';

export const RUN_STATUS_TONES: Readonly<Record<RunStatus, BadgeTone>> = {
  [RunStatus.Queued]: BadgeTone.Neutral,
  [RunStatus.Running]: BadgeTone.Accent,
  [RunStatus.Succeeded]: BadgeTone.Ok,
  [RunStatus.Escalated]: BadgeTone.Warn,
  [RunStatus.Failed]: BadgeTone.Err,
};

export const QUIET_OUTPUT_NODE_TYPES: ReadonlySet<NodeType> = new Set([NodeType.SendMessage]);
