import { Locale } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { TEST_AGENT_ID } from '@/features/testing/communication/fixtures/testing.fixture';
import { HandBackDocument } from '@/features/testing/communication/gql/mutation/handBack.generated';
import { ReplyAsOperatorDocument } from '@/features/testing/communication/gql/mutation/replyAsOperator.generated';
import { RestartSimulationDocument } from '@/features/testing/communication/gql/mutation/restartSimulation.generated';
import { SendSimulatorMessageDocument } from '@/features/testing/communication/gql/mutation/sendSimulatorMessage.generated';
import { StartSimulationDocument } from '@/features/testing/communication/gql/mutation/startSimulation.generated';
import { SimulationDocument } from '@/features/testing/communication/gql/query/simulation.generated';
import {
  ChannelKind,
  ConversationState,
  MessageAuthor,
  RunStatus,
} from '@/shared/api/generated/schema.generated';

export const TEST_CONVERSATION_ID = 'cnv_test';
export const TEST_RUN_ID = 'run_one';

const simulation = (id: string) => ({
  __typename: 'Simulation',
  conversation: { __typename: 'Conversation', id },
});

export const startSimulationMock = (
  language: Locale = Locale.En,
  versionId: string | null = null,
): MockLink.MockedResponse => ({
  request: {
    query: StartSimulationDocument,
    variables: {
      input: { agentId: TEST_AGENT_ID, versionId, channelKind: ChannelKind.Simulated, language },
    },
  },
  result: { data: { startSimulation: simulation(TEST_CONVERSATION_ID) } },
});

export const restartSimulationMock: MockLink.MockedResponse = {
  request: { query: RestartSimulationDocument, variables: { input: { agentId: TEST_AGENT_ID } } },
  result: { data: { restartSimulation: simulation(TEST_CONVERSATION_ID) } },
};

const message = (id: string, author: MessageAuthor, text: string, second: number) => ({
  __typename: 'Message',
  id,
  author,
  text,
  runId: author === MessageAuthor.Agent ? TEST_RUN_ID : null,
  createdAt: `2026-10-11T10:00:0${second}Z`,
});

export const QUESTION = message('msg_q', MessageAuthor.Customer, 'How long is a manicure?', 0);
export const ANSWERS = [
  message('msg_a1', MessageAuthor.Agent, 'About 75 minutes.', 2),
  message('msg_a2', MessageAuthor.Agent, 'Anything else?', 3),
];

export const ESCALATION_QUESTION = message('msg_e', MessageAuthor.Customer, 'I want a manager.', 0);
export const ESCALATION_MESSAGE = message(
  'msg_e1',
  MessageAuthor.Agent,
  'Bringing in our manager.',
  2,
);
export const OPERATOR_REPLY = message('msg_o', MessageAuthor.Operator, 'Hi, I am the manager.', 4);

export const simulationMock = (
  messages: readonly ReturnType<typeof message>[],
  runStatus: RunStatus | null = RunStatus.Succeeded,
  errorMessage: string | null = null,
  state: ConversationState = ConversationState.AgentActive,
): MockLink.MockedResponse => ({
  request: { query: SimulationDocument, variables: { agentId: TEST_AGENT_ID } },
  result: {
    data: {
      simulation: {
        __typename: 'Simulation',
        conversation: {
          __typename: 'Conversation',
          id: TEST_CONVERSATION_ID,
          state,
        },
        messages,
        runs:
          runStatus === null
            ? []
            : [
                {
                  __typename: 'Run',
                  id: TEST_RUN_ID,
                  status: runStatus,
                  createdAt: '2026-10-11T10:00:01Z',
                  error:
                    errorMessage === null
                      ? null
                      : { __typename: 'RunFailure', message: errorMessage },
                },
              ],
      },
    },
  },
});

export const sendSimulatorMessageMock = (text: string): MockLink.MockedResponse => ({
  request: {
    query: SendSimulatorMessageDocument,
    variables: { input: { conversationId: TEST_CONVERSATION_ID, text } },
  },
  result: { data: { sendSimulatorMessage: { __typename: 'Message', id: QUESTION.id } } },
});

export const replyAsOperatorMock = (text: string): MockLink.MockedResponse => ({
  request: {
    query: ReplyAsOperatorDocument,
    variables: { input: { conversationId: TEST_CONVERSATION_ID, text } },
  },
  result: { data: { replyAsOperator: { __typename: 'Message', id: OPERATOR_REPLY.id } } },
});

const handBackRequest = {
  query: HandBackDocument,
  variables: { input: { conversationId: TEST_CONVERSATION_ID } },
};

export const failedHandBackMock: MockLink.MockedResponse = {
  request: handBackRequest,
  error: new Error('offline'),
};

export const handBackMock: MockLink.MockedResponse = {
  request: handBackRequest,
  result: {
    data: {
      handBack: {
        __typename: 'Conversation',
        id: TEST_CONVERSATION_ID,
        state: ConversationState.AgentActive,
      },
    },
  },
};
