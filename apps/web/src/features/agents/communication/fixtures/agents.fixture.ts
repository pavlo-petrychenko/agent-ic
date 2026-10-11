import { ErrorCode, type ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { CreateAgentDocument } from '@/features/agents/communication/gql/mutation/createAgent.generated';
import { DeleteAgentDocument } from '@/features/agents/communication/gql/mutation/deleteAgent.generated';
import { DuplicateAgentDocument } from '@/features/agents/communication/gql/mutation/duplicateAgent.generated';
import { PauseAgentDocument } from '@/features/agents/communication/gql/mutation/pauseAgent.generated';
import { ResumeAgentDocument } from '@/features/agents/communication/gql/mutation/resumeAgent.generated';
import {
  AgentsDocument,
  type AgentsQuery,
} from '@/features/agents/communication/gql/query/agents.generated';
import { AGENTS_PAGE_SIZE } from '@/features/agents/constants/agentList.constants';
import { AgentStatus, type PauseMode } from '@/shared/api/generated/schema.generated';

type AgentFixture = AgentsQuery['agents']['edges'][number]['node'];

export const NEW_AGENT_ID = 'agt_new';

export const SALON_ASSISTANT: AgentFixture = {
  id: 'agt_1',
  name: 'Salon assistant',
  description: 'Answers questions about services, prices and hours',
  status: AgentStatus.Live,
  liveVersionNumber: 3,
  draftNumber: 4,
  hasUnpublishedChanges: true,
  versionCount: 4,
};

export const GIFT_CARD_FAQ: AgentFixture = {
  id: 'agt_2',
  name: 'Gift card FAQ',
  description: null,
  status: AgentStatus.Paused,
  liveVersionNumber: 5,
  draftNumber: 6,
  hasUnpublishedChanges: false,
  versionCount: 5,
};

export const REVIEW_COLLECTOR: AgentFixture = {
  id: 'agt_3',
  name: 'Review collector',
  description: 'Asks for a review after a completed visit',
  status: AgentStatus.Draft,
  liveVersionNumber: null,
  draftNumber: 1,
  hasUnpublishedChanges: true,
  versionCount: 1,
};

const toEdge = (agent: AgentFixture) => ({
  __typename: 'AgentEdge',
  cursor: `cursor_${agent.id}`,
  node: { __typename: 'Agent', ...agent },
});

export const buildAgentsMock = (
  agents: readonly AgentFixture[],
  { after = null, hasNextPage = false }: { after?: string | null; hasNextPage?: boolean } = {},
): MockLink.MockedResponse => ({
  request: { query: AgentsDocument, variables: { first: AGENTS_PAGE_SIZE, after } },
  result: {
    data: {
      agents: {
        __typename: 'AgentConnection',
        edges: agents.map(toEdge),
        pageInfo: {
          __typename: 'PageInfo',
          endCursor: agents.length === 0 ? null : `cursor_${agents[agents.length - 1]?.id}`,
          hasNextPage,
        },
      },
    },
  },
});

export const buildAgentsFailureMock = (
  error: Error,
  after: string | null = null,
): MockLink.MockedResponse => ({
  request: { query: AgentsDocument, variables: { first: AGENTS_PAGE_SIZE, after } },
  error,
});

export const buildCreateAgentMock = (name: string): MockLink.MockedResponse => ({
  request: { query: CreateAgentDocument, variables: { input: { name } } },
  result: { data: { createAgent: { __typename: 'Agent', id: NEW_AGENT_ID } } },
});

export const buildCreateAgentFailureMock = (
  name: string,
  error: Error,
): MockLink.MockedResponse => ({
  request: { query: CreateAgentDocument, variables: { input: { name } } },
  error,
});

const PAUSED_AT = '2026-10-10T09:00:00.000Z';

export const buildPauseAgentMock = (
  id: string,
  mode: PauseMode,
  awayMessage: string | null,
): MockLink.MockedResponse => ({
  request: { query: PauseAgentDocument, variables: { input: { id, mode, awayMessage } } },
  result: {
    data: {
      pauseAgent: {
        __typename: 'Agent',
        id,
        status: AgentStatus.Paused,
        pausedAt: PAUSED_AT,
        pauseMode: mode,
        awayMessage,
      },
    },
  },
});

export const buildPauseAgentFailureMock = (
  id: string,
  mode: PauseMode,
  awayMessage: string | null,
  error: Error,
): MockLink.MockedResponse => ({
  request: { query: PauseAgentDocument, variables: { input: { id, mode, awayMessage } } },
  error,
});

export const buildPauseAgentReasonFailureMock = (
  id: string,
  mode: PauseMode,
  awayMessage: string | null,
  reason: ErrorReason,
): MockLink.MockedResponse => ({
  request: { query: PauseAgentDocument, variables: { input: { id, mode, awayMessage } } },
  result: {
    errors: [
      new GraphQLError('rejected', { extensions: { code: ErrorCode.BadUserInput, reason } }),
    ],
  },
});

export const buildResumeAgentMock = (id: string): MockLink.MockedResponse => ({
  request: { query: ResumeAgentDocument, variables: { input: { id } } },
  result: {
    data: {
      resumeAgent: {
        __typename: 'Agent',
        id,
        status: AgentStatus.Live,
        pausedAt: null,
        pauseMode: null,
        awayMessage: null,
      },
    },
  },
});

export const buildDeleteAgentMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeleteAgentDocument, variables: { input: { id } } },
  result: { data: { deleteAgent: { __typename: 'DeleteAgentPayload', id } } },
});

export const buildDeleteAgentFailureMock = (id: string, error: Error): MockLink.MockedResponse => ({
  request: { query: DeleteAgentDocument, variables: { input: { id } } },
  error,
});

export const buildDuplicateAgentMock = (id: string, name: string): MockLink.MockedResponse => ({
  request: { query: DuplicateAgentDocument, variables: { input: { id } } },
  result: { data: { duplicateAgent: { __typename: 'Agent', id: `${id}_copy`, name } } },
});

export const buildResumeAgentFailureMock = (id: string, error: Error): MockLink.MockedResponse => ({
  request: { query: ResumeAgentDocument, variables: { input: { id } } },
  error,
});

export const buildDuplicateAgentFailureMock = (
  id: string,
  error: Error,
): MockLink.MockedResponse => ({
  request: { query: DuplicateAgentDocument, variables: { input: { id } } },
  error,
});
