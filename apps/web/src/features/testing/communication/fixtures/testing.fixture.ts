import {
  AgentExitKind,
  ChannelSelectionMode,
  EscalationMode,
  FLOW_SCHEMA_VERSION,
  FlowIssueCode,
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
  NO_FLOW_SETTINGS,
  MessageContentKind,
  NodeType,
  NotifyChannel,
  PortName,
  QuickRepliesKind,
  RecipientsKind,
  RetrievalMode,
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
  settings: NO_FLOW_SETTINGS,
  nodes: [TRACE_TRIGGER, TRACE_REPLY],
  edges: [
    { id: 'edge_1', source: TRIGGER_NODE_ID, sourcePort: PortName.Next, target: REPLY_NODE_ID },
  ],
};

const TRACE_ESCALATION: FlowNode = {
  id: REPLY_NODE_ID,
  key: 'escalate',
  label: 'Hand off to a person',
  position: { x: 0, y: 0 },
  type: NodeType.Escalation,
  config: {
    mode: EscalationMode.Escalate,
    customerMessage: null,
    reason: 'Asks for a manager',
    notify: {
      recipients: { kind: RecipientsKind.Operators },
      channels: [NotifyChannel.InPlatform],
    },
    reminderAfterMinutes: null,
    fallbackAfterMinutes: null,
    fallbackMessage: '',
  },
};

export const ESCALATION_TRACE_FLOW: FlowDocument = {
  ...TRACE_FLOW,
  nodes: [TRACE_TRIGGER, TRACE_ESCALATION],
};

const AGENT_NODE_ID = 'node_agent';

const TRACE_AGENT: FlowNode = {
  id: AGENT_NODE_ID,
  key: 'receptionist',
  label: 'Receptionist',
  position: { x: 0, y: 0 },
  type: NodeType.Agent,
  config: {
    prompt: null,
    model: null,
    reasoning: null,
    knowledgeBaseIds: [],
    retrievalMode: RetrievalMode.Tools,
    output: [],
    retries: 0,
    exits: { end: { when: 'The customer says goodbye' }, handoff: { when: 'Asks for a person' } },
  },
};

export const AGENT_EXIT_FLOW: FlowDocument = {
  ...TRACE_FLOW,
  settings: {
    ...NO_FLOW_SETTINGS,
    handoff: {
      notify: {
        recipients: { kind: RecipientsKind.Operators },
        channels: [NotifyChannel.InPlatform],
      },
      reminderAfterMinutes: null,
      fallbackAfterMinutes: null,
      fallbackMessage: '',
    },
    autoClose: { afterMinutes: 1440 },
  },
  nodes: [TRACE_TRIGGER, TRACE_AGENT, TRACE_REPLY],
  edges: [
    { id: 'edge_1', source: TRIGGER_NODE_ID, sourcePort: PortName.Next, target: AGENT_NODE_ID },
    { id: 'edge_2', source: AGENT_NODE_ID, sourcePort: AgentExitKind.End, target: REPLY_NODE_ID },
  ],
};

export const AGENT_TRACE_FLOW: FlowDocument = {
  ...AGENT_EXIT_FLOW,
  nodes: [TRACE_TRIGGER, { ...TRACE_AGENT, id: REPLY_NODE_ID }],
  edges: TRACE_FLOW.edges,
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

export const AUTO_CLOSE_FLOW: FlowDocument = {
  ...TRACE_FLOW,
  settings: { ...NO_FLOW_SETTINGS, autoClose: { afterMinutes: 1440 } },
};

const TRACE_INACTIVITY: FlowNode = {
  id: 'node_inactivity',
  key: 'inactivity',
  label: 'Inactivity',
  position: { x: 0, y: 0 },
  type: NodeType.TriggerInactivity,
  config: {
    silence: { amount: 2, unit: InactivityUnit.Hours },
    activity: InactivityActivity.Any,
    repeat: { kind: InactivityRepeatKind.Once },
    conditions: { notEscalated: true, channelTypes: [] },
  },
};

export const FOLLOW_UP_FLOW: FlowDocument = {
  ...AUTO_CLOSE_FLOW,
  nodes: [...TRACE_FLOW.nodes, TRACE_INACTIVITY],
};

const BLOCKING_ISSUES = [
  {
    __typename: 'FlowIssue',
    code: FlowIssueCode.MissingPrompt,
    severity: FlowIssueSeverity.Error,
    nodeId: REPLY_NODE_ID,
    edgeId: null,
    path: [],
    params: {},
  },
  {
    __typename: 'FlowIssue',
    code: FlowIssueCode.NoTrigger,
    severity: FlowIssueSeverity.Error,
    nodeId: null,
    edgeId: null,
    path: [],
    params: {},
  },
];

export const testingVersionsMock = (
  draftBroken = false,
  changeCount: number | null = 3,
  draftFlow: FlowDocument = TRACE_FLOW,
): MockLink.MockedResponse => ({
  request: { query: TestingVersionsDocument, variables: { agentId: TEST_AGENT_ID } },
  result: {
    data: {
      agent: { __typename: 'Agent', id: TEST_AGENT_ID, draftChangeCount: changeCount },
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
        issues: draftBroken ? BLOCKING_ISSUES : [],
        version: { __typename: 'AgentVersion', flow: draftFlow },
      },
    },
  },
});

export const failedTestingVersionsMock: MockLink.MockedResponse = {
  request: { query: TestingVersionsDocument, variables: { agentId: TEST_AGENT_ID } },
  error: new Error('offline'),
};
