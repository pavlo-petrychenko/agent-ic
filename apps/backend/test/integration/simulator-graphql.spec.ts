import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CountDraftChangesUseCase } from '@/modules/agents/use-cases/count-draft-changes.use-case';
import { ConversationState, MessageAuthor } from '@/modules/conversations';
import { GetRunTotalsUseCase } from '@/modules/runs/use-cases/get-run-totals.use-case';
import { ListLastSimulationRunsUseCase } from '@/modules/runs/use-cases/list-last-simulation-runs.use-case';
import { ListRunStepsUseCase } from '@/modules/runs/use-cases/list-run-steps.use-case';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import {
  AGENT_FIELDS_QUERY,
  CREATE_AGENT_MUTATION,
  handBackMutation,
  publishAgentMutation,
  replyAsOperatorMutation,
  restartSimulationMutation,
  SIMULATION_RUN_STEP_COUNTS,
  sendSimulatorMessageMutation,
  simulationRunsQuery,
  simulatorQuery,
  startSimulationMutation,
} from '@test/support/constants/simulator-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  replaceDraftFlow,
  seedOwner,
  seedSimulationRuns,
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

  const graphql = async (query: string, member: TestMember = owner) =>
    (
      await queryOverWebSocket(api.app, query, {
        [ConnectionParam.Authorization]: `Bearer ${member.accessToken}`,
        [ConnectionParam.WorkspaceId]: member.publicWorkspaceId,
      })
    ).data;

  const createAgent = async (member: TestMember = owner) =>
    String(Object((await graphql(CREATE_AGENT_MUTATION, member))?.['createAgent'])['id']);

  const startSimulation = async (member: TestMember = owner) => {
    const agentId = await createAgent(member);
    const started = await graphql(startSimulationMutation(agentId), member);
    const { conversation } = Object(started?.['startSimulation']);
    return { agentId, started, conversationId: String(Object(conversation)['id']) };
  };

  beforeAll(async () => {
    api = await startSubscriptionsApi();
    owner = await seedOwner(api);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('reads the steps and totals of every run with one batch per field', async () => {
    const { agentId, conversationId } = await startSimulation();
    const seeded = await seedSimulationRuns(
      api,
      owner,
      { agentId, conversationId },
      SIMULATION_RUN_STEP_COUNTS,
    );
    const listSteps = vi.spyOn(api.app.get(ListRunStepsUseCase), 'execute');
    const getTotals = vi.spyOn(api.app.get(GetRunTotalsUseCase), 'execute');

    const read = await graphql(simulationRunsQuery(agentId));

    const runs = seeded.map(({ id, stepCount }) => ({
      id,
      steps: Array.from({ length: stepCount }, () => ({ id: expect.any(String) })),
      totals: { stepsRun: stepCount },
    }));
    const listed = Object(read?.['simulation'])['runs'];
    expect(listed).toHaveLength(runs.length);
    expect(listed).toEqual(expect.arrayContaining(runs));
    expect(listSteps).toHaveBeenCalledTimes(1);
    expect(getTotals).toHaveBeenCalledTimes(1);
  });

  it('reads the draft change count and the last test run of every agent with one batch per field', async () => {
    const member = await seedOwner(api);
    const tested = await startSimulation(member);
    const [lastRun] = await seedSimulationRuns(api, member, tested, [0]);
    const published = await createAgent(member);
    const untouched = await createAgent(member);
    await replaceDraftFlow(api, member, published, triggerFlow());
    const publish = await graphql(publishAgentMutation(published), member);
    const countChanges = vi.spyOn(api.app.get(CountDraftChangesUseCase), 'execute');
    const listLastRuns = vi.spyOn(api.app.get(ListLastSimulationRunsUseCase), 'execute');

    const read = await graphql(AGENT_FIELDS_QUERY, member);

    const nodes = Object(read?.['agents'])['edges'].map(({ node }: { node: unknown }) => node);
    expect(publish).toEqual({ publishAgent: { agent: { id: published, draftChangeCount: 0 } } });
    expect(nodes).toHaveLength(3);
    expect(nodes).toEqual(
      expect.arrayContaining([
        { id: tested.agentId, draftChangeCount: 1, lastSimulationRun: { id: lastRun?.id } },
        { id: published, draftChangeCount: 0, lastSimulationRun: null },
        { id: untouched, draftChangeCount: 1, lastSimulationRun: null },
      ]),
    );
    expect(countChanges).toHaveBeenCalledTimes(1);
    expect(listLastRuns).toHaveBeenCalledTimes(1);
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
