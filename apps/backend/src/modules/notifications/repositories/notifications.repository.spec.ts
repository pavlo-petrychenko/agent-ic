import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications/constants/notification.constants';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import { ROOT_BRANCH_KEY } from '@/modules/runs';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { triggerOnlyFlow } from '@test/support/fixtures/runs.fixture';
import { ensureUserRow } from '@test/support/helpers/parent-rows.helpers';
import { createRunsTestbed, seedExecutableRun } from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const READ_AT = new Date('2026-11-06T12:00:00.000Z');

describe('NotificationsRepository read state', () => {
  let testbed: RunExecutionTestbed;
  let notifications: NotificationsRepository;

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.NotificationReadPath);
    notifications = testbed.module.get(NotificationsRepository);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedNotification = async (
    seeded: Awaited<ReturnType<typeof seedExecutableRun>>,
    userId: string,
  ): Promise<string> => {
    const step = await testbed.tenants.run(seeded.run.workspaceId, () =>
      testbed.steps.start({
        id: testbed.ids.generate(),
        workspaceId: seeded.run.workspaceId,
        runId: seeded.run.id,
        nodeId: 'escalation',
        nodeKey: 'escalation',
        branchKey: ROOT_BRANCH_KEY,
        input: {},
        startedAt: testbed.clock.now(),
      }),
    );
    if (step === null) {
      throw new Error('Expected a stored run step');
    }
    const notificationId = await testbed.tenants.run(seeded.run.workspaceId, () =>
      notifications.insertIfAbsent({
        id: testbed.ids.generate(),
        workspaceId: seeded.run.workspaceId,
        userId,
        runStepId: step.id,
        kind: NotificationKind.Escalation,
        lastCustomerMessageId: seeded.run.lastCoveredMessageId,
      }),
    );
    await testbed.tenants.run(seeded.run.workspaceId, async () => {
      await notifications.insertDeliveryIfAbsent({
        id: testbed.ids.generate(),
        workspaceId: seeded.run.workspaceId,
        notificationId,
        channel: NotificationChannel.Platform,
        status: NotificationDeliveryStatus.Delivered,
        sentAt: testbed.clock.now(),
        readAt: null,
      });
      await notifications.insertDeliveryIfAbsent({
        id: testbed.ids.generate(),
        workspaceId: seeded.run.workspaceId,
        notificationId,
        channel: NotificationChannel.Email,
        status: NotificationDeliveryStatus.Pending,
        sentAt: null,
        readAt: null,
      });
    });
    return notificationId;
  };

  it('counts unread platform deliveries and marks one conversation read', async () => {
    const seeded = await seedExecutableRun(testbed, triggerOnlyFlow());
    const user = testbed.ids.generate();
    await ensureUserRow(testbed.module, user);
    await seedNotification(seeded, user);

    const unread = await testbed.tenants.run(seeded.run.workspaceId, () =>
      notifications.countUnreadPlatform(seeded.run.workspaceId, user),
    );
    expect(unread).toBe(1);

    const marked = await testbed.tenants.run(seeded.run.workspaceId, () =>
      notifications.markPlatformReadForConversation(
        seeded.run.workspaceId,
        user,
        seeded.run.conversationId,
        READ_AT,
      ),
    );
    expect(marked).toBe(1);
    expect(
      await testbed.tenants.run(seeded.run.workspaceId, () =>
        notifications.countUnreadPlatform(seeded.run.workspaceId, user),
      ),
    ).toBe(0);
    expect(
      await testbed.tenants.run(seeded.run.workspaceId, () =>
        notifications.markPlatformReadForConversation(
          seeded.run.workspaceId,
          user,
          seeded.run.conversationId,
          READ_AT,
        ),
      ),
    ).toBe(0);
  });

  it('does not mark another user or another conversation read', async () => {
    const first = await seedExecutableRun(testbed, triggerOnlyFlow());
    const second = await seedExecutableRun(
      testbed,
      triggerOnlyFlow(),
      [],
      undefined,
      first.run.workspaceId,
    );
    const user = testbed.ids.generate();
    const other = testbed.ids.generate();
    await ensureUserRow(testbed.module, user);
    await ensureUserRow(testbed.module, other);
    await seedNotification(first, user);
    await seedNotification(second, user);
    await seedNotification(first, other);

    const marked = await testbed.tenants.run(first.run.workspaceId, () =>
      notifications.markPlatformReadForConversation(
        first.run.workspaceId,
        user,
        first.run.conversationId,
        READ_AT,
      ),
    );

    expect(marked).toBe(1);
    expect(
      await testbed.tenants.run(first.run.workspaceId, () =>
        notifications.countUnreadPlatform(first.run.workspaceId, user),
      ),
    ).toBe(1);
    expect(
      await testbed.tenants.run(first.run.workspaceId, () =>
        notifications.countUnreadPlatform(first.run.workspaceId, other),
      ),
    ).toBe(1);
  });
});
