import {
  ChannelSelectionMode,
  FLOW_SCHEMA_VERSION,
  MessageContentKind,
  NodeType,
  PortName,
  QuickRepliesKind,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import type { MockLink } from '@apollo/client/testing';
import { TestingAgentsDocument } from '@/features/testing/communication/gql/query/testingAgents.generated';
import { TestingVersionsDocument } from '@/features/testing/communication/gql/query/testingVersions.generated';
import { TESTING_AGENTS_PAGE_SIZE } from '@/features/testing/constants/testing.constants';
import { AgentVersionStatus, FlowIssueSeverity } from '@/shared/api/generated/schema.generated';

export const TRIGGER_NODE_ID = 'node_trigger';
export const REPLY_NODE_ID = 'node_reply';

const TRACE_TRIGGER: FlowNode = {
  id: TRIGGER_NODE_ID,
  key: 'incoming',
  label: 'Incoming message',
  position: { x: 0, y: 0 },
  type: NodeType.TriggerMessage,
  config: { channels: { mode: ChannelSelectionMode.All } },
};

const TRACE_REPLY: FlowNode = {
  id: REPLY_NODE_ID,
  key: 'reply',
  label: 'Send replies',
  position: { x: 0, y: 0 },
  type: NodeType.SendMessage,
  config: {
    content: { kind: MessageContentKind.Text, text: 'Hi' },
    typing: true,
    waitForDelivery: false,
    quickReplies: { kind: QuickRepliesKind.None },
  },
};

export const TRACE_FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [TRACE_TRIGGER, TRACE_REPLY],
  edges: [
    { id: 'edge_1', source: TRIGGER_NODE_ID, sourcePort: PortName.Next, target: REPLY_NODE_ID },
  ],
};

export const TEST_AGENT_ID = 'agt_salon';
export const TEST_AGENT_NAME = 'Salon assistant';
export const TEST_WORKSPACE_ID = 'wsp_demo';
export const LIVE_VERSION_ID = 'ver_3';

export const testingAgentsMock = (
  agents: readonly { id: string; name: string }[] = [{ id: TEST_AGENT_ID, name: TEST_AGENT_NAME }],
): MockLink.MockedResponse => ({
  request: { query: TestingAgentsDocument, variables: { first: TESTING_AGENTS_PAGE_SIZE } },
  result: {
    data: {
      agents: {
        __typename: 'AgentConnection',
        edges: agents.map((agent) => ({
          __typename: 'AgentEdge',
          node: { __typename: 'Agent', ...agent, draftNumber: 4 },
        })),
      },
    },
  },
});

export const testingVersionsMock = (draftBroken = false): MockLink.MockedResponse => ({
  request: { query: TestingVersionsDocument, variables: { agentId: TEST_AGENT_ID } },
  result: {
    data: {
      agentVersions: [
        {
          __typename: 'AgentVersion',
          id: LIVE_VERSION_ID,
          number: 3,
          status: AgentVersionStatus.Live,
          flow: TRACE_FLOW,
        },
      ],
      agentDraft: {
        __typename: 'AgentDraft',
        issues: draftBroken ? [{ __typename: 'FlowIssue', severity: FlowIssueSeverity.Error }] : [],
        version: { __typename: 'AgentVersion', flow: TRACE_FLOW },
      },
    },
  },
});

export const failedTestingVersionsMock: MockLink.MockedResponse = {
  request: { query: TestingVersionsDocument, variables: { agentId: TEST_AGENT_ID } },
  error: new Error('offline'),
};
