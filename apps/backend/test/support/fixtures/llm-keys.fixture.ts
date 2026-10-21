import { LlmKeyVendor } from '@agent-ic/contracts';
import { ModelProviderKind } from '@agent-ic/flow';
import type { AgentNode, FlowDocument } from '@agent-ic/flow';
import type { NewLlmKey } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  LLM_KEYS_TEST_START,
  TEST_KEY_MODEL,
  TEST_LLM_API_KEY_LAST4,
  TEST_LLM_KEY_SEALED,
} from '@test/support/constants/llm-keys-testing.constants';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';

export const newLlmKey = (
  id: string,
  workspaceId: string,
  createdBy: string,
  overrides: Partial<NewLlmKey> = {},
): NewLlmKey => ({
  id,
  workspaceId,
  vendor: LlmKeyVendor.OpenAi,
  name: 'OpenAI',
  baseUrl: null,
  sealedKey: TEST_LLM_KEY_SEALED,
  keyLast4: TEST_LLM_API_KEY_LAST4,
  fallbackToPlatform: false,
  createdBy,
  createdAt: LLM_KEYS_TEST_START,
  updatedAt: LLM_KEYS_TEST_START,
  ...overrides,
});

export const agentOnKey = (id: string, providerKeyId: string): AgentNode =>
  agentNode(id, id, {
    model: {
      provider: { kind: ModelProviderKind.Workspace, providerKeyId },
      model: TEST_KEY_MODEL,
    },
  });

export const agentOnPlatform = (id: string): AgentNode =>
  agentNode(id, id, {
    model: { provider: { kind: ModelProviderKind.Platform }, model: TEST_KEY_MODEL },
  });

export const keyModelFlow = (nodes: readonly AgentNode[]): FlowDocument =>
  stepFlow(
    nodes,
    nodes.map((node) => flowEdge(TEST_NODE_ID, node.id)),
  );
