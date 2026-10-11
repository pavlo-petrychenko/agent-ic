import { ErrorReason } from '@agent-ic/contracts';
import { PortName, WaitFor } from '@agent-ic/flow';
import type { FlowNode } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { runStepsChannel } from '@/modules/runs/channels/run-steps.channel';
import { ROOT_BRANCH_KEY, RunStatus, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { branchKeyOf } from '@/modules/runs/helpers/run-branch.helpers';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
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
  StepScript,
  THIRD_STEP_ID,
  TEST_ROUTE_RULE_ID,
  THIRD_STEP_KEY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { WorkerKilledError } from '@test/support/errors/worker-killed.error';
import {
  agentNode,
  endNode,
  flowEdge,
  observerNode,
  parallelNode,
  routerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import { createRunsTestbed, seedExecutableRun } from '@test/support/helpers/runs-testing.helpers';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

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
) =>
  stepFlow(
    [
      parallelNode(PARALLEL_NODE_ID, PARALLEL_NODE_KEY, waitFor),
      agentNode(FIRST_STEP_ID, FIRST_STEP_KEY),
      held,
      agentNode(THIRD_STEP_ID, THIRD_STEP_KEY),
      agentNode(FOURTH_STEP_ID, FOURTH_STEP_KEY),
    ],
    [
      flowEdge(TEST_NODE_ID, PARALLEL_NODE_ID),
      flowEdge(PARALLEL_NODE_ID, FIRST_STEP_ID, PortName.Branches),
      flowEdge(PARALLEL_NODE_ID, held.id, PortName.Branches),
      flowEdge(held.id, THIRD_STEP_ID),
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

    expect(await execute(seeded)).toBe(RunStatus.Succeeded);

    const published = await Promise.all(threeSteps.nodes.map(() => events.next()));
    await events.return();
    const { run, steps } = await stored(seeded);
    const third = testbed.executor.executions.find(
      (call) => call.run.id === seeded.run.id && call.node.id === THIRD_STEP_ID,
    );
    expect(run).toMatchObject({ status: RunStatus.Succeeded, error: null });
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
      threeSteps.nodes.map(({ id: nodeId }) =>
        expect.objectContaining({ nodeId, status: RunStepStatus.Succeeded }),
      ),
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
      stepFlow([endNode(FIRST_STEP_ID, FIRST_STEP_KEY)], [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)]),
    );

    expect(await execute(seeded)).toBe(RunStatus.Failed);

    const { run } = await stored(seeded);
    expect(run?.error).toMatchObject({
      reason: ErrorReason.UnsupportedNodeType,
      nodeId: FIRST_STEP_ID,
    });
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
    { waitFor: WaitFor.First, held: agentNode(SECOND_STEP_ID, SECOND_STEP_KEY) },
    { waitFor: WaitFor.Guards, held: observerNode(OBSERVER_NODE_ID, OBSERVER_NODE_KEY) },
  ])(
    'joins on $waitFor without the held branch and still finishes it before the run ends',
    async ({ waitFor, held }) => {
      const seeded = await seedExecutableRun(testbed, parallelFlow(waitFor, held));
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
      expect(testbed.executor.callsFor(seeded.run.id, THIRD_STEP_ID)).toBe(1);
    },
  );
});
