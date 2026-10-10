import type { FlowDocument, FlowEdge, FlowIssue, NodeType } from '@agent-ic/flow';
import type { SaveState } from '@/features/flow-builder/constants/saveState.constants';

export interface FlowPoint {
  x: number;
  y: number;
}

export interface FlowViewport extends FlowPoint {
  zoom: number;
}

export interface FlowSelection {
  nodeIds: readonly string[];
  edgeIds: readonly string[];
}

export interface FlowHistory {
  past: readonly FlowDocument[];
  future: readonly FlowDocument[];
}

export interface HistoryStep {
  document: FlowDocument;
  history: FlowHistory;
}

export interface CanvasNodeModel {
  id: string;
  key: string;
  type: NodeType;
  label: string;
  position: FlowPoint;
  hasInPort: boolean;
  outPorts: readonly string[];
  issues: readonly FlowIssue[];
}

export interface CanvasModel {
  nodes: readonly CanvasNodeModel[];
  edges: readonly FlowEdge[];
}

export interface FlowDraft {
  document: FlowDocument;
  revision: number;
  issues: readonly FlowIssue[];
}

export interface FlowBuilderState {
  document: FlowDocument;
  revision: number;
  selection: FlowSelection;
  viewport: FlowViewport;
  history: FlowHistory;
  saveState: SaveState;
  issues: readonly FlowIssue[];
}

export interface FlowBuilderActions {
  load: (draft: FlowDraft) => void;
  apply: (document: FlowDocument) => void;
  undo: () => void;
  redo: () => void;
  select: (selection: FlowSelection) => void;
  setViewport: (viewport: FlowViewport) => void;
  setSaveState: (saveState: SaveState) => void;
  markSaved: (revision: number, issues: readonly FlowIssue[], savedDocument: FlowDocument) => void;
}

export type FlowBuilderStore = FlowBuilderState & FlowBuilderActions;
