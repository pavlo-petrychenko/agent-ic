import type { FlowEdge, FlowNode } from '@flow/document/typedefs/flow.typedefs';

export type Fields = Readonly<Record<string, unknown>>;

export interface FieldChange {
  readonly path: readonly string[];
  readonly before: unknown;
  readonly after: unknown;
}

export interface NodeChange {
  readonly nodeId: string;
  readonly key: string;
  readonly type: FlowNode['type'];
  readonly fields: readonly FieldChange[];
}

export interface KeyRename {
  readonly nodeId: string;
  readonly from: string;
  readonly to: string;
}

export interface FlowDiff {
  readonly addedNodes: readonly FlowNode[];
  readonly removedNodes: readonly FlowNode[];
  readonly changedNodes: readonly NodeChange[];
  readonly renamedKeys: readonly KeyRename[];
  readonly addedEdges: readonly FlowEdge[];
  readonly removedEdges: readonly FlowEdge[];
}
