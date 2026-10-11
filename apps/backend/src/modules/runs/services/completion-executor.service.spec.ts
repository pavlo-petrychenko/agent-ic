import { ErrorReason } from '@agent-ic/contracts';
import {
  CompletionRole,
  PortName,
  PromptSourceKind,
  PromptVersionKind,
  createScopeLookup,
  pickRoute,
  resolvePath,
  WaitFor,
} from '@agent-ic/flow';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { NO_HISTORY_MESSAGE } from '@/modules/runs/constants/llm-step.constants';
import { RunStatus, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { messageTriggerVariables, stepVariables } from '@/modules/runs/helpers/run-scope.helpers';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LLM_STEP_TIMEOUT_MS } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  OBSERVER_STEP_ID,
  OBSERVER_STEP_KEY,
  PARALLEL_STEP_ID,
  PARALLEL_STEP_KEY,
  RUNS_TEST_START,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
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
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import {
  agentNode,
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
import { createRunsTestbed, seedExecutableRun } from '@test/support/helpers/runs-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const guard = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, CompletionRole.Guard);
const observer = completionNode(OBSERVER_STEP_ID, OBSERVER_STEP_KEY, CompletionRole.Observer);
const router = intentRouterNode(TEST_OTHER_NODE_ID, TEST_OTHER_NODE_KEY, TEST_STEP_NODE_KEY);

const guardThenAgent = (node = guard) =>
  stepFlow(
    [node, agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
    [flowEdge(TEST_NODE_ID, node.id), flowEdge(node.id, SECOND_STEP_ID)],
  );

describe('CompletionExecutor', () => {
  let mock: MockLlmService;
  let testbed: RunExecutionTestbed;

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
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await testbed.module.close();
    await mock.stop();
  });

  it('asks the step model with its prompt and the history, and a guard answer routes', async () => {
    const seeded = await seedExecutableRun(testbed, guardThenAgent());
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
    const node = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, CompletionRole.Guard, {
      input: { includeCurrentMessage: false },
    });
    const seeded = await seedExecutableRun(testbed, guardThenAgent(node));
    mock.json({ intent: TEST_QUESTION_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    expect(mock.body(0)['messages']).toEqual([
      { role: 'system', content: TEST_RENDERED_PROMPT },
      { role: 'user', content: NO_HISTORY_MESSAGE },
    ]);
  });

  it('fails the step on a library prompt without calling the model', async () => {
    const node = completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, CompletionRole.Guard, {
      prompt: {
        kind: PromptSourceKind.Library,
        promptRef: TEST_PROMPT_REF,
        pin: { kind: PromptVersionKind.Latest },
      },
    });
    const seeded = await seedExecutableRun(testbed, guardThenAgent(node));

    expect(await execute(seeded)).toBe(RunStatus.Failed);

    const { run } = await stored(seeded);
    expect(mock.requests).toHaveLength(0);
    expect(run?.error).toMatchObject({
      reason: ErrorReason.StepPromptUnavailable,
      nodeId: TEST_STEP_NODE_ID,
    });
  });

  it('ends an observer without a port and hides its output from the router', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([observer], [flowEdge(TEST_NODE_ID, OBSERVER_STEP_ID)]),
    );
    mock.json({ intent: TEST_QUESTION_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const observed = (await stored(seeded)).steps.find((step) => step.nodeId === OBSERVER_STEP_ID);
    const checks = stepFlow(
      [parallelNode(PARALLEL_STEP_ID, PARALLEL_STEP_KEY, WaitFor.Guards), guard, observer, router],
      [
        flowEdge(TEST_NODE_ID, PARALLEL_STEP_ID),
        branchEdge(PARALLEL_STEP_ID, TEST_STEP_NODE_ID),
        branchEdge(PARALLEL_STEP_ID, OBSERVER_STEP_ID),
        flowEdge(PARALLEL_STEP_ID, TEST_OTHER_NODE_ID),
      ],
    );
    const { ids } = testbed;
    const steps = new Map([
      [TEST_STEP_NODE_ID, finishedStep(ids, guard, RunStepStatus.Succeeded, PortName.Next)],
      [OBSERVER_STEP_ID, finishedStep(ids, observer, RunStepStatus.Succeeded, null)],
    ]);
    const trigger = messageTriggerVariables(runConversation(ids), [], RUNS_TEST_START);
    const lookup = createScopeLookup(checks);
    const variables = stepVariables({ flow: checks, lookup, trigger, steps }, TEST_OTHER_NODE_ID);
    expect(observed).toMatchObject({ port: null, output: { intent: TEST_QUESTION_INTENT } });
    expect(variables).toHaveProperty(TEST_STEP_NODE_KEY);
    expect(variables).not.toHaveProperty(OBSERVER_STEP_KEY);
  });
});
