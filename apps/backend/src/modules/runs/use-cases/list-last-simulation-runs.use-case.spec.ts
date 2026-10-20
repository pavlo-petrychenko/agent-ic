import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { ListLastSimulationRunsUseCase } from '@/modules/runs/use-cases/list-last-simulation-runs.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createRunsTestbed,
  seedLastSimulationRuns,
} from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const DRAFT_REVISION = 4;

describe('ListLastSimulationRunsUseCase', () => {
  let testbed: RunExecutionTestbed;

  const lastRuns = (workspaceId: string, keys: readonly string[], role = WorkspaceRole.Builder) =>
    testbed.module
      .get(ListLastSimulationRunsUseCase)
      .execute(workspaceCtx(testbed.ids.generate(), workspaceId, role), keys);

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.LastSimulationRun);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('summarises the latest simulation run of every agent with the draft revision it tested', async () => {
    const batch = await seedLastSimulationRuns(testbed, DRAFT_REVISION);

    const summaries = await lastRuns(batch.workspaceId, batch.agentIds);

    expect([...summaries.values()]).toEqual([
      {
        id: batch.testedRunId,
        status: RunStatus.Queued,
        finishedAt: null,
        draftRevision: DRAFT_REVISION,
      },
      { id: batch.publishedRunId, status: RunStatus.Queued, finishedAt: null, draftRevision: null },
      null,
    ]);
  });

  it('finds no runs of another workspace', async () => {
    const { agentIds } = await seedLastSimulationRuns(testbed, DRAFT_REVISION);

    const summaries = await lastRuns(testbed.ids.generate(), agentIds);

    expect([...summaries.values()]).toEqual([null, null, null]);
  });

  it('refuses an operator', async () => {
    const { workspaceId, agentIds } = await seedLastSimulationRuns(testbed, DRAFT_REVISION);

    const attempt = lastRuns(workspaceId, agentIds, WorkspaceRole.Operator);

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
