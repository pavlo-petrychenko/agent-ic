import type { MockLink } from '@apollo/client/testing';
import { TestingAgentsDocument } from '@/features/testing/communication/gql/query/testingAgents.generated';
import { TestingVersionsDocument } from '@/features/testing/communication/gql/query/testingVersions.generated';
import { TESTING_AGENTS_PAGE_SIZE } from '@/features/testing/constants/testing.constants';
import { AgentVersionStatus, FlowIssueSeverity } from '@/shared/api/generated/schema.generated';

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
        },
      ],
      agentDraft: {
        __typename: 'AgentDraft',
        issues: draftBroken ? [{ __typename: 'FlowIssue', severity: FlowIssueSeverity.Error }] : [],
      },
    },
  },
});

export const failedTestingVersionsMock: MockLink.MockedResponse = {
  request: { query: TestingVersionsDocument, variables: { agentId: TEST_AGENT_ID } },
  error: new Error('offline'),
};
