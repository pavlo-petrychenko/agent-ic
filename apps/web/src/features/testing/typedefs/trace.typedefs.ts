import type { NodeType } from '@agent-ic/flow';
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

export interface TraceSlot {
  id: string;
  label: string;
  type: NodeType;
  row: number;
  column: number;
  linked: boolean;
}

export interface TraceCell extends TraceSlot {
  kind: NodeKind;
  icon: IconName;
  state: RunNodeState;
}
