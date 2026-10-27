import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationNotFoundError } from '@/modules/conversations';
import { RunStatus } from '@/modules/runs/constants/run.constants';
import { ListSimulationRunsUseCase } from '@/modules/runs/use-cases/list-simulation-runs.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import { TEST_END_USER_EXTERNAL_ID } from '@test/support/constants/conversations-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createRunsTestbed,
  seedExecutableRun,
  seedSimulationRun,
} from '@test/support/helpers/runs-testing.helpers';
import type {
  ExecutableRun,
  RunExecutionTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

describe('ListSimulationRunsUseCase', () => {
  let testbed: RunExecutionTestbed;

  const list = (
    { run }: ExecutableRun,
    userId = TEST_END_USER_EXTERNAL_ID,
    role = WorkspaceRole.Builder,
    workspaceId = run.workspaceId,
  ) =>
    testbed.module.get(ListSimulationRunsUseCase).execute(workspaceCtx(userId, workspaceId, role), {
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, run.conversationId),
    });

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.SimulationRuns);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lists the runs of the caller simulation', async () => {
    const seeded = await seedSimulationRun(testbed);
    const { ctx, run } = seeded;
    await testbed.execution.execute(ctx, run.workspaceId, run.id, RETRYABLE_ATTEMPT);

    const [listed, ...others] = await list(seeded);

    expect(others).toEqual([]);
    expect(listed).toMatchObject({ status: RunStatus.Succeeded });
  });

  it("refuses a live chat, another user's or workspace's simulation and an operator", async () => {
    const live = await seedExecutableRun(testbed, triggerOnlyFlow());
    const simulation = await seedSimulationRun(testbed);

    await expect(list(live)).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(list(simulation, testbed.ids.generate())).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(
      list(simulation, TEST_END_USER_EXTERNAL_ID, WorkspaceRole.Operator),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      list(simulation, TEST_END_USER_EXTERNAL_ID, WorkspaceRole.Builder, testbed.ids.generate()),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});
