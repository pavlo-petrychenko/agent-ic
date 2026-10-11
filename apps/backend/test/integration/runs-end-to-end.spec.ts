import { CompletionRole, ModelProviderKind, PortName, PromptSourceKind } from '@agent-ic/flow';
import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PauseMode } from '@/modules/agents';
import {
  ConversationMode,
  ConversationState,
  IncomingMessageOutcome,
} from '@/modules/conversations';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { TEST_AWAY_MESSAGE, TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  ESCALATION_NODE_ID,
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  ROUTER_NODE_ID,
  ROUTER_NODE_KEY,
  SEND_STEP_ID,
  SEND_STEP_KEY,
  TEST_AGENT_PROMPT,
  TEST_AGENT_REPLY,
  TEST_MERGED_TEXTS,
  TEST_ORDER_INTENT,
  TEST_ORDER_RULE_ID,
  TEST_QUESTION_INTENT,
  TEST_RENDERED_NOTICE,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import {
  agentNode,
  completionNode,
  escalateNode,
  flowEdge,
  intentRouterNode,
  sendListNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import {
  createRunsWorker,
  readConversation,
  seedWorkerAgent,
  sendCustomerMessage,
  settleConversation,
} from '@test/support/helpers/runs-worker.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type { RunsWorker, WorkerAgent } from '@test/support/typedefs/runs-testing.typedefs';

const answerer = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY, {
  prompt: { kind: PromptSourceKind.Inline, text: TEST_AGENT_PROMPT },
  model: { provider: { kind: ModelProviderKind.Platform }, model: LlmModelId.Ministral14b },
});

const flow = stepFlow(
  [
    completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, CompletionRole.Guard),
    intentRouterNode(ROUTER_NODE_ID, ROUTER_NODE_KEY, TEST_STEP_NODE_KEY),
    answerer,
    sendListNode(SEND_STEP_ID, SEND_STEP_KEY, `${FIRST_STEP_KEY}.messages`),
    escalateNode(),
  ],
  [
    flowEdge(TEST_NODE_ID, TEST_STEP_NODE_ID),
    flowEdge(TEST_STEP_NODE_ID, ROUTER_NODE_ID),
    flowEdge(ROUTER_NODE_ID, ESCALATION_NODE_ID, TEST_ORDER_RULE_ID),
    flowEdge(ROUTER_NODE_ID, FIRST_STEP_ID, PortName.Else),
    flowEdge(FIRST_STEP_ID, SEND_STEP_ID),
  ],
);

const missing = (): never => {
  throw new MissingTestDataError(TEST_MERGED_TEXTS.join());
};

const question = { intent: TEST_QUESTION_INTENT };
const answer = { messages: [TEST_AGENT_REPLY] };

describe('a run end to end', () => {
  let mock: MockLlmService;
  let worker: RunsWorker;

  const pauseAs = (mode: PauseMode) => ({
    mode,
    awayMessage: mode === PauseMode.AwayMessage ? TEST_AWAY_MESSAGE : null,
    pausedAt: worker.clock.now(),
  });

  const stepsOf = ({ workspaceId }: WorkerAgent, runId: string) =>
    worker.tenants.run(workspaceId, () => worker.steps.listByRun(workspaceId, runId));

  beforeAll(async () => {
    mock = await startMockLlm();
    worker = await createRunsWorker(mock.url);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await worker.app.close();
    await mock.stop();
  });

  it('answers a customer of a published agent through the simulated channel', async () => {
    const agent = await seedWorkerAgent(worker, flow, true);
    mock.json(question).json(answer);

    const { conversationId } = await sendCustomerMessage(worker, agent);

    const settled = await settleConversation(worker, agent, conversationId, 1);
    expect(settled.sent).toEqual([TEST_AGENT_REPLY]);
    expect(settled.conversation.state).toBe(ConversationState.AgentActive);
    expect(settled.run).toMatchObject({
      versionId: agent.versionId,
      mode: ConversationMode.Live,
      status: RunStatus.Succeeded,
    });
  });

  it('escalates to a person and leaves the conversation waiting', async () => {
    const agent = await seedWorkerAgent(worker, flow, true);
    mock.json({ intent: TEST_ORDER_INTENT });

    const { conversationId } = await sendCustomerMessage(worker, agent);

    const settled = await settleConversation(worker, agent, conversationId, 1);
    expect(settled.sent).toEqual([TEST_RENDERED_NOTICE]);
    expect(settled.conversation.state).toBe(ConversationState.Waiting);
    expect(settled.run?.status).toBe(RunStatus.Escalated);
    expect(mock.requests).toHaveLength(1);
  });

  it('routes the chat of an agent paused to the Inbox without a run', async () => {
    const agent = await seedWorkerAgent(worker, flow, true, pauseAs(PauseMode.Inbox));

    const { outcome, conversationId } = await sendCustomerMessage(worker, agent);

    const { conversation, run } = await readConversation(worker, agent, conversationId);
    expect(outcome).toBe(IncomingMessageOutcome.RoutedToInbox);
    expect(conversation.state).toBe(ConversationState.Waiting);
    expect(run).toBeNull();
    expect(mock.requests).toHaveLength(0);
  });

  it('sends the away message of a paused agent once and starts no run', async () => {
    const agent = await seedWorkerAgent(worker, flow, true, pauseAs(PauseMode.AwayMessage));

    const first = await sendCustomerMessage(worker, agent);
    const second = await sendCustomerMessage(worker, agent);

    const settled = await settleConversation(worker, agent, first.conversationId, 1);
    expect([first.outcome, second.outcome]).toEqual([
      IncomingMessageOutcome.AwayMessageQueued,
      IncomingMessageOutcome.Stored,
    ]);
    expect(settled.sent).toEqual([TEST_AWAY_MESSAGE]);
    expect(settled.run).toBeNull();
    expect(mock.requests).toHaveLength(0);
  });

  it('retries the run job when every model is down and delivers the reply once', async () => {
    const agent = await seedWorkerAgent(worker, flow, true);
    const down = HttpStatus.SERVICE_UNAVAILABLE;
    mock.json(question).fail(down).fail(down).json(answer);

    const { conversationId } = await sendCustomerMessage(worker, agent);

    const settled = await settleConversation(worker, agent, conversationId, 1);
    const steps = await stepsOf(agent, String(settled.run?.id));
    const attempts = (nodeId: string) => steps.find((step) => step.nodeId === nodeId)?.attempt;
    expect(settled.sent).toEqual([TEST_AGENT_REPLY]);
    expect(settled.run?.status).toBe(RunStatus.Succeeded);
    expect(mock.requests).toHaveLength(4);
    expect([attempts(TEST_STEP_NODE_ID), attempts(FIRST_STEP_ID)]).toEqual([1, 2]);
  });

  it('answers messages that arrive together in one run', async () => {
    const agent = await seedWorkerAgent(worker, flow, true);
    const queue = worker.queues.get(QueueName.RunsReactive);
    mock.json(question).json(answer);

    await queue.pause();
    let last = null;
    for (const text of TEST_MERGED_TEXTS) {
      last = await sendCustomerMessage(worker, agent, { text });
    }
    await queue.resume();

    const { conversationId, messageId } = last ?? missing();
    const settled = await settleConversation(worker, agent, conversationId, 1);
    expect(settled.sent).toEqual([TEST_AGENT_REPLY]);
    expect(settled.run?.lastCoveredMessageId).toBe(messageId);
    expect(mock.requests).toHaveLength(2);
    for (const text of TEST_MERGED_TEXTS) {
      expect(JSON.stringify(mock.body(0))).toContain(text);
    }
  });

  it('runs a simulation on a snapshot of the draft, even while the agent is paused', async () => {
    const agent = await seedWorkerAgent(worker, flow, false, pauseAs(PauseMode.Inbox));
    const snapshot = await worker.tenants.run(agent.workspaceId, () =>
      worker.reader.snapshotDraft(agent.workspaceId, agent.agentId),
    );
    mock.json(question).json(answer);

    const { conversationId } = await sendCustomerMessage(worker, agent, {
      mode: ConversationMode.Simulation,
      versionId: snapshot.id,
    });

    const settled = await settleConversation(worker, agent, conversationId, 1);
    expect(settled.sent).toEqual([TEST_AGENT_REPLY]);
    expect(settled.run).toMatchObject({
      versionId: snapshot.id,
      mode: ConversationMode.Simulation,
      status: RunStatus.Succeeded,
    });
  });
});
