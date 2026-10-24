import { ErrorReason, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetUsageStatusUseCase } from '@/modules/usage/use-cases/get-usage-status.use-case';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import {
  TEST_CREDITS_LIMIT,
  USAGE_TEST_PERIOD_END,
} from '@test/support/constants/usage-testing.constants';
import { userCtx } from '@test/support/fixtures/identity.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createUsageTestbed,
  meteredReport,
  setWorkspaceLimits,
  seedOwnedWorkspace,
} from '@test/support/helpers/usage-testing.helpers';
import type { UsageTestbed } from '@test/support/typedefs/usage-testing.typedefs';

describe('GetUsageStatusUseCase', () => {
  let testbed: UsageTestbed;
  let getUsageStatus: GetUsageStatusUseCase;

  beforeAll(async () => {
    testbed = await createUsageTestbed();
    getUsageStatus = testbed.module.get(GetUsageStatusUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const report = (workspaceId: string, credits: number) =>
    testbed.module.get(UsageReporter).report(meteredReport(workspaceId, credits));

  it('says the limit is not reached below it', async () => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);
    await report(workspaceId, TEST_CREDITS_LIMIT - 1);

    const status = await getUsageStatus.execute(
      workspaceCtx(testbed.ids.generate(), workspaceId, WorkspaceRole.Owner),
    );

    expect(status).toEqual({
      limitReached: false,
      reachedAt: null,
      periodEnd: USAGE_TEST_PERIOD_END,
    });
  });

  it('tells every member, operators included, when the limit was reached', async () => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);
    await report(workspaceId, TEST_CREDITS_LIMIT);

    const status = await getUsageStatus.execute(
      workspaceCtx(testbed.ids.generate(), workspaceId, WorkspaceRole.Operator),
    );

    expect(status).toEqual({
      limitReached: true,
      reachedAt: testbed.clock.now(),
      periodEnd: USAGE_TEST_PERIOD_END,
    });
  });

  it('clears the banner when the limit of the workspace is raised', async () => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);
    await report(workspaceId, TEST_CREDITS_LIMIT);
    await setWorkspaceLimits(testbed, workspaceId, { creditsLimit: TEST_CREDITS_LIMIT * 2 });

    const status = await getUsageStatus.execute(
      workspaceCtx(testbed.ids.generate(), workspaceId, WorkspaceRole.Builder),
    );

    expect(status).toMatchObject({ limitReached: false, reachedAt: null });
  });

  it('refuses a user outside any workspace', async () => {
    await expect(getUsageStatus.execute(userCtx(testbed.ids.generate()))).rejects.toMatchObject({
      reason: ErrorReason.WorkspaceAccessDenied,
    });
  });
});
