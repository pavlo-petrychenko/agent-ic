import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetRunTotalsUseCase } from '@/modules/runs/use-cases/get-run-totals.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
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

describe('GetRunTotalsUseCase', () => {
  let testbed: RunExecutionTestbed;

  const totalsOf = (workspaceId: string, { runIds }: RunBatch, role = WorkspaceRole.Builder) =>
    testbed.module
      .get(GetRunTotalsUseCase)
      .execute(workspaceCtx(testbed.ids.generate(), workspaceId, role), [
        runIds.executed,
        runIds.started,
        runIds.queued,
      ]);

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunTotalsBatch);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('counts the steps run, the steps in the flow and the messages sent of every run', async () => {
    const batch = await seedSimulationRunBatch(testbed, oneOfTwoSteps);

    const totals = await totalsOf(batch.workspaceId, batch);

    expect(Object.fromEntries(totals)).toEqual({
      [batch.runIds.executed]: { stepsRun: 2, stepsInFlow: 3, messagesSent: 1 },
      [batch.runIds.started]: { stepsRun: 1, stepsInFlow: 3, messagesSent: 0 },
      [batch.runIds.queued]: { stepsRun: 0, stepsInFlow: 3, messagesSent: 0 },
    });
  });

  it('finds no totals for the runs of another workspace', async () => {
    const batch = await seedSimulationRunBatch(testbed, oneOfTwoSteps);

    const totals = await totalsOf(testbed.ids.generate(), batch);

    expect([...totals.values()]).toEqual([null, null, null]);
  });

  it('refuses an operator', async () => {
    const batch = await seedSimulationRunBatch(testbed, oneOfTwoSteps);

    const attempt = totalsOf(batch.workspaceId, batch, WorkspaceRole.Operator);

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
