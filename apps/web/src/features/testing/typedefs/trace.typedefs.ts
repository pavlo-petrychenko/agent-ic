import type { WorkspaceRole } from '@agent-ic/contracts';
import type {
  AgentExitKind,
  EscalationMode,
  FlowDocument,
  FlowNode,
  NodeType,
  RecipientsKind,
} from '@agent-ic/flow';
import type {
  ExitPath,
  OutputViewKind,
  StepSection,
  TraceExit,
  TurnOutcome,
} from '@/features/testing/constants/trace.constants';
import type { RunStatus, RunStepStatus } from '@/shared/api/generated/schema.generated';
import type { NodeKind } from '@/shared/ui/display/NodeTile';
import type { RunNodeState } from '@/shared/ui/flow/RunNode';
import type { IconName } from '@/shared/ui/foundations/Icon';

export type TurnStatus = RunStatus | TurnOutcome;

export interface RunStepView {
  id: string;
  nodeId: string;
  status: RunStepStatus;
  input: unknown;
  output: unknown;
  errorMessage: string | null;
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
  dashed: boolean;
}

export interface TraceCell extends TraceSlot {
  kind: NodeKind;
  icon: IconName;
  state: RunNodeState;
  exit: TraceExit | null;
  selectable: boolean;
  selected: boolean;
}

export interface PlacedTraceCell extends TraceCell, TracePoint {}

export interface TracePath {
  id: string;
  d: string;
  dashed: boolean;
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
  | { kind: OutputViewKind.Json; code: string }
  | { kind: OutputViewKind.Error; message: string | null }
  | EscalationView
  | AgentExitView
  | { kind: OutputViewKind.AutoClose; after: string | null };

export type ExitRecipients =
  | { kind: RecipientsKind.Operators }
  | { kind: RecipientsKind.Role; role: WorkspaceRole }
  | { kind: RecipientsKind.Users; count: number };

export interface EscalationView {
  kind: OutputViewKind.Escalation;
  mode: EscalationMode;
  reason: string | null;
  recipients: ExitRecipients | null;
  wouldNotify: string | null;
  message: string | null;
  resumed: boolean;
}

export interface AgentExitView {
  kind: OutputViewKind.AgentExit;
  outcome: AgentExitKind;
  reason: string | null;
  path: ExitPath;
  next: string | null;
  recipients: ExitRecipients | null;
  message: string | null;
}

export interface StepContext {
  node: FlowNode | null;
  flow: FlowDocument | null;
  texts: readonly string[];
}

export interface StepSectionView {
  section: StepSection;
  view: OutputView;
}

export interface StepOutput {
  id: string;
  title: string;
  view: OutputView;
}

export interface InspectedNode {
  runId: string;
  nodeId: string;
}

export interface NodeInspection {
  selectedNodeId: string | null;
  selectNode: (nodeId: string | null) => void;
}
