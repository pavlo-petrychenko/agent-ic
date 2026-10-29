import { ReasoningLevel } from '@agent-ic/contracts';
import {
  AGENT_OUTCOME_CONTINUE,
  AGENT_OUTCOME_FIELD_NAME,
  AGENT_OUTCOME_REASON_FIELD_NAME,
  AgentExitKind,
  ModelProviderKind,
  NodeType,
  OutputFieldType,
  PortName,
} from '@agent-ic/flow';
import type { AgentExits, AgentNode } from '@agent-ic/flow';
import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ConversationMode } from '@/modules/conversations';
import { AGENT_EXITS_CONTRACT } from '@/modules/runs/constants/agent-exit.constants';
import { AGENT_MAX_TOOL_ROUNDS } from '@/modules/runs/constants/llm-step.constants';
import { RunStatus, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import {
  LLM_OUTPUT_INVALID_FEEDBACK,
  LLM_STEP_TIMEOUT_MS,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  SEND_NODE_ID,
  SEND_NODE_KEY,
  TEST_AGENT_PROMPT,
  TEST_AGENT_REPLY,
  TEST_AGENT_RETRIES,
  TEST_LLM_API_KEY,
  TEST_MOOD,
  TEST_MOOD_FIELD,
  TEST_RENDERED_AGENT_PROMPT,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { libraryPromptSource } from '@test/support/fixtures/prompt-flow.fixture';
import { agentNode, flowEdge, sendListNode, stepFlow } from '@test/support/fixtures/runs.fixture';
import { createLlmGateway } from '@test/support/helpers/llm-testing.helpers';
import { seedLibraryPrompt } from '@test/support/helpers/prompts-testing.helpers';
import { createRunsTestbed, seedExecutableRun } from '@test/support/helpers/runs-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const send = sendListNode(SEND_NODE_ID, SEND_NODE_KEY, `${TEST_STEP_NODE_KEY}.messages`);
const answer = { messages: [TEST_AGENT_REPLY], [TEST_MOOD_FIELD]: TEST_MOOD };
const invalidAnswer = { messages: [TEST_AGENT_REPLY] };
const FEEDBACK_ROUNDS = 2;
const HANDOFF_WHEN = 'The customer asks for a person.';
const END_WHEN = 'The customer says goodbye.';
const OUTCOME_REASON = 'The customer asked for a manager.';
const EXITS: AgentExits = { end: { when: END_WHEN }, handoff: { when: HANDOFF_WHEN } };
const outcomeAnswer = (outcome: string) => ({
  ...answer,
  [AGENT_OUTCOME_FIELD_NAME]: outcome,
  [AGENT_OUTCOME_REASON_FIELD_NAME]: OUTCOME_REASON,
});

const timesSent = (messages: unknown, text: string): number =>
  JSON.stringify(messages).split(text).length - 1;

describe('AgentExecutor', () => {
  let mock: MockLlmService;
  let testbed: RunExecutionTestbed;
  let workspaceId: string;
  let agent: AgentNode;

  const agentThenSend = (port: string = PortName.Next, node: AgentNode = agent) =>
    stepFlow(
      [node, send],
      [flowEdge(TEST_NODE_ID, node.id), flowEdge(node.id, SEND_NODE_ID, port)],
    );

  const withExits = (model: string): AgentNode => ({
    ...agent,
    config: {
      ...agent.config,
      model: { provider: { kind: ModelProviderKind.Platform }, model },
      exits: EXITS,
    },
  });

  const execute = ({ ctx, run }: ExecutableRun): Promise<RunStatus> =>
    testbed.execution.execute(ctx, run.workspaceId, run.id, RETRYABLE_ATTEMPT);

  const stepOf = async ({ run }: ExecutableRun, nodeId: string) => {
    const steps = await testbed.tenants.run(run.workspaceId, () =>
      testbed.steps.listByRun(run.workspaceId, run.id),
    );
    return steps.find((step) => step.nodeId === nodeId);
  };

  beforeAll(async () => {
    mock = await startMockLlm();
    const env = { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: TEST_LLM_API_KEY };
    testbed = await createRunsTestbed(
      TestRedisPrefix.AgentStep,
      createLlmGateway(env, LLM_STEP_TIMEOUT_MS),
      NodeType.SendMessage,
    );
    workspaceId = testbed.ids.generate();
    agent = agentNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
      prompt: libraryPromptSource(
        await seedLibraryPrompt(testbed.module, workspaceId, TEST_AGENT_PROMPT),
      ),
      model: { provider: { kind: ModelProviderKind.Platform }, model: LlmModelId.Ministral14b },
      reasoning: ReasoningLevel.Low,
      output: [
        { name: TEST_MOOD_FIELD, type: OutputFieldType.String, description: '', required: true },
      ],
      retries: TEST_AGENT_RETRIES,
    });
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await testbed.module.close();
    await mock.stop();
  });

  it('answers with the history and its prompt, and the reply flows into Send message', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json(answer);

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const sent = testbed.executor.executions.find(({ run }) => run.id === seeded.run.id);
    expect(mock.body(0)).toMatchObject({
      model: LlmModelId.Ministral14b,
      messages: [
        { role: 'system', content: expect.stringContaining(TEST_RENDERED_AGENT_PROMPT) },
        { role: 'user', content: TEST_MESSAGE_TEXT },
      ],
    });
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({
      status: RunStepStatus.Succeeded,
      port: PortName.Next,
      output: answer,
    });
    expect(sent?.scope.variables).toMatchObject({ [TEST_STEP_NODE_KEY]: answer });
  });

  it('retries a failed answer and then succeeds', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.fail(HttpStatus.BAD_REQUEST).json(answer);

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.requests).toHaveLength(2);
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({ output: answer });
  });

  it('fails to its error port once the retries are used up', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(PortName.Error),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    Array.from({ length: TEST_AGENT_RETRIES + 1 }, () => mock.fail(HttpStatus.BAD_REQUEST));

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.requests).toHaveLength(TEST_AGENT_RETRIES + 1);
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({
      status: RunStepStatus.Failed,
      port: PortName.Error,
      output: null,
    });
    expect(await stepOf(seeded, SEND_NODE_ID)).toMatchObject({ status: RunStepStatus.Succeeded });
  });

  it('retries an invalid answer from the transcript of the attempt before', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json(invalidAnswer).json(invalidAnswer).json(answer);

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.requests).toHaveLength(3);
    expect(timesSent(mock.body(2).messages, LLM_OUTPUT_INVALID_FEEDBACK)).toBe(FEEDBACK_ROUNDS);
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({ output: answer });
  });

  it('keeps every retry of the step inside one round budget', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(PortName.Error),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    Array.from({ length: AGENT_MAX_TOOL_ROUNDS + 1 }, () => mock.json(invalidAnswer));

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.requests).toHaveLength(AGENT_MAX_TOOL_ROUNDS);
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({
      status: RunStepStatus.Failed,
      port: PortName.Error,
    });
  });

  it('tells the agent its exits and follows the port of the outcome in a native answer', async () => {
    const node = withExits(LlmModelId.Ministral14b);
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(AgentExitKind.Handoff, node),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json(outcomeAnswer(AgentExitKind.Handoff));

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const system = JSON.stringify(mock.body(0).messages);
    expect(system).toContain(AGENT_EXITS_CONTRACT[0]);
    expect(system).toContain(HANDOFF_WHEN);
    expect(system).toContain(END_WHEN);
    expect(mock.body(0)).toMatchObject({ response_format: { type: 'json_schema' } });
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({
      status: RunStepStatus.Succeeded,
      port: AgentExitKind.Handoff,
      output: outcomeAnswer(AgentExitKind.Handoff),
    });
    expect(await stepOf(seeded, SEND_NODE_ID)).toMatchObject({ status: RunStepStatus.Succeeded });
  });

  it('follows the port of the outcome in a reply-tool answer', async () => {
    const node = withExits(LlmModelId.MimoV26Flash);
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(AgentExitKind.End, node),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.reply(outcomeAnswer(AgentExitKind.End));

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.body(0)).not.toHaveProperty('response_format');
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({
      port: AgentExitKind.End,
      output: outcomeAnswer(AgentExitKind.End),
    });
  });

  it('follows next when the answer continues the conversation', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(PortName.Next, withExits(LlmModelId.Ministral14b)),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json(outcomeAnswer(AGENT_OUTCOME_CONTINUE));

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({ port: PortName.Next });
    expect(await stepOf(seeded, SEND_NODE_ID)).toMatchObject({ status: RunStepStatus.Succeeded });
  });

  it('retries an answer without an outcome while an exit is on', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      agentThenSend(AgentExitKind.Handoff, withExits(LlmModelId.Ministral14b)),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json(answer).json(outcomeAnswer(AgentExitKind.Handoff));

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.requests).toHaveLength(2);
    expect(await stepOf(seeded, TEST_STEP_NODE_ID)).toMatchObject({ port: AgentExitKind.Handoff });
  });
});
