import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode, ModelRef } from '@flow/document/typedefs/flow.typedefs';
import type { ModelReference } from '@flow/references/typedefs/model-reference.typedefs';

const nodeModel = (node: FlowNode): ModelRef | null => {
  switch (node.type) {
    case NodeType.Agent:
    case NodeType.Completion:
      return node.config.model;
    default:
      return null;
  }
};

export const modelReferences = (flow: FlowDocument): readonly ModelReference[] =>
  flow.nodes.flatMap((node): readonly ModelReference[] => {
    const model = nodeModel(node);
    return model === null
      ? []
      : [
          {
            nodeId: node.id,
            nodeKey: node.key,
            nodeLabel: node.label,
            provider: model.provider,
            model: model.model,
          },
        ];
  });
