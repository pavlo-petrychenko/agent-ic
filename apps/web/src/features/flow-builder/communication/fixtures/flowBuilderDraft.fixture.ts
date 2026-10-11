import { ChannelSelectionMode, FLOW_SCHEMA_VERSION, NodeType } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type { MockLink } from '@apollo/client/testing';
import { RenameAgentDocument } from '@/features/flow-builder/communication/gql/mutation/renameAgent.generated';
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

export const DRAFT_REVISION = 4;

export const buildFlowBuilderDraftMock = (
  flow: unknown,
  revision = DRAFT_REVISION,
): MockLink.MockedResponse => ({
  request: { query: FlowBuilderDraftDocument, variables: { agentId: DEMO_AGENT_ID } },
  result: {
    data: {
      agent: {
        __typename: 'Agent',
        id: DEMO_AGENT_ID,
        name: 'Salon assistant',
        draftBaseVersionNumber: 3,
      },
      agentDraft: {
        __typename: 'AgentDraft',
        revision,
        version: { __typename: 'AgentVersion', id: 'ver_draft', flow },
      },
    },
  },
});

export const buildFlowBuilderDraftFailureMock = (): MockLink.MockedResponse => ({
  request: { query: FlowBuilderDraftDocument, variables: { agentId: DEMO_AGENT_ID } },
  error: new Error('offline'),
});

export const buildRenameAgentMock = (name: string): MockLink.MockedResponse => ({
  request: { query: RenameAgentDocument, variables: { input: { id: DEMO_AGENT_ID, name } } },
  result: { data: { renameAgent: { __typename: 'Agent', id: DEMO_AGENT_ID, name } } },
});
