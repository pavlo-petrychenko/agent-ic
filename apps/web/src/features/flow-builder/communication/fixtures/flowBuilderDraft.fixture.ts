import { ChannelSelectionMode, FLOW_SCHEMA_VERSION, NodeType } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type { MockLink } from '@apollo/client/testing';
import { FlowBuilderDraftDocument } from '@/features/flow-builder/communication/gql/query/flowBuilderDraft.generated';

export const DEMO_AGENT_ID = 'agt_demo';

export const TRIGGER_ONLY_FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    {
      id: 'trigger',
      key: 'trigger',
      label: 'Customer message',
      position: { x: 0, y: 0 },
      type: NodeType.TriggerMessage,
      config: { channels: { mode: ChannelSelectionMode.All } },
    },
  ],
  edges: [],
};

export const buildFlowBuilderDraftMock = (flow: unknown): MockLink.MockedResponse => ({
  request: { query: FlowBuilderDraftDocument, variables: { agentId: DEMO_AGENT_ID } },
  result: {
    data: {
      agent: { __typename: 'Agent', id: DEMO_AGENT_ID, name: 'Salon assistant' },
      agentDraft: {
        __typename: 'AgentDraft',
        revision: 4,
        version: { __typename: 'AgentVersion', id: 'ver_draft', flow },
      },
    },
  },
});

export const buildFlowBuilderDraftFailureMock = (): MockLink.MockedResponse => ({
  request: { query: FlowBuilderDraftDocument, variables: { agentId: DEMO_AGENT_ID } },
  error: new Error('offline'),
});
