import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStepStatus } from '@/modules/runs/constants/run.constants';
import { ListRunStepsUseCase } from '@/modules/runs/use-cases/list-run-steps.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
  TEST_STEP_NODE_ID,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createRunsTestbed,
  seedSimulationRunBatch,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunBatch, RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const oneOfTwoSteps = stepFlow(
  [agentNode(FIRST_STEP_ID, FIRST_STEP_KEY), agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)],
);

describe('ListRunStepsUseCase', () => {
  let testbed: RunExecutionTestbed;

  const list = (workspaceId: string, { runIds }: RunBatch, role = WorkspaceRole.Builder) =>
    testbed.module
      .get(ListRunStepsUseCase)
      .execute(workspaceCtx(testbed.ids.generate(), workspaceId, role), [
        runIds.executed,
        runIds.started,
        runIds.queued,
      ]);

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunStepsBatch);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns the steps of every run, and no steps for a run that took none', async () => {
    const batch = await seedSimulationRunBatch(testbed, oneOfTwoSteps);

    const steps = await list(batch.workspaceId, batch);

    const succeeded = { status: RunStepStatus.Succeeded, durationMs: 0 };
    const executed = steps.get(batch.runIds.executed) ?? [];
    expect(executed).toEqual([
      expect.objectContaining({ ...succeeded, nodeId: TEST_NODE_ID }),
      expect.objectContaining({
        ...succeeded,
        nodeId: FIRST_STEP_ID,
        nodeKey: FIRST_STEP_KEY,
        input: expect.objectContaining({ message: { text: TEST_MESSAGE_TEXT, attachments: [] } }),
        output: { answer: FIRST_STEP_KEY },
      }),
    ]);
    expect(executed.every((step) => !('history' in step.input))).toBe(true);
    expect(steps.get(batch.runIds.started)).toEqual([
      expect.objectContaining({ nodeId: TEST_STEP_NODE_ID, status: RunStepStatus.Running }),
    ]);
    expect(steps.get(batch.runIds.queued)).toEqual([]);
  });

  it('returns no steps for the runs of another workspace', async () => {
    const batch = await seedSimulationRunBatch(testbed, oneOfTwoSteps);

    const steps = await list(testbed.ids.generate(), batch);

    expect([...steps.values()]).toEqual([[], [], []]);
  });

  it('refuses an operator', async () => {
    const batch = await seedSimulationRunBatch(testbed, oneOfTwoSteps);

    const attempt = list(batch.workspaceId, batch, WorkspaceRole.Operator);

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
