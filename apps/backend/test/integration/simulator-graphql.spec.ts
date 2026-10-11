import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState, MessageAuthor } from '@/modules/conversations';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import {
  CREATE_AGENT_MUTATION,
  handBackMutation,
  replyAsOperatorMutation,
  restartSimulationMutation,
  sendSimulatorMessageMutation,
  simulatorQuery,
  startSimulationMutation,
} from '@test/support/constants/simulator-testing.constants';
import {
  seedOwner,
  startSubscriptionsApi,
  stopSubscriptionsApi,
} from '@test/support/helpers/graphql-subscriptions.helpers';
import { queryOverWebSocket } from '@test/support/helpers/request-layer.helpers';
import type {
  SubscriptionsApi,
  TestMember,
} from '@test/support/typedefs/graphql-subscriptions.typedefs';

describe('the simulator through graphql', () => {
  let api: SubscriptionsApi;
  let owner: TestMember;

  const graphql = async (query: string) =>
    (
      await queryOverWebSocket(api.app, query, {
        [ConnectionParam.Authorization]: `Bearer ${owner.accessToken}`,
        [ConnectionParam.WorkspaceId]: owner.publicWorkspaceId,
      })
    ).data;

  const startSimulation = async () => {
    const created = await graphql(CREATE_AGENT_MUTATION);
    const agentId = String(Object(created?.['createAgent'])['id']);
    const started = await graphql(startSimulationMutation(agentId));
    const { conversation } = Object(started?.['startSimulation']);
    return { agentId, started, conversationId: String(Object(conversation)['id']) };
  };

  beforeAll(async () => {
    api = await startSubscriptionsApi();
    owner = await seedOwner(api);
  });

  afterAll(async () => {
    await stopSubscriptionsApi(api);
  });

  it('starts a simulation and reads it back with its runs and the last test run', async () => {
    const { agentId, started } = await startSimulation();
    const read = await graphql(simulatorQuery(agentId));

    expect(started).toEqual({
      startSimulation: {
        conversation: { id: expect.any(String), state: ConversationState.AgentActive },
      },
    });
    expect(read).toEqual({
      simulation: { messages: [], runs: [] },
      agent: { lastSimulationRun: null },
    });
  });

  it('sends a message, replies as an operator, hands back and restarts', async () => {
    const { agentId, conversationId } = await startSimulation();

    const sent = await graphql(sendSimulatorMessageMutation(conversationId));
    const replied = await graphql(replyAsOperatorMutation(conversationId));
    const handedBack = await graphql(handBackMutation(conversationId));
    const restarted = await graphql(restartSimulationMutation(agentId));

    expect(sent).toEqual({ sendSimulatorMessage: { author: MessageAuthor.Customer, runId: null } });
    expect(replied).toEqual({ replyAsOperator: { author: MessageAuthor.Operator, runId: null } });
    expect(handedBack).toEqual({ handBack: { state: ConversationState.AgentActive } });
    expect(restarted).toEqual({
      restartSimulation: {
        conversation: {
          id: expect.not.stringMatching(conversationId),
          state: ConversationState.AgentActive,
        },
      },
    });
  });
});
