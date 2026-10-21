import { NodeType, PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { FlowDocument, PromptSource } from '@agent-ic/flow';
import type { InlineStepPrompt } from '@/modules/prompts/typedefs/inline-prompt.typedefs';

const librarySource = (promptRef: string): PromptSource => ({
  kind: PromptSourceKind.Library,
  promptRef,
  pin: { kind: PromptVersionKind.Latest },
});

export const inlineStepPrompts = (flow: FlowDocument): readonly InlineStepPrompt[] =>
  flow.nodes.flatMap((node) => {
    if (node.type !== NodeType.Agent && node.type !== NodeType.Completion) {
      return [];
    }
    const { prompt } = node.config;
    return prompt !== null && prompt.kind === PromptSourceKind.Inline
      ? [{ nodeId: node.id, nodeLabel: node.label, text: prompt.text }]
      : [];
  });

export const withLibraryStepPrompts = (
  flow: FlowDocument,
  refs: ReadonlyMap<string, string>,
): FlowDocument => ({
  ...flow,
  nodes: flow.nodes.map((node) => {
    const promptRef = refs.get(node.id);
    if (promptRef === undefined) {
      return node;
    }
    switch (node.type) {
      case NodeType.Agent:
        return { ...node, config: { ...node.config, prompt: librarySource(promptRef) } };
      case NodeType.Completion:
        return { ...node, config: { ...node.config, prompt: librarySource(promptRef) } };
      default:
        return node;
    }
  }),
});
