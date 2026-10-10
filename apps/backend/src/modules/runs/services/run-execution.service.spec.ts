import { ErrorReason } from '@agent-ic/contracts';
import { PortName } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runStepsChannel } from '@/modules/runs/channels/run-steps.channel';
import { RunStatus, RunStepStatus } from '@/modules/runs/constants/run.constants';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  StepScript,
  THIRD_STEP_ID,
  THIRD_STEP_KEY,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { WorkerKilledError } from '@test/support/errors/worker-killed.error';
import { agentNode, endNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';
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

  it('walks the ports, passes earlier outputs on and publishes every step', async () => {
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
});
