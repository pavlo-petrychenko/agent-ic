import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode, PromptSource } from '@flow/document/typedefs/flow.typedefs';
import { PromptSourceKind } from '@flow/references/constants/reference.constants';
import type { PromptReference } from '@flow/references/typedefs/prompt-reference.typedefs';

const nodePrompt = (node: FlowNode): PromptSource | null => {
  switch (node.type) {
    case NodeType.Agent:
    case NodeType.Completion:
      return node.config.prompt;
    default:
      return null;
  }
};

export const promptReferences = (flow: FlowDocument): readonly PromptReference[] =>
  flow.nodes.flatMap((node): readonly PromptReference[] => {
    const prompt = nodePrompt(node);
    return prompt !== null && prompt.kind === PromptSourceKind.Library
      ? [
          {
            nodeId: node.id,
            nodeKey: node.key,
            nodeLabel: node.label,
            promptRef: prompt.promptRef,
            pin: prompt.pin,
          },
        ]
      : [];
  });
