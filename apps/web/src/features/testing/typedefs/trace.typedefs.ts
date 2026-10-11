import type { NodeType } from '@agent-ic/flow';
import type { OutputViewKind } from '@/features/testing/constants/trace.constants';
import type { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import type { NodeKind } from '@/shared/ui/display/NodeTile';
import type { RunNodeState } from '@/shared/ui/flow/RunNode';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface RunStepView {
  id: string;
  nodeId: string;
  status: RunStepStatus;
  output: unknown;
}

export interface RunTotalsView {
  stepsRun: number;
  stepsInFlow: number;
  messagesSent: number;
}

export interface RunDetails {
  id: string;
  status: RunStatus;
  durationMs: number | null;
  failedNodeId: string | null;
  totals: RunTotalsView;
  steps: readonly RunStepView[];
}

export interface TestingRunResult {
  run: RunDetails | null;
  failed: boolean;
}

export interface TracePosition {
  row: number;
  column: number;
}

export interface TracePoint {
  x: number;
  y: number;
}

export interface TraceSlot extends TracePosition {
  id: string;
  label: string;
  type: NodeType;
}

export interface TraceEdge {
  id: string;
  source: TracePosition;
  target: TracePosition;
}

export interface TraceCell extends TraceSlot {
  kind: NodeKind;
  icon: IconName;
  state: RunNodeState;
}

export interface PlacedTraceCell extends TraceCell, TracePoint {}

export interface TracePath {
  id: string;
  d: string;
}

export interface TraceDrawing {
  size: TracePoint;
  nodes: readonly PlacedTraceCell[];
  paths: readonly TracePath[];
}

export interface OutputField {
  label: string;
  value: string;
}

export type OutputView =
  | { kind: OutputViewKind.Fields; fields: readonly OutputField[] }
  | { kind: OutputViewKind.Json; code: string };

export interface StepOutput {
  id: string;
  title: string;
  view: OutputView;
}
