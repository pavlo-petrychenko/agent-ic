import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState } from '@/modules/conversations';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import {
  CREATE_AGENT_MUTATION,
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

  beforeAll(async () => {
    api = await startSubscriptionsApi();
    owner = await seedOwner(api);
  });

  afterAll(async () => {
    await stopSubscriptionsApi(api);
  });

  it('starts a simulation and reads it back with its runs and the last test run', async () => {
    const created = await graphql(CREATE_AGENT_MUTATION);
    const agentId = String(Object(created?.['createAgent'])['id']);

    const started = await graphql(startSimulationMutation(agentId));
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
});
