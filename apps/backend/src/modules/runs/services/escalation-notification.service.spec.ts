import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message, MessagesRepository } from '@/modules/conversations';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications';
import type {
  NotificationsRepository,
  NotificationRecipientsService,
} from '@/modules/notifications';
import { EscalationNotificationService } from '@/modules/runs/services/escalation-notification.service';
import type { ClockService } from '@/platform/clock/services/clock.service';
import type { IdService } from '@/platform/ids/services/id.service';

const NOW = new Date('2026-11-06T12:00:00.000Z');

describe('EscalationNotificationService', () => {
  const recipientsFor = vi.fn<NotificationRecipientsService['recipientsFor']>();
  const insertIfAbsent = vi.fn<NotificationsRepository['insertIfAbsent']>();
  const insertDeliveryIfAbsent = vi.fn<NotificationsRepository['insertDeliveryIfAbsent']>();
  const findLatestCustomerMessage = vi.fn<MessagesRepository['findLatestCustomerMessage']>();
  const now = vi.fn<ClockService['now']>();
  const generate = vi.fn<IdService['generate']>();
  let service: EscalationNotificationService;

  beforeEach(() => {
    recipientsFor.mockReset();
    insertIfAbsent.mockReset();
    insertDeliveryIfAbsent.mockReset();
    findLatestCustomerMessage.mockReset();
    now.mockReset();
    generate.mockReset();
    now.mockReturnValue(NOW);
    let sequence = 0;
    generate.mockImplementation(() => {
      sequence += 1;
      return `generated-${sequence}`;
    });
    service = new EscalationNotificationService(
      { recipientsFor } as unknown as NotificationRecipientsService,
      { insertIfAbsent, insertDeliveryIfAbsent } as unknown as NotificationsRepository,
      { findLatestCustomerMessage } as unknown as MessagesRepository,
      { now } as unknown as ClockService,
      { generate } as unknown as IdService,
    );
  });

  const input = {
    runStepId: 'step-1',
    conversationId: 'conversation-1',
    versionId: 'version-1',
    nodeId: 'node-1',
    kind: NotificationKind.Reminder,
  };

  it('creates one notification per recipient and one delivery per channel', async () => {
    recipientsFor.mockResolvedValue([
      {
        userId: 'user-1',
        channels: [
          NotificationChannel.Platform,
          NotificationChannel.Email,
          NotificationChannel.Telegram,
        ],
      },
      { userId: 'user-2', channels: [NotificationChannel.Email] },
    ]);
    findLatestCustomerMessage.mockResolvedValue({ id: 'message-1' } as unknown as Message);
    insertIfAbsent.mockImplementation(
      async (notification) => `notification-${notification.userId}`,
    );

    await expect(service.create('workspace-1', input)).resolves.toEqual([
      { notificationId: 'notification-user-1', channel: NotificationChannel.Email },
      { notificationId: 'notification-user-1', channel: NotificationChannel.Telegram },
      { notificationId: 'notification-user-2', channel: NotificationChannel.Email },
    ]);

    expect(recipientsFor).toHaveBeenCalledWith('workspace-1', 'version-1', 'node-1');
    expect(findLatestCustomerMessage).toHaveBeenCalledWith('workspace-1', 'conversation-1');
    expect(insertIfAbsent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 'user-1',
        runStepId: 'step-1',
        kind: NotificationKind.Reminder,
        lastCustomerMessageId: 'message-1',
      }),
    );
    expect(insertIfAbsent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 'user-2',
        runStepId: 'step-1',
        kind: NotificationKind.Reminder,
        lastCustomerMessageId: 'message-1',
      }),
    );
    expect(insertDeliveryIfAbsent).toHaveBeenCalledTimes(4);
    expect(insertDeliveryIfAbsent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        notificationId: 'notification-user-1',
        channel: NotificationChannel.Platform,
        status: NotificationDeliveryStatus.Delivered,
        sentAt: NOW,
        attempts: 0,
        nextAttemptAt: null,
        lockedUntil: null,
        lastError: null,
      }),
    );
    expect(insertDeliveryIfAbsent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        notificationId: 'notification-user-1',
        channel: NotificationChannel.Email,
        status: NotificationDeliveryStatus.Pending,
        sentAt: null,
        attempts: 0,
        nextAttemptAt: NOW,
        lockedUntil: null,
        lastError: null,
      }),
    );
  });

  it('does not read the last message when nobody should be notified', async () => {
    recipientsFor.mockResolvedValue([]);

    await expect(service.create('workspace-1', input)).resolves.toEqual([]);

    expect(findLatestCustomerMessage).not.toHaveBeenCalled();
    expect(insertIfAbsent).not.toHaveBeenCalled();
    expect(insertDeliveryIfAbsent).not.toHaveBeenCalled();
  });
});
