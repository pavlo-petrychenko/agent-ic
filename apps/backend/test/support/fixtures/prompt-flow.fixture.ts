import { ModelProviderKind, PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { AgentNode, FlowDocument, PromptPin, PromptSource } from '@agent-ic/flow';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';

export const libraryPromptSource = (
  promptRef: string,
  pin: PromptPin = { kind: PromptVersionKind.Latest },
  bindings: PromptSource['bindings'] = {},
): PromptSource => ({ kind: PromptSourceKind.Library, promptRef, pin, bindings });

export const agentWithLibraryPrompt = (
  id: string,
  key: string,
  promptRef: string,
  pin: PromptPin = { kind: PromptVersionKind.Latest },
  label: string | null = null,
  bindings: PromptSource['bindings'] = {},
): AgentNode => {
  const node = agentNode(id, key, {
    prompt: libraryPromptSource(promptRef, pin, bindings),
    model: { provider: { kind: ModelProviderKind.Platform }, model: LlmModelId.Ministral14b },
  });
  return label === null ? node : { ...node, label };
};

export const libraryPromptFlow = (nodes: readonly AgentNode[]): FlowDocument =>
  stepFlow(
    nodes,
    nodes.map((node) => flowEdge(TEST_NODE_ID, node.id)),
  );
