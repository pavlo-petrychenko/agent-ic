import { Injectable } from '@nestjs/common';
import { MessagesRepository } from '@/modules/conversations';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationsRepository,
  NotificationRecipientsService,
} from '@/modules/notifications';
import type {
  DeliveryJobData,
  EscalationNotificationInput,
} from '@/modules/runs/typedefs/notification-delivery.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class EscalationNotificationService {
  constructor(
    private readonly recipients: NotificationRecipientsService,
    private readonly notifications: NotificationsRepository,
    private readonly messages: MessagesRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async create(
    workspaceId: string,
    input: EscalationNotificationInput,
  ): Promise<readonly DeliveryJobData[]> {
    const recipients = await this.recipients.recipientsFor(
      workspaceId,
      input.versionId,
      input.nodeId,
    );
    if (recipients.length === 0) {
      return [];
    }
    const lastCustomerMessage = await this.messages.findLatestCustomerMessage(
      workspaceId,
      input.conversationId,
    );
    const lastCustomerMessageId = lastCustomerMessage?.id ?? null;
    const now = this.clock.now();
    const deliveries: DeliveryJobData[] = [];
    for (const recipient of recipients) {
      const notificationId = await this.notifications.insertIfAbsent({
        id: this.ids.generate(),
        workspaceId,
        userId: recipient.userId,
        runStepId: input.runStepId,
        kind: input.kind,
        lastCustomerMessageId,
      });
      for (const channel of recipient.channels) {
        const sent = channel === NotificationChannel.Platform;
        await this.notifications.insertDeliveryIfAbsent({
          id: this.ids.generate(),
          workspaceId,
          notificationId,
          channel,
          status: sent ? NotificationDeliveryStatus.Delivered : NotificationDeliveryStatus.Pending,
          sentAt: sent ? now : null,
          readAt: null,
          attempts: 0,
          nextAttemptAt: sent ? null : now,
          lockedUntil: null,
          lastError: null,
        });
        if (channel === NotificationChannel.Email || channel === NotificationChannel.Telegram) {
          deliveries.push({ notificationId, channel });
        }
      }
    }
    return deliveries;
  }
}
