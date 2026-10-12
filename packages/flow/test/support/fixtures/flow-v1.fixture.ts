import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import {
  FIRST_SCHEMA_VERSION,
  FlowV1CompletionRole,
  type FlowV1WaitFor,
} from '@flow/versions/constants/version.constants';
import { flowV1DocumentSchema } from '@flow/versions/schemas/flow-v1.schema';
import type { FlowV1Document } from '@flow/versions/typedefs/version.typedefs';

export interface FlowV1Options {
  readonly observerKeys: readonly string[];
  readonly waitFor: FlowV1WaitFor;
}

const toV1Node = (node: FlowNode, options: FlowV1Options): unknown => {
  if (node.type === NodeType.Completion) {
    const role = options.observerKeys.includes(node.key)
      ? FlowV1CompletionRole.Observer
      : FlowV1CompletionRole.Guard;
    return { ...node, config: { ...node.config, role } };
  }
  return node.type === NodeType.Parallel ? { ...node, config: { waitFor: options.waitFor } } : node;
};

export const toFlowV1Json = (flow: FlowDocument, options: FlowV1Options): unknown => ({
  schemaVersion: FIRST_SCHEMA_VERSION,
  nodes: flow.nodes.map((node) => toV1Node(node, options)),
  edges: flow.edges.map(({ background: _background, ...edge }) => edge),
});

export const toFlowV1 = (flow: FlowDocument, options: FlowV1Options): FlowV1Document =>
  flowV1DocumentSchema.parse(toFlowV1Json(flow, options));
