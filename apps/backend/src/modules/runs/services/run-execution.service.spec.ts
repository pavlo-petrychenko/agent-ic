import { ErrorReason } from '@agent-ic/contracts';
import { CompletionRole, PortName, WaitFor, isObserverNode } from '@agent-ic/flow';
import type { FlowNode } from '@agent-ic/flow';
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
import { LLM_TRACER_NAME } from '@/platform/llm/constants/llm-tracing.constants';
import { TEST_NODE_ID, TEST_NODE_KEY } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
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
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  SEND_NODE_ID,
  StepScript,
  THIRD_STEP_ID,
  TEST_ROUTE_RULE_ID,
  THIRD_STEP_KEY,
  TEST_LLM_API_KEY,
  TEST_ORDER_INTENT,
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { WorkerKilledError } from '@test/support/errors/worker-killed.error';
import {
  agentNode,
  completionNode,
  endNode,
  escalateNode,
  flowEdge,
  backgroundBranchEdge,
  observerNode,
  parallelNode,
  routerNode,
  sendMessageNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import {
  createLlmGateway,
  createLlmTraceContextService,
} from '@test/support/helpers/llm-testing.helpers';
import { createRunsTestbed, seedExecutableRun } from '@test/support/helpers/runs-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';
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
      ...(isObserverNode(held) ? [] : [agentNode(THIRD_STEP_ID, THIRD_STEP_KEY)]),
      agentNode(FOURTH_STEP_ID, FOURTH_STEP_KEY),
    ],
    [
      flowEdge(TEST_NODE_ID, PARALLEL_NODE_ID),
      flowEdge(PARALLEL_NODE_ID, FIRST_STEP_ID, PortName.Branches),
      background
        ? backgroundBranchEdge(PARALLEL_NODE_ID, held.id)
        : flowEdge(PARALLEL_NODE_ID, held.id, PortName.Branches),
      ...(isObserverNode(held) ? [] : [flowEdge(held.id, THIRD_STEP_ID)]),
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
      waitFor: WaitFor.Guards,
      held: observerNode(OBSERVER_NODE_ID, OBSERVER_NODE_KEY),
      background: false,
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
});

describe('RunExecutionService tracing', () => {
  const exporter = new tracing.InMemorySpanExporter();
  const provider = new node.NodeTracerProvider({
    spanProcessors: [new tracing.SimpleSpanProcessor(exporter)],
  });
  const guardThenStep = stepFlow(
    [
      completionNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, CompletionRole.Guard),
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
