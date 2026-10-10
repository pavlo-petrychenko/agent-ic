import type { FlowDocument, FlowEdge, FlowNode, NodeType } from '@agent-ic/flow';
import type { FlowPoint } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export type AddableNodeType = Exclude<
  NodeType,
  NodeType.TriggerExternalEvent | NodeType.TriggerSchedule
>;

export type NodeTemplates = {
  readonly [T in AddableNodeType]: Pick<Extract<FlowNode, { type: T }>, 'type' | 'config'>;
};

export type FlowConnection = Omit<FlowEdge, 'id'>;

export interface FlowNodeMove {
  id: string;
  position: FlowPoint;
}

export interface FlowDuplicate {
  document: FlowDocument;
  nodeIds: readonly string[];
}
