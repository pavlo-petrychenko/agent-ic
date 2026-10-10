import {
  ChannelSelectionMode,
  FailureMode,
  FLOW_SCHEMA_VERSION,
  HttpMethod,
  MessageContentKind,
  NodeType,
  PortName,
  QuickRepliesKind,
  RequestAuthKind,
  RequestBodyKind,
} from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import type { NewAgentVersion } from '@/modules/agents/typedefs/agent-version.typedefs';
import type { NewAgent } from '@/modules/agents/typedefs/agent.typedefs';
import {
  AGENTS_TEST_START,
  TEST_AGENT_NAME,
  TEST_API_BODY_TEMPLATE,
  TEST_API_HEADER_NAME,
  TEST_API_HEADER_TEMPLATE,
  TEST_API_NODE_ID,
  TEST_API_NODE_KEY,
  TEST_API_TIMEOUT_SECONDS,
  TEST_NODE_ID,
  TEST_NODE_KEY,
  TEST_NODE_LABEL,
  TEST_REPLY_EDGE_ID,
  TEST_REPLY_NODE_ID,
  TEST_REPLY_NODE_KEY,
  TEST_REPLY_TEXT,
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
    {
      id: TEST_REPLY_NODE_ID,
      key: TEST_REPLY_NODE_KEY,
      label: TEST_REPLY_NODE_KEY,
      position: { x: 0, y: 0 },
      type: NodeType.SendMessage,
      config: {
        content: { kind: MessageContentKind.Text, text: TEST_REPLY_TEXT },
        typing: true,
        waitForDelivery: false,
        quickReplies: { kind: QuickRepliesKind.None },
      },
    },
  ],
  edges: [
    {
      id: TEST_REPLY_EDGE_ID,
      source: TEST_NODE_ID,
      sourcePort: PortName.Next,
      target: TEST_REPLY_NODE_ID,
    },
  ],
});

export const apiRequestFlow = (url: string): FlowDocument => {
  const flow = triggerFlow();
  return {
    ...flow,
    nodes: [
      ...flow.nodes,
      {
        id: TEST_API_NODE_ID,
        key: TEST_API_NODE_KEY,
        label: TEST_API_NODE_KEY,
        position: { x: 0, y: 0 },
        type: NodeType.ApiRequest,
        config: {
          method: HttpMethod.Post,
          url,
          headers: [{ name: TEST_API_HEADER_NAME, value: TEST_API_HEADER_TEMPLATE }],
          body: { kind: RequestBodyKind.Json, content: TEST_API_BODY_TEMPLATE },
          auth: { kind: RequestAuthKind.None },
          timeoutSeconds: TEST_API_TIMEOUT_SECONDS,
          retries: 0,
          onFailure: FailureMode.Continue,
        },
      },
    ],
  };
};

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
