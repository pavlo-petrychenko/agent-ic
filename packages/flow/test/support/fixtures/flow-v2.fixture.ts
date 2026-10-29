import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { SECOND_SCHEMA_VERSION } from '@flow/versions/constants/version.constants';
import { flowV2DocumentSchema } from '@flow/versions/schemas/flow-v2.schema';
import type { FlowV2Document, FlowV2Node } from '@flow/versions/typedefs/version.typedefs';

export const toV2Node = (node: FlowNode): FlowV2Node => {
  if (node.type === NodeType.TriggerInactivity) {
    throw new Error('a version 2 flow has no inactivity trigger');
  }
  if (node.type !== NodeType.Agent) {
    return node;
  }
  const { exits: _exits, ...config } = node.config;
  return { ...node, config };
};

export const toFlowV2Json = (flow: FlowDocument): unknown => ({
  schemaVersion: SECOND_SCHEMA_VERSION,
  nodes: flow.nodes.map(toV2Node),
  edges: flow.edges,
});

export const toFlowV2 = (flow: FlowDocument): FlowV2Document =>
  flowV2DocumentSchema.parse(toFlowV2Json(flow));
