import { ChannelSelectionMode, FLOW_SCHEMA_VERSION, NodeType } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import type { NewAgentVersion } from '@/modules/agents/typedefs/agent-version.typedefs';
import type { NewAgent } from '@/modules/agents/typedefs/agent.typedefs';
import {
  AGENTS_TEST_START,
  TEST_AGENT_NAME,
  TEST_NODE_ID,
  TEST_NODE_KEY,
  TEST_NODE_LABEL,
} from '@test/support/constants/agents-testing.constants';

export const emptyFlow = (): FlowDocument => ({
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [],
  edges: [],
});

export const triggerFlow = (label: string = TEST_NODE_LABEL): FlowDocument => ({
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    {
      id: TEST_NODE_ID,
      key: TEST_NODE_KEY,
      label,
      position: { x: 0, y: 0 },
      type: NodeType.TriggerMessage,
      config: { channels: { mode: ChannelSelectionMode.All } },
    },
  ],
  edges: [],
});

export const newAgent = (
  id: string,
  workspaceId: string,
  overrides: Partial<NewAgent> = {},
): NewAgent => ({
  id,
  workspaceId,
  name: TEST_AGENT_NAME,
  createdAt: AGENTS_TEST_START,
  updatedAt: AGENTS_TEST_START,
  ...overrides,
});

export const newVersion = (
  id: string,
  workspaceId: string,
  agentId: string,
  overrides: Partial<NewAgentVersion> = {},
): NewAgentVersion => ({
  id,
  workspaceId,
  agentId,
  kind: AgentVersionKind.Draft,
  flow: emptyFlow(),
  createdAt: AGENTS_TEST_START,
  updatedAt: AGENTS_TEST_START,
  ...overrides,
});
