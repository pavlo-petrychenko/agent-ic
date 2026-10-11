import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { ModelProviderKind, PortName, PromptSourceKind } from '@agent-ic/flow';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ChannelKind, ConversationMode, ConversationState } from '@/modules/conversations';
import { HandBackUseCase } from '@/modules/conversations/use-cases/hand-back.use-case';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { SendSimulatorMessageUseCase } from '@/modules/conversations/use-cases/send-simulator-message.use-case';
import { StartSimulationUseCase } from '@/modules/conversations/use-cases/start-simulation.use-case';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { TEST_NODE_ID, TEST_REPLY_TEXT } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  ESCALATION_NODE_ID,
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  ROUTER_NODE_ID,
  ROUTER_NODE_KEY,
  SEND_NODE_ID,
  SEND_NODE_KEY,
  TEST_AGENT_PROMPT,
  TEST_AGENT_REPLY,
  TEST_ORDER_INTENT,
  TEST_ORDER_RULE_ID,
  TEST_QUESTION_INTENT,
  TEST_RENDERED_NOTICE,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentNode,
  completionNode,
  escalateNode,
  flowEdge,
  intentRouterNode,
  sendListNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createRunsWorker,
  seedWorkerAgent,
  sendCustomerMessage,
  settleConversation,
} from '@test/support/helpers/runs-worker.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type { RunsWorker, WorkerAgent } from '@test/support/typedefs/runs-testing.typedefs';

const answeringFlow = stepFlow(
  [
    completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY),
    intentRouterNode(ROUTER_NODE_ID, ROUTER_NODE_KEY, TEST_STEP_NODE_KEY),
    agentNode(FIRST_STEP_ID, FIRST_STEP_KEY, {
      prompt: { kind: PromptSourceKind.Inline, text: TEST_AGENT_PROMPT },
      model: { provider: { kind: ModelProviderKind.Platform }, model: LlmModelId.Ministral14b },
    }),
    sendListNode(SEND_NODE_ID, SEND_NODE_KEY, `${FIRST_STEP_KEY}.messages`),
    escalateNode(),
  ],
  [
    flowEdge(TEST_NODE_ID, TEST_STEP_NODE_ID),
    flowEdge(TEST_STEP_NODE_ID, ROUTER_NODE_ID),
    flowEdge(ROUTER_NODE_ID, ESCALATION_NODE_ID, TEST_ORDER_RULE_ID),
    flowEdge(ROUTER_NODE_ID, FIRST_STEP_ID, PortName.Else),
    flowEdge(FIRST_STEP_ID, SEND_NODE_ID),
  ],
);

describe('the simulator end to end', () => {
  let mock: MockLlmService;
  let worker: RunsWorker;

  const simulate = async (agent: WorkerAgent) => {
    const ctx = workspaceCtx(worker.ids.generate(), agent.workspaceId, WorkspaceRole.Builder);
    const { conversation } = await worker.app.get(StartSimulationUseCase).execute(ctx, {
      agentId: worker.ids.toPublic(IdPrefix.Agent, agent.agentId),
      versionId: null,
      channelKind: ChannelKind.Simulated,
      language: null,
    });
    const id = worker.ids.fromPublic(IdPrefix.Conversation, conversation.id);
    const input = { conversationId: conversation.id };
    let sent = 0;
    const settle = async () => {
      sent += 1;
      return settleConversation(worker, agent, id, sent);
    };
    return {
      send: async (text: string) => {
        await worker.app.get(SendSimulatorMessageUseCase).execute(ctx, { ...input, text });
        return settle();
      },
      reply: async (text: string) => {
        await worker.app.get(ReplyAsOperatorUseCase).execute(ctx, { ...input, text });
        return settle();
      },
      handBack: () => worker.app.get(HandBackUseCase).execute(ctx, input),
    };
  };

  const editDraft = (agent: WorkerAgent) =>
    worker.tenants.run(agent.workspaceId, async () => {
      const draft = await worker.versions.findDraft(agent.workspaceId, agent.agentId);
      if (draft === null) {
        throw new MissingTestDataError(agent.agentId);
      }
      const changes = { flow: triggerFlow(), note: null, authorId: worker.ids.generate() };
      const at = worker.clock.now();
      await worker.versions.updateDraft(agent.workspaceId, draft.id, draft.revision, changes, at);
    });

  beforeAll(async () => {
    mock = await startMockLlm();
    worker = await createRunsWorker(mock.url, TestRedisPrefix.SimulatorWorker);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await worker.app.close();
    await mock.stop();
  });

  it('runs each message on a snapshot of the draft as it is then', async () => {
    const agent = await seedWorkerAgent(worker, answeringFlow, false);
    const { send } = await simulate(agent);
    mock.json({ intent: TEST_QUESTION_INTENT }).json({ messages: [TEST_AGENT_REPLY] });

    const first = await send(TEST_MESSAGE_TEXT);
    await editDraft(agent);
    const second = await send(TEST_MESSAGE_TEXT);

    expect(first.sent).toEqual([TEST_AGENT_REPLY]);
    expect(second.sent).toEqual([TEST_AGENT_REPLY, TEST_REPLY_TEXT]);
    expect(second.run?.mode).toBe(ConversationMode.Simulation);
    expect(second.run?.versionId).not.toBe(first.run?.versionId);
  });

  it('keeps live customers on the live version while the draft is simulated', async () => {
    const agent = await seedWorkerAgent(worker, answeringFlow, true);
    await editDraft(agent);
    const { send } = await simulate(agent);
    mock.json({ intent: TEST_QUESTION_INTENT }).json({ messages: [TEST_AGENT_REPLY] });

    const simulated = await send(TEST_MESSAGE_TEXT);
    const live = await sendCustomerMessage(worker, agent);
    const answered = await settleConversation(worker, agent, live.conversationId, 1);

    expect(simulated.sent).toEqual([TEST_REPLY_TEXT]);
    expect(answered.sent).toEqual([TEST_AGENT_REPLY]);
    expect(answered.run?.versionId).toBe(agent.versionId);
  });

  it('escalates to the builder as operator, who answers and hands the chat back', async () => {
    const agent = await seedWorkerAgent(worker, answeringFlow, false);
    const simulation = await simulate(agent);
    mock
      .json({ intent: TEST_ORDER_INTENT })
      .json({ intent: TEST_QUESTION_INTENT })
      .json({ messages: [TEST_AGENT_REPLY] });

    const escalated = await simulation.send(TEST_MESSAGE_TEXT);
    const handled = await simulation.reply(TEST_REPLY_TEXT);
    const handedBack = await simulation.handBack();
    const answered = await simulation.send(TEST_MESSAGE_TEXT);

    expect(escalated.conversation.state).toBe(ConversationState.Waiting);
    expect(handled.conversation.state).toBe(ConversationState.Handled);
    expect(handedBack.state).toBe(ConversationState.AgentActive);
    expect(answered.sent).toEqual([TEST_RENDERED_NOTICE, TEST_REPLY_TEXT, TEST_AGENT_REPLY]);
  });
});
