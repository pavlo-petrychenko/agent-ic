import { ErrorReason, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UsageCountersService } from '@/modules/usage/services/usage-counters.service';
import { GetWorkspaceUsageUseCase } from '@/modules/usage/use-cases/get-workspace-usage.use-case';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import {
  TEST_CHUNKS_LIMIT,
  TEST_CONVERSATIONS_LIMIT,
  TEST_CREDITS_LIMIT,
  USAGE_TEST_PERIOD_END,
  USAGE_TEST_PERIOD_START,
} from '@test/support/constants/usage-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createUsageTestbed,
  meteredReport,
  setWorkspaceLimits,
  seedOwnedWorkspace,
} from '@test/support/helpers/usage-testing.helpers';
import type { UsageTestbed } from '@test/support/typedefs/usage-testing.typedefs';

describe('GetWorkspaceUsageUseCase', () => {
  let testbed: UsageTestbed;
  let getWorkspaceUsage: GetWorkspaceUsageUseCase;

  beforeAll(async () => {
    testbed = await createUsageTestbed();
    getWorkspaceUsage = testbed.module.get(GetWorkspaceUsageUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const ctxFor = (workspaceId: string, role: WorkspaceRole = WorkspaceRole.Owner) =>
    workspaceCtx(testbed.ids.generate(), workspaceId, role);

  it('shows the month, the used amounts and the configured limits', async () => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);
    await testbed.module.get(UsageReporter).report(meteredReport(workspaceId, 42.5));
    await testbed.tenants.run(workspaceId, () =>
      testbed.module.get(UsageCountersService).countConversation(workspaceId),
    );

    const usage = await getWorkspaceUsage.execute(ctxFor(workspaceId));

    expect(usage).toEqual({
      periodStart: USAGE_TEST_PERIOD_START,
      periodEnd: USAGE_TEST_PERIOD_END,
      credits: { used: 42.5, limit: TEST_CREDITS_LIMIT },
      conversations: { used: 1, limit: TEST_CONVERSATIONS_LIMIT },
      chunks: { used: 0, limit: TEST_CHUNKS_LIMIT },
    });
  });

  it('shows zero before anything is used and the limits of the workspace', async () => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);
    await setWorkspaceLimits(testbed, workspaceId, { creditsLimit: 50_000, chunksLimit: 9 });

    const usage = await getWorkspaceUsage.execute(ctxFor(workspaceId, WorkspaceRole.Admin));

    expect(usage).toMatchObject({
      credits: { used: 0, limit: 50_000 },
      conversations: { used: 0, limit: TEST_CONVERSATIONS_LIMIT },
      chunks: { used: 0, limit: 9 },
    });
  });

  it.each([WorkspaceRole.Builder, WorkspaceRole.Operator])('refuses a %s', async (role) => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);

    await expect(getWorkspaceUsage.execute(ctxFor(workspaceId, role))).rejects.toMatchObject({
      reason: ErrorReason.PermissionDenied,
    });
  });
});
