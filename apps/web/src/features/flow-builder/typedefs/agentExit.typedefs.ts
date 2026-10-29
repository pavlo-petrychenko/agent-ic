import type { AgentExitKind, FlowDocument, FlowIssue } from '@agent-ic/flow';
import type { PortTarget } from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface AgentExitView {
  kind: AgentExitKind;
  when: string | null;
  whenIssue: FlowIssue | null;
  secondMessageFrom: string | null;
  targets: readonly PortTarget[];
}

export interface AgentExitsView {
  exits: readonly AgentExitView[];
  inBackground: boolean;
  onToggle: (kind: AgentExitKind, on: boolean) => void;
  onWhenChange: (kind: AgentExitKind, when: string) => void;
  onCommit: () => void;
}

export interface ExitStepLabels {
  send: string;
  finish: string;
}

export interface CustomizedExit {
  document: FlowDocument;
  nodeIds: readonly string[];
}
