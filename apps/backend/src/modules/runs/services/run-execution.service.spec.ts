import { ErrorReason } from '@agent-ic/contracts';
import {
  ModelProviderKind,
  NodeType,
  OutputFieldType,
  PortName,
  RequestBodyKind,
  WaitFor,
  hasBlockingIssues,
  validateFlow,
} from '@agent-ic/flow';
import type { AgentNode, CompletionNode, FlowDocument, FlowNode } from '@agent-ic/flow';
import { context, propagation, trace } from '@opentelemetry/api';
import { node, tracing } from '@opentelemetry/sdk-node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  ConversationActivityKind,
  ConversationMode,
  conversationActivityChannel,
} from '@/modules/conversations';
import { runStepsChannel } from '@/modules/runs/channels/run-steps.channel';
import { RUN_TRACE_NAME } from '@/modules/runs/constants/run-tracing.constants';
import { ROOT_BRANCH_KEY, RunStatus, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { branchKeyOf } from '@/modules/runs/helpers/run-branch.helpers';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LangfuseMode } from '@/platform/config/constants/langfuse.constants';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LLM_STEP_TIMEOUT_MS } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { LLM_TRACER_NAME } from '@/platform/llm/constants/llm-tracing.constants';
import {
  TEST_API_NODE_ID,
  TEST_NODE_ID,
  TEST_NODE_KEY,
} from '@test/support/constants/agents-testing.constants';
import { FINAL_ATTEMPT, RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import { OutboundTestPath } from '@test/support/constants/outbound-http-testing.constants';
import {
  ESCALATION_NODE_ID,
  ESCALATION_NODE_KEY,
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  FOURTH_STEP_ID,
  FOURTH_STEP_KEY,
  OBSERVER_NODE_ID,
  OBSERVER_NODE_KEY,
  PARALLEL_NODE_ID,
  PARALLEL_NODE_KEY,
  ROUTER_NODE_ID,
  ROUTER_NODE_KEY,
  SCORER_NODE_ID,
  SCORER_NODE_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  SEND_NODE_ID,
  SEND_NODE_KEY,
  StepScript,
  THIRD_STEP_ID,
  TEST_ROUTE_RULE_ID,
  THIRD_STEP_KEY,
  TEST_AGENT_PROMPT,
  TEST_AGENT_REPLY,
  TEST_COMPLETION_PROMPT,
  TEST_LLM_API_KEY,
  TEST_MOOD,
  TEST_MOOD_FIELD,
  TEST_ORDER_INTENT,
  TEST_SCORE_BODY_TEMPLATE,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { WorkerKilledError } from '@test/support/errors/worker-killed.error';
import { libraryPromptSource } from '@test/support/fixtures/prompt-flow.fixture';
import {
  agentNode,
  apiRequestNode,
  backgroundBranchEdge,
  branchEdge,
  completionNode,
  endNode,
  escalateNode,
  flowEdge,
  flowV1Json,
  observerNode,
  parallelNode,
  routerNode,
  sendListNode,
  sendMessageNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import { SampleUnavailableError } from '@test/support/fixtures/sample-errors.fixture';
import {
  createLlmGateway,
  createLlmTraceContextService,
} from '@test/support/helpers/llm-testing.helpers';
import { startProbeServer } from '@test/support/helpers/outbound-http-testing.helpers';
import { seedLibraryPrompt } from '@test/support/helpers/prompts-testing.helpers';
import {
  createRunsTestbed,
  seedExecutableRun,
  storeFlowJson,
  watchStep,
} from '@test/support/helpers/runs-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type { ProbeServer } from '@test/support/typedefs/outbound-http-testing.typedefs';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const MODEL_ATTRIBUTE = 'langfuse.observation.metadata.model';
const JOB_SPAN_NAME = 'process runs-reactive';
const REQUEST_SPAN_NAME = 'POST /graphql';
const SDK_RUNNING = 'false';

const threeSteps = stepFlow(
  [
    agentNode(FIRST_STEP_ID, FIRST_STEP_KEY),
    agentNode(SECOND_STEP_ID, SECOND_STEP_KEY),
    agentNode(THIRD_STEP_ID, THIRD_STEP_KEY),
  ],
  [
    flowEdge(TEST_NODE_ID, FIRST_STEP_ID),
    flowEdge(FIRST_STEP_ID, SECOND_STEP_ID),
    flowEdge(SECOND_STEP_ID, THIRD_STEP_ID),
  ],
);

const parallelFlow = (
  waitFor: WaitFor,
  held: FlowNode = agentNode(SECOND_STEP_ID, SECOND_STEP_KEY),
  background = false,
) =>
  stepFlow(
    [
      parallelNode(PARALLEL_NODE_ID, PARALLEL_NODE_KEY, waitFor),
      agentNode(FIRST_STEP_ID, FIRST_STEP_KEY),
      held,
      ...(held.id === OBSERVER_NODE_ID ? [] : [agentNode(THIRD_STEP_ID, THIRD_STEP_KEY)]),
      agentNode(FOURTH_STEP_ID, FOURTH_STEP_KEY),
    ],
    [
      flowEdge(TEST_NODE_ID, PARALLEL_NODE_ID),
      flowEdge(PARALLEL_NODE_ID, FIRST_STEP_ID, PortName.Branches),
      background
        ? backgroundBranchEdge(PARALLEL_NODE_ID, held.id)
        : flowEdge(PARALLEL_NODE_ID, held.id, PortName.Branches),
      ...(held.id === OBSERVER_NODE_ID ? [] : [flowEdge(held.id, THIRD_STEP_ID)]),
      flowEdge(PARALLEL_NODE_ID, FOURTH_STEP_ID),
    ],
  );

describe('RunExecutionService', () => {
  let testbed: RunExecutionTestbed;

  const execute = ({ ctx, run }: ExecutableRun): Promise<RunStatus> =>
    testbed.execution.execute(ctx, run.workspaceId, run.id, RETRYABLE_ATTEMPT);

  const executeFinal = ({ ctx, run }: ExecutableRun): Promise<RunStatus> =>
    testbed.execution.execute(ctx, run.workspaceId, run.id, FINAL_ATTEMPT);

  const stored = async ({ run }: ExecutableRun) =>
    testbed.tenants.run(run.workspaceId, async () => ({
      run: await testbed.runs.findById(run.workspaceId, run.id),
      steps: await testbed.steps.listByRun(run.workspaceId, run.id),
    }));

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunExecution);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('walks the ports, passes earlier outputs on, saves inputs and publishes every step', async () => {
    const seeded = await seedExecutableRun(testbed, threeSteps);
    const events = await testbed.liveUpdates.subscribe(channelFor(runStepsChannel, seeded.run.id));
    const activity = await testbed.liveUpdates.subscribe(
      channelFor(conversationActivityChannel, seeded.run.conversationId),
    );

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const published = await Promise.all(
      threeSteps.nodes.flatMap(() => [events.next(), events.next()]),
    );
    const announced = [await activity.next(), await activity.next()];
    await events.return();
    await activity.return();
    const { run, steps } = await stored(seeded);
    const third = testbed.executor.executions.find(
      (call) => call.run.id === seeded.run.id && call.node.id === THIRD_STEP_ID,
    );
    expect(run).toMatchObject({ status: RunStatus.Succeeded, error: null, traceId: null });
    expect(steps.every((step) => !('history' in step.input))).toBe(true);
    expect(Object.fromEntries(steps.map((step) => [step.nodeId, step.status]))).toEqual({
      [TEST_NODE_ID]: RunStepStatus.Succeeded,
      [FIRST_STEP_ID]: RunStepStatus.Succeeded,
      [SECOND_STEP_ID]: RunStepStatus.Succeeded,
      [THIRD_STEP_ID]: RunStepStatus.Succeeded,
    });
    expect(third?.scope.variables).toMatchObject({
      message: { text: TEST_MESSAGE_TEXT },
      [FIRST_STEP_KEY]: { answer: FIRST_STEP_KEY },
      [SECOND_STEP_KEY]: { answer: SECOND_STEP_KEY },
    });
    expect(published.map((event) => event.value)).toEqual(
      threeSteps.nodes.flatMap(({ id: nodeId }) => [
        expect.objectContaining({ nodeId, status: RunStepStatus.Running }),
        expect.objectContaining({ nodeId, status: RunStepStatus.Succeeded }),
      ]),
    );
    expect(announced.map((event) => event.value)).toEqual(
      [ConversationActivityKind.RunStarted, ConversationActivityKind.RunFinished].map((kind) => ({
        conversationId: seeded.run.conversationId,
        kind,
        messageId: null,
        runId: seeded.run.id,
      })),
    );
  });

  it('skips the finished steps when a killed run is retried', async () => {
    const seeded = await seedExecutableRun(testbed, threeSteps);
    testbed.executor.script(THIRD_STEP_ID, StepScript.Crash);

    await expect(execute(seeded)).rejects.toBeInstanceOf(WorkerKilledError);
    const killed = await stored(seeded);
    const retried = await execute(seeded);

    const { run, steps } = await stored(seeded);
    expect(killed.run?.status).toBe(RunStatus.Running);
    expect(retried).toBe(RunStatus.Succeeded);
    expect(run?.status).toBe(RunStatus.Succeeded);
    expect(
      [FIRST_STEP_ID, SECOND_STEP_ID, THIRD_STEP_ID].map((id) =>
        testbed.executor.callsFor(seeded.run.id, id),
      ),
    ).toEqual([1, 1, 2]);
    expect(steps.find((step) => step.nodeId === THIRD_STEP_ID)?.attempt).toBe(2);
  });

  it('follows the error port of a failed step', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow(
        [agentNode(FIRST_STEP_ID, FIRST_STEP_KEY), agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
        [
          flowEdge(TEST_NODE_ID, FIRST_STEP_ID),
          flowEdge(FIRST_STEP_ID, SECOND_STEP_ID, PortName.Error),
        ],
      ),
    );
    testbed.executor.script(FIRST_STEP_ID, StepScript.Fail);

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const { steps } = await stored(seeded);
    expect(
      Object.fromEntries(steps.map((step) => [step.nodeId, [step.status, step.port]])),
    ).toEqual({
      [TEST_NODE_ID]: [RunStepStatus.Succeeded, PortName.Next],
      [FIRST_STEP_ID]: [RunStepStatus.Failed, PortName.Error],
      [SECOND_STEP_ID]: [RunStepStatus.Succeeded, PortName.Next],
    });
  });

  it('fails the run when a failed step has no error port', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)], [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)]),
    );
    testbed.executor.script(FIRST_STEP_ID, StepScript.Fail);

    expect(await execute(seeded)).toBe(RunStatus.Failed);

    const { run } = await stored(seeded);
    expect(run?.error).toMatchObject({ reason: ErrorReason.InvalidId, nodeId: FIRST_STEP_ID });
  });

  it('fails the step and the run on an upstream error that jobs would not retry', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)], [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)]),
    );
    testbed.executor.script(FIRST_STEP_ID, StepScript.RejectUpstream);

    expect(await execute(seeded)).toBe(RunStatus.Failed);

    const { run, steps } = await stored(seeded);
    const failure = { reason: ErrorReason.UpstreamFailed, nodeId: FIRST_STEP_ID };
    expect(run?.error).toMatchObject(failure);
    expect(steps.find((step) => step.nodeId === FIRST_STEP_ID)).toMatchObject({
      status: RunStepStatus.Failed,
      error: failure,
    });
  });

  it('leaves an unavailable step to the job retry while attempts are left', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)], [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)]),
    );
    testbed.executor.script(FIRST_STEP_ID, StepScript.Unavailable);

    await expect(execute(seeded)).rejects.toBeInstanceOf(SampleUnavailableError);

    const { run, steps } = await stored(seeded);
    expect(run?.status).toBe(RunStatus.Running);
    expect(steps.find((step) => step.nodeId === FIRST_STEP_ID)?.status).toBe(RunStepStatus.Running);
  });

  it('fails an unavailable step on the last attempt and follows its error port', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow(
        [agentNode(FIRST_STEP_ID, FIRST_STEP_KEY), agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
        [
          flowEdge(TEST_NODE_ID, FIRST_STEP_ID),
          flowEdge(FIRST_STEP_ID, SECOND_STEP_ID, PortName.Error),
        ],
      ),
    );
    testbed.executor.script(FIRST_STEP_ID, StepScript.Unavailable);

    expect(await executeFinal(seeded)).toBe(RunStatus.Succeeded);

    const { steps } = await stored(seeded);
    expect(steps.find((step) => step.nodeId === FIRST_STEP_ID)).toMatchObject({
      status: RunStepStatus.Failed,
      port: PortName.Error,
      error: { reason: ErrorReason.UpstreamFailed, nodeId: FIRST_STEP_ID },
    });
    expect(steps.find((step) => step.nodeId === SECOND_STEP_ID)?.status).toBe(
      RunStepStatus.Succeeded,
    );
  });

  it('fails the run when an unavailable step on the last attempt has no error port', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)], [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)]),
    );
    testbed.executor.script(FIRST_STEP_ID, StepScript.Unavailable);

    expect(await executeFinal(seeded)).toBe(RunStatus.Failed);

    const { run } = await stored(seeded);
    expect(run?.error).toMatchObject({ reason: ErrorReason.UpstreamFailed, nodeId: FIRST_STEP_ID });
  });

  it('fails the run clearly on a node type no executor handles', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow([sendMessageNode()], [flowEdge(TEST_NODE_ID, SEND_NODE_ID)]),
    );

    expect(await execute(seeded)).toBe(RunStatus.Failed);

    const { run } = await stored(seeded);
    expect(run?.error).toMatchObject({
      reason: ErrorReason.UnsupportedNodeType,
      nodeId: SEND_NODE_ID,
    });
  });

  it.each([
    [RunStatus.Escalated, escalateNode()],
    [RunStatus.Succeeded, endNode(ESCALATION_NODE_ID, ESCALATION_NODE_KEY)],
  ])('ends the run %s after an escalation step, also inside a branch', async (status, step) => {
    const direct = stepFlow([step], [flowEdge(TEST_NODE_ID, ESCALATION_NODE_ID)]);
    const seeded = await seedExecutableRun(testbed, direct);
    const branched = await seedExecutableRun(testbed, parallelFlow(WaitFor.All, step));

    expect([await execute(seeded), await execute(branched)]).toEqual([status, status]);

    expect((await stored(seeded)).run).toMatchObject({ status, error: null });
    const afterwards = [THIRD_STEP_ID, FOURTH_STEP_ID];
    expect(afterwards.map((id) => testbed.executor.callsFor(branched.run.id, id))).toEqual([0, 0]);
  });

  it('follows the port of the router rule that matches', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow(
        [
          agentNode(FIRST_STEP_ID, FIRST_STEP_KEY),
          routerNode(ROUTER_NODE_ID, ROUTER_NODE_KEY),
          agentNode(SECOND_STEP_ID, SECOND_STEP_KEY),
          agentNode(THIRD_STEP_ID, THIRD_STEP_KEY),
        ],
        [
          flowEdge(TEST_NODE_ID, FIRST_STEP_ID),
          flowEdge(FIRST_STEP_ID, ROUTER_NODE_ID),
          flowEdge(ROUTER_NODE_ID, SECOND_STEP_ID, TEST_ROUTE_RULE_ID),
          flowEdge(ROUTER_NODE_ID, THIRD_STEP_ID, PortName.Else),
        ],
      ),
    );

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const { steps } = await stored(seeded);
    expect(steps.find((step) => step.nodeId === ROUTER_NODE_ID)?.port).toBe(TEST_ROUTE_RULE_ID);
    expect(steps.map((step) => step.nodeId)).toContain(SECOND_STEP_ID);
    expect(steps.map((step) => step.nodeId)).not.toContain(THIRD_STEP_ID);
  });

  it('runs every branch with its branch key, then joins and sees the branch outputs', async () => {
    const seeded = await seedExecutableRun(testbed, parallelFlow(WaitFor.All));

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const { steps } = await stored(seeded);
    const after = testbed.executor.executions.find(
      (call) => call.run.id === seeded.run.id && call.node.id === FOURTH_STEP_ID,
    );
    expect(Object.fromEntries(steps.map((step) => [step.nodeId, step.branchKey]))).toEqual({
      [TEST_NODE_ID]: ROOT_BRANCH_KEY,
      [PARALLEL_NODE_ID]: ROOT_BRANCH_KEY,
      [FIRST_STEP_ID]: branchKeyOf(PARALLEL_NODE_ID, FIRST_STEP_ID),
      [SECOND_STEP_ID]: branchKeyOf(PARALLEL_NODE_ID, SECOND_STEP_ID),
      [THIRD_STEP_ID]: branchKeyOf(PARALLEL_NODE_ID, SECOND_STEP_ID),
      [FOURTH_STEP_ID]: ROOT_BRANCH_KEY,
    });
    expect(after?.scope.variables).toMatchObject({
      [FIRST_STEP_KEY]: { answer: FIRST_STEP_KEY },
      [THIRD_STEP_KEY]: { answer: THIRD_STEP_KEY },
    });
  });

  it('skips the finished branches when a killed parallel run is retried', async () => {
    const seeded = await seedExecutableRun(testbed, parallelFlow(WaitFor.All));
    testbed.executor.script(THIRD_STEP_ID, StepScript.Crash);

    await expect(execute(seeded)).rejects.toBeInstanceOf(WorkerKilledError);
    const retried = await execute(seeded);

    expect(retried).toBe(RunStatus.Succeeded);
    expect(
      [FIRST_STEP_ID, SECOND_STEP_ID, THIRD_STEP_ID, FOURTH_STEP_ID].map((id) =>
        testbed.executor.callsFor(seeded.run.id, id),
      ),
    ).toEqual([1, 1, 2, 1]);
  });

  it('fails the run when an awaited branch fails without an error port', async () => {
    const seeded = await seedExecutableRun(testbed, parallelFlow(WaitFor.All));
    testbed.executor.script(FIRST_STEP_ID, StepScript.Fail);

    expect(await execute(seeded)).toBe(RunStatus.Failed);

    const { run } = await stored(seeded);
    expect(run?.error).toMatchObject({ nodeId: FIRST_STEP_ID });
    expect(testbed.executor.callsFor(seeded.run.id, FOURTH_STEP_ID)).toBe(0);
  });

  it.each([
    {
      waitFor: WaitFor.First,
      held: agentNode(SECOND_STEP_ID, SECOND_STEP_KEY),
      background: false,
      thirdCalls: 1,
    },
    {
      waitFor: WaitFor.All,
      held: observerNode(OBSERVER_NODE_ID, OBSERVER_NODE_KEY),
      background: true,
      thirdCalls: 0,
    },
    {
      waitFor: WaitFor.All,
      held: agentNode(SECOND_STEP_ID, SECOND_STEP_KEY),
      background: true,
      thirdCalls: 1,
    },
  ])(
    'joins on $waitFor without the held branch and still finishes it before the run ends',
    async ({ waitFor, held, background, thirdCalls }) => {
      const seeded = await seedExecutableRun(testbed, parallelFlow(waitFor, held, background));
      const holder = held.id === OBSERVER_NODE_ID ? testbed.observer : testbed.executor;
      holder.script(held.id, StepScript.Hold);

      const running = execute(seeded);
      await testbed.executor.reached(seeded.run.id, FOURTH_STEP_ID);
      holder.release(held.id);

      expect(await running).toBe(RunStatus.Succeeded);
      const { steps } = await stored(seeded);
      expect(steps.find((step) => step.nodeId === held.id)?.status).toBe(RunStepStatus.Succeeded);
      expect(testbed.executor.callsFor(seeded.run.id, THIRD_STEP_ID)).toBe(thirdCalls);
    },
  );

  it('records a failed background step on the step and still finishes the run', async () => {
    const scorer = observerNode(OBSERVER_NODE_ID, OBSERVER_NODE_KEY);
    const seeded = await seedExecutableRun(testbed, parallelFlow(WaitFor.All, scorer, true));
    testbed.observer.script(OBSERVER_NODE_ID, StepScript.Fail);

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const { run, steps } = await stored(seeded);
    expect(run).toMatchObject({ status: RunStatus.Succeeded, error: null });
    expect(steps.find((step) => step.nodeId === OBSERVER_NODE_ID)).toMatchObject({
      status: RunStepStatus.Failed,
      port: null,
      error: { nodeId: OBSERVER_NODE_ID },
    });
    expect(testbed.executor.callsFor(seeded.run.id, FOURTH_STEP_ID)).toBe(1);
  });

  it('escalates the run from the error port of a waited branch and stops the other branch', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      stepFlow(
        [
          parallelNode(PARALLEL_NODE_ID, PARALLEL_NODE_KEY, WaitFor.All),
          agentNode(FIRST_STEP_ID, FIRST_STEP_KEY),
          escalateNode(),
          agentNode(SECOND_STEP_ID, SECOND_STEP_KEY),
          agentNode(THIRD_STEP_ID, THIRD_STEP_KEY),
          agentNode(FOURTH_STEP_ID, FOURTH_STEP_KEY),
        ],
        [
          flowEdge(TEST_NODE_ID, PARALLEL_NODE_ID),
          branchEdge(PARALLEL_NODE_ID, FIRST_STEP_ID),
          flowEdge(FIRST_STEP_ID, ESCALATION_NODE_ID, PortName.Error),
          backgroundBranchEdge(PARALLEL_NODE_ID, SECOND_STEP_ID),
          flowEdge(SECOND_STEP_ID, THIRD_STEP_ID),
          flowEdge(PARALLEL_NODE_ID, FOURTH_STEP_ID),
        ],
      ),
    );
    testbed.executor.script(FIRST_STEP_ID, StepScript.Fail);
    testbed.executor.script(SECOND_STEP_ID, StepScript.Hold);

    const escalated = await watchStep(testbed, seeded, ESCALATION_NODE_ID, RunStepStatus.Succeeded);

    const running = execute(seeded);
    await escalated.reached;
    testbed.executor.release(SECOND_STEP_ID);

    expect(await running).toBe(RunStatus.Escalated);
    expect(
      [THIRD_STEP_ID, FOURTH_STEP_ID].map((id) => testbed.executor.callsFor(seeded.run.id, id)),
    ).toEqual([0, 0]);
  });

  it('runs a stored version 1 flow with an observer branch as a background branch', async () => {
    const observer = observerNode(OBSERVER_NODE_ID, OBSERVER_NODE_KEY);
    const flow = parallelFlow(WaitFor.All, observer, true);
    const seeded = await seedExecutableRun(testbed, flow);
    await storeFlowJson(testbed, seeded, flowV1Json(flow));
    testbed.observer.script(OBSERVER_NODE_ID, StepScript.Hold);

    const running = execute(seeded);
    await testbed.executor.reached(seeded.run.id, FOURTH_STEP_ID);
    testbed.observer.release(OBSERVER_NODE_ID);

    expect(await running).toBe(RunStatus.Succeeded);
    const { steps } = await stored(seeded);
    expect(steps.find((step) => step.nodeId === OBSERVER_NODE_ID)?.status).toBe(
      RunStepStatus.Succeeded,
    );
  });
});

describe('RunExecutionService background branches', () => {
  const answer = { messages: [TEST_AGENT_REPLY], [TEST_MOOD_FIELD]: TEST_MOOD };
  let mock: MockLlmService;
  let probe: ProbeServer;
  let testbed: RunExecutionTestbed;
  let workspaceId: string;
  let agent: AgentNode;
  let scorer: CompletionNode;

  const replyAndScore = (): FlowDocument => {
    const post = apiRequestNode(`${probe.origin}${OutboundTestPath.Held}`, {
      body: { kind: RequestBodyKind.Json, content: TEST_SCORE_BODY_TEMPLATE },
    });
    return stepFlow(
      [
        parallelNode(PARALLEL_NODE_ID, PARALLEL_NODE_KEY, WaitFor.All),
        agent,
        escalateNode(),
        scorer,
        post,
        sendListNode(SEND_NODE_ID, SEND_NODE_KEY, `${FIRST_STEP_KEY}.messages`),
      ],
      [
        flowEdge(TEST_NODE_ID, PARALLEL_NODE_ID),
        branchEdge(PARALLEL_NODE_ID, FIRST_STEP_ID),
        flowEdge(FIRST_STEP_ID, ESCALATION_NODE_ID, PortName.Error),
        backgroundBranchEdge(PARALLEL_NODE_ID, SCORER_NODE_ID),
        flowEdge(SCORER_NODE_ID, TEST_API_NODE_ID),
        flowEdge(PARALLEL_NODE_ID, SEND_NODE_ID),
      ],
    );
  };

  const execute = ({ ctx, run }: ExecutableRun): Promise<RunStatus> =>
    testbed.execution.execute(ctx, run.workspaceId, run.id, RETRYABLE_ATTEMPT);

  const stepsOf = ({ run }: ExecutableRun) =>
    testbed.tenants.run(run.workspaceId, () => testbed.steps.listByRun(run.workspaceId, run.id));

  beforeAll(async () => {
    mock = await startMockLlm();
    probe = await startProbeServer();
    const env = { [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: TEST_LLM_API_KEY };
    testbed = await createRunsTestbed(
      TestRedisPrefix.RunBackgroundBranches,
      createLlmGateway(env, LLM_STEP_TIMEOUT_MS),
      NodeType.SendMessage,
    );
    workspaceId = testbed.ids.generate();
    agent = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY, {
      prompt: libraryPromptSource(
        await seedLibraryPrompt(testbed.module, workspaceId, TEST_AGENT_PROMPT),
      ),
      model: { provider: { kind: ModelProviderKind.Platform }, model: LlmModelId.Ministral14b },
    });
    scorer = completionNode(SCORER_NODE_ID, SCORER_NODE_KEY, {
      prompt: libraryPromptSource(
        await seedLibraryPrompt(testbed.module, workspaceId, TEST_COMPLETION_PROMPT),
      ),
      output: [
        { name: TEST_MOOD_FIELD, type: OutputFieldType.String, description: '', required: true },
      ],
    });
  });

  afterAll(async () => {
    await testbed.module.close();
    await probe.close();
    await mock.stop();
  });

  it('sends the reply while the background scorer is still posting its score', async () => {
    const flow = replyAndScore();
    const seeded = await seedExecutableRun(testbed, flow, [], ConversationMode.Live, workspaceId);
    mock.json(answer).json(answer);

    const running = execute(seeded);
    await Promise.all([
      testbed.executor.reached(seeded.run.id, SEND_NODE_ID),
      probe.arrived(OutboundTestPath.Held),
    ]);
    const whileHeld = await stepsOf(seeded);
    probe.release();

    expect(await running).toBe(RunStatus.Succeeded);
    const sent = testbed.executor.executions.find(({ run }) => run.id === seeded.run.id);
    const posted = (await stepsOf(seeded)).find((step) => step.nodeId === TEST_API_NODE_ID);
    expect(hasBlockingIssues(validateFlow(flow))).toBe(false);
    expect(probe.hits(OutboundTestPath.Held)).toBe(1);
    expect(testbed.executor.callsFor(seeded.run.id, SEND_NODE_ID)).toBe(1);
    expect(whileHeld.find((step) => step.nodeId === TEST_API_NODE_ID)?.status).toBe(
      RunStepStatus.Running,
    );
    expect(sent?.scope.variables).toMatchObject({
      [FIRST_STEP_KEY]: { messages: [TEST_AGENT_REPLY] },
    });
    expect(sent?.scope.variables).not.toHaveProperty(SCORER_NODE_KEY);
    expect(posted?.output).toMatchObject({
      ok: true,
      body: { body: JSON.stringify({ [TEST_MOOD_FIELD]: TEST_MOOD }) },
    });
  });
});

describe('RunExecutionService tracing', () => {
  const exporter = new tracing.InMemorySpanExporter();
  const provider = new node.NodeTracerProvider({
    spanProcessors: [new tracing.SimpleSpanProcessor(exporter)],
  });
  let guardThenStep: FlowDocument;
  let mock: MockLlmService;
  let testbed: RunExecutionTestbed;
  let workspaceId: string;

  const traceIdOf = async ({ run }: ExecutableRun): Promise<string | null> => {
    const stored = await testbed.tenants.run(run.workspaceId, () =>
      testbed.runs.findById(run.workspaceId, run.id),
    );
    return stored?.traceId ?? null;
  };

  const execute = ({ ctx, run }: ExecutableRun): Promise<RunStatus> =>
    testbed.execution.execute(ctx, run.workspaceId, run.id, RETRYABLE_ATTEMPT);

  const inSpan = <R>(name: string, work: () => Promise<R>): Promise<R> =>
    provider.getTracer(LLM_TRACER_NAME).startActiveSpan(name, async (span) => {
      try {
        return await work();
      } finally {
        span.end();
      }
    });

  const spansOf = (traceId: string | null) =>
    exporter.getFinishedSpans().filter((span) => span.spanContext().traceId === traceId);

  const ancestorsOf = (
    spans: readonly tracing.ReadableSpan[],
    span: tracing.ReadableSpan | undefined,
  ): string[] => {
    const parentId = span?.parentSpanContext?.spanId;
    const parent = spans.find((candidate) => candidate.spanContext().spanId === parentId);
    return parentId === undefined ? [] : [parentId, ...ancestorsOf(spans, parent)];
  };

  beforeAll(async () => {
    provider.register();
    mock = await startMockLlm();
    const env = {
      [EnvVar.LlmBaseUrl]: mock.url,
      [EnvVar.LlmApiKey]: TEST_LLM_API_KEY,
      [EnvVar.LangfuseMode]: LangfuseMode.SelfHosted,
      [EnvVar.OtelSdkDisabled]: SDK_RUNNING,
    };
    const traces = createLlmTraceContextService(env, provider.getTracer(LLM_TRACER_NAME));
    const llm = createLlmGateway(env, LLM_STEP_TIMEOUT_MS, { traces });
    testbed = await createRunsTestbed(TestRedisPrefix.RunTracing, llm, undefined, traces);
    workspaceId = testbed.ids.generate();
    guardThenStep = stepFlow(
      [
        completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
          prompt: libraryPromptSource(
            await seedLibraryPrompt(testbed.module, workspaceId, TEST_COMPLETION_PROMPT),
          ),
        }),
        agentNode(FIRST_STEP_ID, FIRST_STEP_KEY),
      ],
      [flowEdge(TEST_NODE_ID, TEST_STEP_NODE_ID), flowEdge(TEST_STEP_NODE_ID, FIRST_STEP_ID)],
    );
  });

  afterEach(() => {
    mock.reset();
    exporter.reset();
  });

  afterAll(async () => {
    await testbed.module.close();
    await mock.stop();
    await provider.shutdown();
    trace.disable();
    context.disable();
    propagation.disable();
  });

  it('records the run inside the job trace, saved on the run, with a span per step around its LLM call', async () => {
    const seeded = await seedExecutableRun(
      testbed,
      guardThenStep,
      [],
      ConversationMode.Live,
      workspaceId,
    );
    mock.json({ intent: TEST_ORDER_INTENT });

    expect(await inSpan(JOB_SPAN_NAME, () => execute(seeded))).toBe(RunStatus.Succeeded);

    const traceId = await traceIdOf(seeded);
    const spans = spansOf(traceId);
    const job = spans.find((span) => span.name === JOB_SPAN_NAME);
    const root = spans.find((span) => span.name === RUN_TRACE_NAME);
    const rootId = root?.spanContext().spanId;
    const steps = spans.filter((span) => span.parentSpanContext?.spanId === rootId);
    const guard = steps.find((span) => span.name === TEST_STEP_NODE_KEY);
    const generation = spans.find((span) => span.attributes[MODEL_ATTRIBUTE] !== undefined);
    expect(traceId).not.toBeNull();
    expect(job?.spanContext().traceId).toBe(traceId);
    expect(exporter.getFinishedSpans()).toHaveLength(spans.length);
    expect(root?.parentSpanContext?.spanId).toBe(job?.spanContext().spanId);
    expect(root?.attributes).toMatchObject({
      'langfuse.trace.name': RUN_TRACE_NAME,
      'langfuse.session.id': seeded.run.conversationId,
      'langfuse.trace.metadata.workspace_id': seeded.run.workspaceId,
      'langfuse.trace.metadata.agent_version_id': seeded.run.versionId,
      'langfuse.trace.metadata.run_id': seeded.run.id,
    });
    expect(steps.map(({ name, attributes }) => [name, attributes])).toEqual([
      [
        TEST_NODE_KEY,
        expect.objectContaining({ 'langfuse.observation.metadata.node_id': TEST_NODE_ID }),
      ],
      [
        TEST_STEP_NODE_KEY,
        expect.objectContaining({ 'langfuse.observation.metadata.node_id': TEST_STEP_NODE_ID }),
      ],
      [
        FIRST_STEP_KEY,
        expect.objectContaining({ 'langfuse.observation.metadata.node_id': FIRST_STEP_ID }),
      ],
    ]);
    expect(generation?.attributes).toMatchObject({ 'langfuse.trace.name': RUN_TRACE_NAME });
    expect(ancestorsOf(spans, generation)).toContain(guard?.spanContext().spanId);
  });

  it('records a retried run next to the killed one in the trace of the request', async () => {
    const seeded = await seedExecutableRun(testbed, threeSteps);
    testbed.executor.script(SECOND_STEP_ID, StepScript.Crash);

    const { killed, retried } = await inSpan(REQUEST_SPAN_NAME, async () => {
      await expect(inSpan(JOB_SPAN_NAME, () => execute(seeded))).rejects.toBeInstanceOf(
        WorkerKilledError,
      );
      const killedTrace = await traceIdOf(seeded);
      await inSpan(JOB_SPAN_NAME, () => execute(seeded));
      return { killed: killedTrace, retried: await traceIdOf(seeded) };
    });

    const names = spansOf(retried).map(({ name }) => name);
    expect(killed).not.toBeNull();
    expect(retried).toBe(killed);
    expect(names.filter((name) => name === RUN_TRACE_NAME)).toHaveLength(2);
    expect(names.filter((name) => name === JOB_SPAN_NAME)).toHaveLength(2);
    expect(names.filter((name) => name === THIRD_STEP_KEY)).toHaveLength(1);
  });
});
