import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { notificationDeliveries } from '@/modules/notifications/db/notification-deliveries.table';
import { notifications } from '@/modules/notifications/db/notifications.table';
import { NotificationUnavailableError } from '@/modules/notifications/errors/notification-unavailable.error';
import type {
  NewNotificationDeliveryRecord,
  NewNotificationRecord,
} from '@/modules/notifications/typedefs/notification.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class NotificationsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async insertIfAbsent(notification: NewNotificationRecord): Promise<string> {
    const [inserted] = await this.txHost.tx
      .insert(notifications)
      .values({ ...notification, createdAt: this.clock.now() })
      .onConflictDoNothing({
        target: [notifications.runStepId, notifications.userId, notifications.kind],
      })
      .returning({ id: notifications.id });
    if (inserted !== undefined) {
      return inserted.id;
    }
    const [existing] = await this.txHost.tx
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.workspaceId, notification.workspaceId),
          eq(notifications.runStepId, notification.runStepId),
          eq(notifications.userId, notification.userId),
          eq(notifications.kind, notification.kind),
        ),
      );
    if (existing === undefined) {
      throw new NotificationUnavailableError();
    }
    return existing.id;
  }

  async insertDeliveryIfAbsent(delivery: NewNotificationDeliveryRecord): Promise<void> {
    const now = this.clock.now();
    await this.txHost.tx
      .insert(notificationDeliveries)
      .values({ ...delivery, createdAt: now, updatedAt: now })
      .onConflictDoNothing({
        target: [notificationDeliveries.notificationId, notificationDeliveries.channel],
      });
  }
}
