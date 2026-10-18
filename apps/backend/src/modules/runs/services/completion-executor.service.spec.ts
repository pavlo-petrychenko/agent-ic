import { ErrorReason } from '@agent-ic/contracts';
import {
  ModelProviderKind,
  PortName,
  PromptSourceKind,
  PromptVersionKind,
  createScopeLookup,
  pickRoute,
  resolvePath,
  WaitFor,
} from '@agent-ic/flow';
import type { CompletionNode } from '@agent-ic/flow';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ConversationMode, MessageAuthor } from '@/modules/conversations';
import { ANSWER_FROM_CONVERSATION_MESSAGE } from '@/modules/runs/constants/llm-step.constants';
import { RunStatus, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { messageTriggerVariables, stepVariables } from '@/modules/runs/helpers/run-scope.helpers';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LLM_STEP_TIMEOUT_MS } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  TEST_PROMPT_LATER_TEXT,
  TEST_PROMPT_TEXT,
} from '@test/support/constants/prompts-testing.constants';
import {
  OBSERVER_NODE_ID,
  OBSERVER_STEP_KEY,
  PARALLEL_NODE_ID,
  PARALLEL_STEP_KEY,
  RUNS_TEST_START,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  TEST_AGENT_REPLY,
  TEST_COMPLETION_PROMPT,
  TEST_FOLLOW_UP,
  TEST_LLM_API_KEY,
  TEST_ORDER_INTENT,
  TEST_ORDER_RULE_ID,
  TEST_PROMPT_REF,
  TEST_OTHER_NODE_ID,
  TEST_OTHER_NODE_KEY,
  TEST_QUESTION_INTENT,
  TEST_RENDERED_PROMPT,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
  TEST_UNKNOWN_MODEL,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { libraryPromptSource } from '@test/support/fixtures/prompt-flow.fixture';
import {
  agentNode,
  backgroundBranchEdge,
  branchEdge,
  completionNode,
  finishedStep,
  flowEdge,
  intentRouterNode,
  parallelNode,
  runConversation,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import { createLlmGateway } from '@test/support/helpers/llm-testing.helpers';
import {
  publicPromptId,
  seedLibraryPrompt,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';
import { createRunsTestbed, seedExecutableRun } from '@test/support/helpers/runs-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const router = intentRouterNode(TEST_OTHER_NODE_ID, TEST_OTHER_NODE_KEY, TEST_STEP_NODE_KEY);
const SECOND_PROMPT_VERSION_NUMBER = 2;

describe('CompletionExecutor', () => {
  let mock: MockLlmService;
  let testbed: RunExecutionTestbed;
  let workspaceId: string;
  let promptRef: string;
  let guard: CompletionNode;
  let observer: CompletionNode;

  const guardThenAgent = (node: CompletionNode = guard) =>
    stepFlow(
      [node, agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
      [flowEdge(TEST_NODE_ID, node.id), flowEdge(node.id, SECOND_STEP_ID)],
    );

  const execute = ({ ctx, run }: ExecutableRun): Promise<RunStatus> =>
    testbed.execution.execute(ctx, run.workspaceId, run.id);

  const stored = ({ run }: ExecutableRun) =>
    testbed.tenants.run(run.workspaceId, async () => ({
      run: await testbed.runs.findById(run.workspaceId, run.id),
      steps: await testbed.steps.listByRun(run.workspaceId, run.id),
    }));

  beforeAll(async () => {
    mock = await startMockLlm();
    const env = { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: TEST_LLM_API_KEY };
    testbed = await createRunsTestbed(
      TestRedisPrefix.CompletionStep,
      createLlmGateway(env, LLM_STEP_TIMEOUT_MS),
    );
    workspaceId = testbed.ids.generate();
    promptRef = await seedLibraryPrompt(testbed.module, workspaceId, TEST_COMPLETION_PROMPT);
    guard = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
      prompt: libraryPromptSource(promptRef),
    });
    observer = completionNode(OBSERVER_NODE_ID, OBSERVER_STEP_KEY, {
      prompt: libraryPromptSource(promptRef),
    });
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await testbed.module.close();
    await mock.stop();
  });

  it('asks the step model with its prompt and the history, and a guard answer routes', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      guardThenAgent(),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json({ intent: TEST_ORDER_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const { steps } = await stored(seeded);
    const next = testbed.executor.executions.find(({ run }) => run.id === seeded.run.id);
    const variables = next?.scope.variables ?? {};
    expect(mock.body(0)).toMatchObject({
      model: LlmModelId.Ministral14b,
      messages: [
        { role: 'system', content: TEST_RENDERED_PROMPT },
        { role: 'user', content: TEST_MESSAGE_TEXT },
      ],
    });
    expect(steps.find((step) => step.nodeId === TEST_STEP_NODE_ID)).toMatchObject({
      status: RunStepStatus.Succeeded,
      port: PortName.Next,
      output: { intent: TEST_ORDER_INTENT },
    });
    expect(pickRoute(router.config.rules, (path) => resolvePath(variables, path))).toBe(
      TEST_ORDER_RULE_ID,
    );
  });

  it('leaves the current message out when the step does not include it', async () => {
    const node = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
      prompt: libraryPromptSource(promptRef),
      input: { includeCurrentMessage: false },
    });
    const seeded = await seedExecutableRun(
      testbed,
      guardThenAgent(node),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json({ intent: TEST_QUESTION_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.body(0)['messages']).toEqual([
      { role: 'system', content: TEST_RENDERED_PROMPT },
      { role: 'user', content: ANSWER_FROM_CONVERSATION_MESSAGE },
    ]);
  });

  it('ends the request with a user turn when the history before the current message ends with a reply', async () => {
    const node = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
      prompt: libraryPromptSource(promptRef),
      input: { includeCurrentMessage: false },
    });
    const seeded = await seedExecutableRun(
      testbed,
      guardThenAgent(node),
      [
        { author: MessageAuthor.Customer, text: TEST_FOLLOW_UP },
        { author: MessageAuthor.Agent, text: TEST_AGENT_REPLY },
      ],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json({ intent: TEST_QUESTION_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.body(0)['messages']).toEqual([
      { role: 'system', content: TEST_RENDERED_PROMPT },
      { role: 'user', content: TEST_FOLLOW_UP },
      { role: 'assistant', content: TEST_AGENT_REPLY },
      { role: 'user', content: ANSWER_FROM_CONVERSATION_MESSAGE },
    ]);
  });

  it('fails the step on a library prompt without calling the model', async () => {
    const node = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
      prompt: {
        kind: PromptSourceKind.Library,
        promptRef: TEST_PROMPT_REF,
        pin: { kind: PromptVersionKind.Latest },
      },
    });
    const seeded = await seedExecutableRun(
      testbed,
      guardThenAgent(node),
      [],
      ConversationMode.Live,
      workspaceId,
    );

    expect(await execute(seeded)).toBe(RunStatus.Failed);

    const { run } = await stored(seeded);
    expect(mock.requests).toHaveLength(0);
    expect(run?.error).toMatchObject({
      reason: ErrorReason.StepPromptUnavailable,
      nodeId: TEST_STEP_NODE_ID,
    });
  });

  it('answers with the pinned version of a library prompt', async () => {
    const workspaceId = testbed.ids.generate();
    const folderId = await seedPromptFolder(testbed.module, workspaceId);
    const promptId = await seedPrompt(testbed.module, workspaceId, folderId);
    await seedPromptVersion(testbed.module, workspaceId, promptId, { text: TEST_PROMPT_TEXT });
    await seedPromptVersion(testbed.module, workspaceId, promptId, {
      number: SECOND_PROMPT_VERSION_NUMBER,
      text: TEST_PROMPT_LATER_TEXT,
    });
    const node = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
      prompt: {
        kind: PromptSourceKind.Library,
        promptRef: publicPromptId(testbed.module, promptId),
        pin: { kind: PromptVersionKind.Pinned, number: SECOND_PROMPT_VERSION_NUMBER },
      },
    });
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([node], [flowEdge(TEST_NODE_ID, node.id)]),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json({ intent: TEST_ORDER_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.body(0)['messages']).toEqual([
      { role: 'system', content: TEST_PROMPT_LATER_TEXT },
      { role: 'user', content: TEST_MESSAGE_TEXT },
    ]);
    const { steps } = await stored(seeded);
    expect(steps.find((step) => step.nodeId === TEST_STEP_NODE_ID)).toMatchObject({
      status: RunStepStatus.Succeeded,
      port: PortName.Next,
      output: { intent: TEST_ORDER_INTENT },
    });
  });

  it('follows the error port of a guard whose model is unknown', async () => {
    const node = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
      model: { provider: { kind: ModelProviderKind.Platform }, model: TEST_UNKNOWN_MODEL },
    });
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow(
        [node, agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
        [flowEdge(TEST_NODE_ID, node.id), flowEdge(node.id, SECOND_STEP_ID, PortName.Error)],
      ),
    );

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const { steps } = await stored(seeded);
    const stepOf = (nodeId: string) => steps.find((step) => step.nodeId === nodeId);
    expect(mock.requests).toHaveLength(0);
    expect(stepOf(TEST_STEP_NODE_ID)).toMatchObject({
      status: RunStepStatus.Failed,
      port: PortName.Error,
      error: { reason: ErrorReason.StepModelUnknown, nodeId: TEST_STEP_NODE_ID },
    });
    expect(stepOf(SECOND_STEP_ID)).toMatchObject({ status: RunStepStatus.Succeeded });
  });

  it('hides the output of a background completion from the router after the join', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([observer], [flowEdge(TEST_NODE_ID, OBSERVER_NODE_ID)]),
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json({ intent: TEST_QUESTION_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const observed = (await stored(seeded)).steps.find((step) => step.nodeId === OBSERVER_NODE_ID);
    const checks = stepFlow(
      [parallelNode(PARALLEL_NODE_ID, PARALLEL_STEP_KEY, WaitFor.All), guard, observer, router],
      [
        flowEdge(TEST_NODE_ID, PARALLEL_NODE_ID),
        branchEdge(PARALLEL_NODE_ID, TEST_STEP_NODE_ID),
        backgroundBranchEdge(PARALLEL_NODE_ID, OBSERVER_NODE_ID),
        flowEdge(PARALLEL_NODE_ID, TEST_OTHER_NODE_ID),
      ],
    );
    const { ids } = testbed;
    const steps = new Map([
      [TEST_STEP_NODE_ID, finishedStep(ids, guard, RunStepStatus.Succeeded, PortName.Next)],
      [OBSERVER_NODE_ID, finishedStep(ids, observer, RunStepStatus.Succeeded, PortName.Next)],
    ]);
    const trigger = messageTriggerVariables(runConversation(ids), [], RUNS_TEST_START);
    const lookup = createScopeLookup(checks);
    const variables = stepVariables({ flow: checks, lookup, trigger, steps }, TEST_OTHER_NODE_ID);
    expect(observed).toMatchObject({
      port: PortName.Next,
      output: { intent: TEST_QUESTION_INTENT },
    });
    expect(variables).toHaveProperty(TEST_STEP_NODE_KEY);
    expect(variables).not.toHaveProperty(OBSERVER_STEP_KEY);
  });
});
