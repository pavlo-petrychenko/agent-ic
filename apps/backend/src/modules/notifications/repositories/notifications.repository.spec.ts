import { ChannelKind } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationsRepository } from '@/modules/conversations';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications/constants/notification.constants';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import { ROOT_BRANCH_KEY, RunStepStatus } from '@/modules/runs';
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
    reason: string | null = null,
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
    if (reason !== null) {
      await testbed.tenants.run(seeded.run.workspaceId, () =>
        testbed.steps.finish(seeded.run.workspaceId, step.id, {
          status: RunStepStatus.Succeeded,
          output: { reason },
          port: null,
          error: null,
          toolCalls: null,
          finishedAt: testbed.clock.now(),
        }),
      );
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
        attempts: 0,
        nextAttemptAt: null,
        lockedUntil: null,
        lastError: null,
      });
      await notifications.insertDeliveryIfAbsent({
        id: testbed.ids.generate(),
        workspaceId: seeded.run.workspaceId,
        notificationId,
        channel: NotificationChannel.Email,
        status: NotificationDeliveryStatus.Pending,
        sentAt: null,
        readAt: null,
        attempts: 0,
        nextAttemptAt: testbed.clock.now(),
        lockedUntil: null,
        lastError: null,
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

  it('returns the latest unread platform notification', async () => {
    const seeded = await seedExecutableRun(testbed, triggerOnlyFlow());
    const user = testbed.ids.generate();
    await ensureUserRow(testbed.module, user);
    await seedNotification(seeded, user, 'Customer asks to be called back.');
    await testbed.tenants.run(seeded.run.workspaceId, () =>
      testbed.module
        .get(ConversationsRepository)
        .markWaiting(seeded.run.workspaceId, seeded.run.conversationId),
    );

    const alert = await testbed.tenants.run(seeded.run.workspaceId, () =>
      notifications.findLatestUnreadPlatform(seeded.run.workspaceId, user),
    );

    expect(alert).toMatchObject({
      conversationId: seeded.run.conversationId,
      customerName: null,
      channelKind: ChannelKind.Simulated,
      reason: 'Customer asks to be called back.',
    });
    expect(alert?.createdAt).toBeInstanceOf(Date);

    await testbed.tenants.run(seeded.run.workspaceId, () =>
      notifications.markPlatformReadForConversation(
        seeded.run.workspaceId,
        user,
        seeded.run.conversationId,
        READ_AT,
      ),
    );
    expect(
      await testbed.tenants.run(seeded.run.workspaceId, () =>
        notifications.findLatestUnreadPlatform(seeded.run.workspaceId, user),
      ),
    ).toBeNull();
  });

  it('ignores unread notifications for conversations that no longer need a person', async () => {
    const seeded = await seedExecutableRun(testbed, triggerOnlyFlow());
    const user = testbed.ids.generate();
    await ensureUserRow(testbed.module, user);
    await seedNotification(seeded, user);
    await testbed.tenants.run(seeded.run.workspaceId, async () => {
      const conversations = testbed.module.get(ConversationsRepository);
      await conversations.markWaiting(seeded.run.workspaceId, seeded.run.conversationId);
      await conversations.close(seeded.run.workspaceId, seeded.run.conversationId, READ_AT, null);
    });

    expect(
      await testbed.tenants.run(seeded.run.workspaceId, () =>
        notifications.findLatestUnreadPlatform(seeded.run.workspaceId, user),
      ),
    ).toBeNull();
  });

  it('lists platform notifications newest first with read state and cursor pagination', async () => {
    const workspaceId = testbed.ids.generate();
    const user = testbed.ids.generate();
    await ensureUserRow(testbed.module, user);
    const first = await seedExecutableRun(testbed, triggerOnlyFlow(), [], undefined, workspaceId);
    const firstId = await seedNotification(first, user, 'first');
    testbed.clock.advanceBy(60_000);
    const second = await seedExecutableRun(testbed, triggerOnlyFlow(), [], undefined, workspaceId);
    const secondId = await seedNotification(second, user, 'second');
    testbed.clock.advanceBy(60_000);
    const third = await seedExecutableRun(testbed, triggerOnlyFlow(), [], undefined, workspaceId);
    const thirdId = await seedNotification(third, user, 'third');

    const page = await testbed.tenants.run(workspaceId, () =>
      notifications.listForUser(workspaceId, user, {
        afterId: null,
        limit: 2,
        unreadOnly: false,
      }),
    );

    expect(page.map((row) => row.id)).toEqual([thirdId, secondId]);
    expect(page[0]).toMatchObject({
      conversationId: third.run.conversationId,
      reason: 'third',
      read: false,
      readAt: null,
    });
    expect(page[0]?.createdAt).toBeInstanceOf(Date);

    const next = await testbed.tenants.run(workspaceId, () =>
      notifications.listForUser(workspaceId, user, {
        afterId: secondId,
        limit: 2,
        unreadOnly: false,
      }),
    );

    expect(next.map((row) => row.id)).toEqual([firstId]);
  });

  it('marks one notification read without touching another user', async () => {
    const seeded = await seedExecutableRun(testbed, triggerOnlyFlow());
    const user = testbed.ids.generate();
    const other = testbed.ids.generate();
    await ensureUserRow(testbed.module, user);
    await ensureUserRow(testbed.module, other);
    const notificationId = await seedNotification(seeded, user);
    await seedNotification(seeded, other);

    const marked = await testbed.tenants.run(seeded.run.workspaceId, () =>
      notifications.markPlatformRead(seeded.run.workspaceId, user, notificationId, READ_AT),
    );

    expect(marked).toBe(1);
    expect(
      await testbed.tenants.run(seeded.run.workspaceId, () =>
        notifications.markPlatformRead(seeded.run.workspaceId, other, notificationId, READ_AT),
      ),
    ).toBe(0);

    const [row] = await testbed.tenants.run(seeded.run.workspaceId, () =>
      notifications.listForUser(seeded.run.workspaceId, user, {
        afterId: null,
        limit: 10,
        unreadOnly: false,
      }),
    );

    expect(row).toMatchObject({ id: notificationId, read: true, readAt: READ_AT });
    expect(
      await testbed.tenants.run(seeded.run.workspaceId, () =>
        notifications.countUnreadPlatform(seeded.run.workspaceId, other),
      ),
    ).toBe(1);
  });

  it('marks every platform notification read for one user', async () => {
    const workspaceId = testbed.ids.generate();
    const user = testbed.ids.generate();
    const other = testbed.ids.generate();
    await ensureUserRow(testbed.module, user);
    await ensureUserRow(testbed.module, other);
    const first = await seedExecutableRun(testbed, triggerOnlyFlow(), [], undefined, workspaceId);
    await seedNotification(first, user);
    const second = await seedExecutableRun(testbed, triggerOnlyFlow(), [], undefined, workspaceId);
    await seedNotification(second, user);
    const third = await seedExecutableRun(testbed, triggerOnlyFlow(), [], undefined, workspaceId);
    await seedNotification(third, other);

    const marked = await testbed.tenants.run(workspaceId, () =>
      notifications.markAllPlatformRead(workspaceId, user, READ_AT),
    );

    expect(marked).toBe(2);
    expect(
      await testbed.tenants.run(workspaceId, () =>
        notifications.countUnreadPlatform(workspaceId, user),
      ),
    ).toBe(0);
    expect(
      await testbed.tenants.run(workspaceId, () =>
        notifications.countUnreadPlatform(workspaceId, other),
      ),
    ).toBe(1);
    expect(
      await testbed.tenants.run(workspaceId, () =>
        notifications.markAllPlatformRead(workspaceId, user, READ_AT),
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
