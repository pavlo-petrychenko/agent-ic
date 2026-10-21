import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WorkspaceLimitsRepository } from '@/modules/usage/repositories/workspace-limits.repository';
import { CleanUpWorkspaceUseCase } from '@/modules/usage/use-cases/clean-up-workspace.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import { systemCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  counterOf,
  createUsageTestbed,
  meteredReport,
  setWorkspaceLimits,
  seedOwnedWorkspace,
} from '@test/support/helpers/usage-testing.helpers';
import type { UsageTestbed } from '@test/support/typedefs/usage-testing.typedefs';

describe('CleanUpWorkspaceUseCase', () => {
  let testbed: UsageTestbed;
  let cleanUp: CleanUpWorkspaceUseCase;

  beforeAll(async () => {
    testbed = await createUsageTestbed();
    cleanUp = testbed.module.get(CleanUpWorkspaceUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedUsage = async (workspaceId: string) => {
    await testbed.module.get(UsageReporter).report(meteredReport(workspaceId, 5));
    await setWorkspaceLimits(testbed, workspaceId, { creditsLimit: 100 });
  };

  const limitsOf = (workspaceId: string) =>
    testbed.tenants.run(workspaceId, () =>
      testbed.module.get(WorkspaceLimitsRepository).find(workspaceId),
    );

  it('deletes the counters and limits of the workspace and keeps the others', async () => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);
    const { workspaceId: otherWorkspaceId } = await seedOwnedWorkspace(testbed);
    await seedUsage(workspaceId);
    await seedUsage(otherWorkspaceId);

    await cleanUp.execute(systemCtx(), { workspaceId });

    expect(await counterOf(testbed, workspaceId)).toBeNull();
    expect(await limitsOf(workspaceId)).toBeNull();
    expect(await counterOf(testbed, otherWorkspaceId)).toMatchObject({ credits: 5 });
    expect(await limitsOf(otherWorkspaceId)).toMatchObject({ creditsLimit: 100 });
  });

  it('refuses a non-system actor', async () => {
    const { workspaceId } = await seedOwnedWorkspace(testbed);

    const attempt = cleanUp.execute(userCtx(testbed.ids.generate()), { workspaceId });

    await expect(attempt).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
