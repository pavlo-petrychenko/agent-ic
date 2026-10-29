import { NodeType } from '@agent-ic/flow';
import { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import { BadgeTone } from '@/shared/ui/display/Badge';
import { RunNodeState } from '@/shared/ui/flow/RunNode';

export const TRACE_CELL_SEPARATOR = ':';

export const TRACE_NODE = { width: 194, height: 36 } as const;

export const TRACE_GAP = { x: 10, y: 18 } as const;

export const TRACE_MIN_SCALE = 0.7;

export const TRACE_FALLBACK_WIDTH = 1000;

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
  Escalation = 'escalation',
  AgentExit = 'agentExit',
  AutoClose = 'autoClose',
}

export const EXIT_VIEW_KINDS: ReadonlySet<OutputViewKind> = new Set([
  OutputViewKind.Escalation,
  OutputViewKind.AgentExit,
  OutputViewKind.AutoClose,
]);

export enum TraceExit {
  Escalated = 'escalated',
  Ended = 'ended',
  DefaultHandoff = 'defaultHandoff',
  DefaultEnd = 'defaultEnd',
}

export const TRACE_EXIT_STATES: Readonly<Record<TraceExit, RunNodeState>> = {
  [TraceExit.Escalated]: RunNodeState.Escalated,
  [TraceExit.Ended]: RunNodeState.Ended,
  [TraceExit.DefaultHandoff]: RunNodeState.Escalated,
  [TraceExit.DefaultEnd]: RunNodeState.Ended,
};

export enum ExitPath {
  Default = 'default',
  Connected = 'connected',
}

export const AUTO_CLOSE_SECTION_ID = 'autoClose';
export const EXIT_MESSAGE_SEPARATOR = '\n\n';
export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 1440;

export const RECIPIENT_LIST_FORMAT: Intl.ListFormatOptions = { type: 'unit', style: 'short' };

export const JSON_INDENT = 2;
export const MS_PER_SECOND = 1000;
export const DURATION_FRACTION_DIGITS = 1;
export const EMPTY_FIELD_VALUE = '—';

export const STEP_STATUS_TONES: Readonly<Record<RunStepStatus, BadgeTone>> = {
  [RunStepStatus.Running]: BadgeTone.Accent,
  [RunStepStatus.Succeeded]: BadgeTone.Ok,
  [RunStepStatus.Failed]: BadgeTone.Err,
};

export enum StepSection {
  Input = 'input',
  Output = 'output',
  Error = 'error',
}

export enum TurnOutcome {
  HandedBack = 'handedBack',
  Ended = 'ended',
  ClosedInactive = 'closedInactive',
}

export const CLOSABLE_RUN_STATUSES: ReadonlySet<RunStatus> = new Set([
  RunStatus.Succeeded,
  RunStatus.Escalated,
]);

export const TURN_STATUS_TONES: Readonly<Record<RunStatus | TurnOutcome, BadgeTone>> = {
  [TurnOutcome.HandedBack]: BadgeTone.Neutral,
  [TurnOutcome.Ended]: BadgeTone.Neutral,
  [TurnOutcome.ClosedInactive]: BadgeTone.Neutral,
  [RunStatus.Queued]: BadgeTone.Neutral,
  [RunStatus.Running]: BadgeTone.Accent,
  [RunStatus.Succeeded]: BadgeTone.Ok,
  [RunStatus.Escalated]: BadgeTone.Err,
  [RunStatus.Failed]: BadgeTone.Err,
};

export const QUIET_OUTPUT_NODE_TYPES: ReadonlySet<NodeType> = new Set([NodeType.SendMessage]);
