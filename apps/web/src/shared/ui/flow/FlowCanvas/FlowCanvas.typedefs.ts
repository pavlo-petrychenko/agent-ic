import type { Edge, Node } from '@xyflow/react';
import type { ReactNode } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { FlowPortKeyboard } from '@/shared/ui/flow/FlowPort/FlowPort.typedefs';
import type { ZoomControlLabels } from '@/shared/ui/flow/ZoomControl/ZoomControl.typedefs';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface FlowCanvasPoint {
  x: number;
  y: number;
}

export interface FlowCanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface FlowCanvasPort {
  id: string;
  ariaLabel: string;
  label?: string | null;
  labelActive?: boolean;
}

export interface FlowCanvasNodeSlots {
  inPort: ReactNode | null;
  outPorts: ReactNode | null;
  selected: boolean;
  faded: boolean;
}

export interface FlowCanvasNode {
  id: string;
  label: string;
  position: FlowCanvasPoint;
  hasInPort: boolean;
  outPorts: readonly FlowCanvasPort[];
  render: (slots: FlowCanvasNodeSlots) => ReactNode;
}

export interface FlowCanvasEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  active?: boolean;
}

export interface FlowCanvasConnection {
  source: string;
  sourcePort: string;
  target: string;
}

export interface FlowCanvasSelection {
  nodeIds: readonly string[];
  edgeIds: readonly string[];
}

export interface FlowCanvasNodeMove {
  id: string;
  position: FlowCanvasPoint;
  dragging: boolean;
}

export interface FlowCanvasPaletteDrop {
  data: string;
  position: FlowCanvasPoint;
  edgeId: string | null;
}

export interface FlowCanvasAddStepItem {
  id: string;
  label: string;
  kind: NodeKind;
  icon?: IconName | null;
}

export interface FlowCanvasAddStep {
  itemId: string;
  position: FlowCanvasPoint;
  source: string;
  sourcePort: string;
}

export interface FlowCanvasLabels {
  canvas: string;
  keyboardHelp: string;
  port: string;
  zoom: ZoomControlLabels;
  deleteConnection: string;
  selectionToolbar: string;
  selectionCount: (count: number) => string;
  duplicate: string;
  delete: string;
  clearSelection: string;
  deleted: string;
  undo: string;
  addStep: string;
  connectingTo: (name: string) => string;
  emptyTitle: string;
  emptyDescription: string | null;
  emptyAction: string;
}

export interface FlowCanvasProps {
  nodes: readonly FlowCanvasNode[];
  edges: readonly FlowCanvasEdge[];
  selection: FlowCanvasSelection;
  viewport: FlowCanvasViewport;
  labels: FlowCanvasLabels;
  addStepItems: readonly FlowCanvasAddStepItem[];
  canConnect: (source: string, target: string) => boolean;
  onViewportChange: (viewport: FlowCanvasViewport) => void;
  onNodesMove: (moves: readonly FlowCanvasNodeMove[]) => void;
  onSelectionChange: (selection: FlowCanvasSelection) => void;
  onConnect: (connection: FlowCanvasConnection) => void;
  onDelete: (selection: FlowCanvasSelection) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: (selection: FlowCanvasSelection) => void;
  onOpenNode: (id: string) => void;
  onPaletteDrop: (drop: FlowCanvasPaletteDrop) => void;
  onAddStep: (step: FlowCanvasAddStep) => void;
  onAddTrigger: () => void;
  className?: string;
}

export interface KeyboardConnection {
  source: string;
  sourcePort: string;
  targets: readonly string[];
  index: number;
}

export interface CanvasNodeData extends Record<string, unknown> {
  node: FlowCanvasNode;
  connectedPorts: ReadonlySet<string>;
  keyboardConnection: KeyboardConnection | null;
  canConnect: (source: string, target: string) => boolean;
  portKeyboard: (portId: string) => FlowPortKeyboard;
}

export interface CanvasEdgeData extends Record<string, unknown> {
  active: boolean;
  inserting: boolean;
  deleteLabel: string;
  onDelete: () => void;
}

export type CanvasNode = Node<CanvasNodeData>;
export type CanvasEdge = Edge<CanvasEdgeData>;

export interface AddStepMenuState {
  left: number;
  top: number;
  position: FlowCanvasPoint;
  source: string;
  sourcePort: string;
}
