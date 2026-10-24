import { IdPrefix, Locale } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { USAGE_THRESHOLD_EMAIL_COPY } from '@/modules/usage/constants/usage-email.constants';
import { UsageThreshold } from '@/modules/usage/constants/usage.constants';
import { SendUsageThresholdEmailUseCase } from '@/modules/usage/use-cases/send-usage-threshold-email.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import {
  TEST_USAGE_OWNER_NAME,
  TEST_USAGE_WORKSPACE_NAME,
} from '@test/support/constants/usage-testing.constants';
import { systemCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createUsageTestbed,
  seedOwnedWorkspace,
} from '@test/support/helpers/usage-testing.helpers';
import type { UsageTestbed } from '@test/support/typedefs/usage-testing.typedefs';

describe('SendUsageThresholdEmailUseCase', () => {
  let testbed: UsageTestbed;
  let sendUsageThresholdEmail: SendUsageThresholdEmailUseCase;

  beforeAll(async () => {
    testbed = await createUsageTestbed();
    sendUsageThresholdEmail = testbed.module.get(SendUsageThresholdEmailUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('tells the owner at 80 percent with a link to the usage page', async () => {
    const owner = await seedOwnedWorkspace(testbed);

    await sendUsageThresholdEmail.execute(systemCtx(), {
      workspaceId: owner.workspaceId,
      threshold: UsageThreshold.Warn,
    });

    const [message] = testbed.emails.sentTo(owner.email);
    const copy = USAGE_THRESHOLD_EMAIL_COPY[Locale.En][UsageThreshold.Warn];
    const publicId = testbed.ids.toPublic(IdPrefix.Workspace, owner.workspaceId);
    expect(message?.subject).toBe(
      `${TEST_USAGE_WORKSPACE_NAME} used 80% of this month's usage limit`,
    );
    expect(message?.text).toContain(TEST_USAGE_OWNER_NAME);
    expect(message?.text).toContain(copy.action);
    expect(message?.html).toContain(`https://app.agent-ic.test/w/${publicId}/settings/usage`);
  });

  it('tells the owner at 100 percent in their language', async () => {
    const owner = await seedOwnedWorkspace(testbed, { locale: Locale.Uk });

    await sendUsageThresholdEmail.execute(systemCtx(), {
      workspaceId: owner.workspaceId,
      threshold: UsageThreshold.Limit,
    });

    const [message] = testbed.emails.sentTo(owner.email);
    expect(message?.subject).toBe(`${TEST_USAGE_WORKSPACE_NAME} вичерпав місячний ліміт`);
    expect(message?.text).toContain(
      USAGE_THRESHOLD_EMAIL_COPY[Locale.Uk][UsageThreshold.Limit].action,
    );
  });

  it('sends nothing for a workspace that no longer exists', async () => {
    const sentBefore = testbed.emails.sent.length;

    await sendUsageThresholdEmail.execute(systemCtx(), {
      workspaceId: testbed.ids.generate(),
      threshold: UsageThreshold.Limit,
    });

    expect(testbed.emails.sent).toHaveLength(sentBefore);
  });

  it('refuses a non-system actor', async () => {
    const owner = await seedOwnedWorkspace(testbed);

    const attempt = sendUsageThresholdEmail.execute(userCtx(owner.userId), {
      workspaceId: owner.workspaceId,
      threshold: UsageThreshold.Warn,
    });

    await expect(attempt).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
