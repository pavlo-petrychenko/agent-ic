import { ErrorReason } from '@agent-ic/contracts';
import {
  ModelProviderKind,
  NodeType,
  OutputFieldType,
  PortName,
  PromptSourceKind,
  RequestBodyKind,
  WaitFor,
  hasBlockingIssues,
  validateFlow,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { context, propagation, trace } from '@opentelemetry/api';
import { node, tracing } from '@opentelemetry/sdk-node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ConversationActivityKind, conversationActivityChannel } from '@/modules/conversations';
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
import {
  createLlmGateway,
  createLlmTraceContextService,
} from '@test/support/helpers/llm-testing.helpers';
import { startProbeServer } from '@test/support/helpers/outbound-http-testing.helpers';
import {
  createRunsTestbed,
  seedExecutableRun,
  storeFlowJson,
} from '@test/support/helpers/runs-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
import type { ProbeServer } from '@test/support/typedefs/outbound-http-testing.typedefs';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const MODEL_ATTRIBUTE = 'langfuse.observation.metadata.model';
const SAMPLE_EVERY_RUN = '1';
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
    testbed.execution.execute(ctx, run.workspaceId, run.id);

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
      await vi.waitFor(() => {
        expect(testbed.executor.callsFor(seeded.run.id, FOURTH_STEP_ID)).toBe(1);
      });
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

    const running = execute(seeded);
    await vi.waitFor(async () => {
      const { steps } = await stored(seeded);
      expect(steps.map((step) => step.nodeId)).toContain(ESCALATION_NODE_ID);
    });
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
    await vi.waitFor(() => {
      expect(testbed.executor.callsFor(seeded.run.id, FOURTH_STEP_ID)).toBe(1);
    });
    testbed.observer.release(OBSERVER_NODE_ID);

    expect(await running).toBe(RunStatus.Succeeded);
    const { steps } = await stored(seeded);
    expect(steps.find((step) => step.nodeId === OBSERVER_NODE_ID)?.status).toBe(
      RunStepStatus.Succeeded,
    );
  });
});

describe('RunExecutionService background branches', () => {
  const agent = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY, {
    prompt: { kind: PromptSourceKind.Inline, text: TEST_AGENT_PROMPT },
    model: { provider: { kind: ModelProviderKind.Platform }, model: LlmModelId.Ministral14b },
  });
  const scorer = completionNode(SCORER_NODE_ID, SCORER_NODE_KEY, {
    output: [
      { name: TEST_MOOD_FIELD, type: OutputFieldType.String, description: '', required: true },
    ],
  });
  const answer = { messages: [TEST_AGENT_REPLY], [TEST_MOOD_FIELD]: TEST_MOOD };
  let mock: MockLlmService;
  let probe: ProbeServer;
  let testbed: RunExecutionTestbed;

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
    testbed.execution.execute(ctx, run.workspaceId, run.id);

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
  });

  afterAll(async () => {
    await testbed.module.close();
    await probe.close();
    await mock.stop();
  });

  it('sends the reply while the background scorer is still posting its score', async () => {
    const flow = replyAndScore();
    const seeded = await seedExecutableRun(testbed, flow);
    mock.json(answer).json(answer);

    const running = execute(seeded);
    await vi.waitFor(() => {
      expect(testbed.executor.callsFor(seeded.run.id, SEND_NODE_ID)).toBe(1);
      expect(probe.hits(OutboundTestPath.Held)).toBe(1);
    });
    const whileHeld = await stepsOf(seeded);
    probe.release();

    expect(await running).toBe(RunStatus.Succeeded);
    const sent = testbed.executor.executions.find(({ run }) => run.id === seeded.run.id);
    const posted = (await stepsOf(seeded)).find((step) => step.nodeId === TEST_API_NODE_ID);
    expect(hasBlockingIssues(validateFlow(flow))).toBe(false);
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
  const guardThenStep = stepFlow(
    [
      completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY),
      agentNode(FIRST_STEP_ID, FIRST_STEP_KEY),
    ],
    [flowEdge(TEST_NODE_ID, TEST_STEP_NODE_ID), flowEdge(TEST_STEP_NODE_ID, FIRST_STEP_ID)],
  );
  let mock: MockLlmService;
  let testbed: RunExecutionTestbed;

  const traceIdOf = async ({ run }: ExecutableRun): Promise<string | null> => {
    const stored = await testbed.tenants.run(run.workspaceId, () =>
      testbed.runs.findById(run.workspaceId, run.id),
    );
    return stored?.traceId ?? null;
  };

  const execute = ({ ctx, run }: ExecutableRun): Promise<RunStatus> =>
    testbed.execution.execute(ctx, run.workspaceId, run.id);

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
      [EnvVar.LangfuseSampleRate]: SAMPLE_EVERY_RUN,
      [EnvVar.OtelSdkDisabled]: SDK_RUNNING,
    };
    const traces = createLlmTraceContextService(env, provider.getTracer(LLM_TRACER_NAME));
    const llm = createLlmGateway(env, LLM_STEP_TIMEOUT_MS, { traces });
    testbed = await createRunsTestbed(TestRedisPrefix.RunTracing, llm, undefined, traces);
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

  it('records one trace per run, saved on the run, with a span per step around its LLM call', async () => {
    const seeded = await seedExecutableRun(testbed, guardThenStep);
    mock.json({ intent: TEST_ORDER_INTENT });

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const traceId = await traceIdOf(seeded);
    const spans = spansOf(traceId);
    const root = spans.find((span) => span.name === RUN_TRACE_NAME);
    const rootId = root?.spanContext().spanId;
    const steps = spans.filter((span) => span.parentSpanContext?.spanId === rootId);
    const guard = steps.find((span) => span.name === TEST_STEP_NODE_KEY);
    const generation = spans.find((span) => span.attributes[MODEL_ATTRIBUTE] !== undefined);
    expect(traceId).not.toBeNull();
    expect(exporter.getFinishedSpans()).toHaveLength(spans.length);
    expect(root?.parentSpanContext).toBeUndefined();
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

  it('saves the trace of the retry when a killed run is retried', async () => {
    const seeded = await seedExecutableRun(testbed, threeSteps);
    testbed.executor.script(SECOND_STEP_ID, StepScript.Crash);

    await expect(execute(seeded)).rejects.toBeInstanceOf(WorkerKilledError);
    const killed = await traceIdOf(seeded);
    await execute(seeded);
    const retried = await traceIdOf(seeded);

    expect(killed).not.toBeNull();
    expect(retried).not.toBe(killed);
    expect(spansOf(retried).map(({ name }) => name)).toEqual([
      SECOND_STEP_KEY,
      THIRD_STEP_KEY,
      RUN_TRACE_NAME,
    ]);
  });
});
