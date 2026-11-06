import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, count, eq, inArray, ne } from 'drizzle-orm';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@/modules/notifications/constants/notification.constants';
import { notificationDeliveries } from '@/modules/notifications/db/notification-deliveries.table';
import { notifications } from '@/modules/notifications/db/notifications.table';
import { NotificationUnavailableError } from '@/modules/notifications/errors/notification-unavailable.error';
import type {
  NewNotificationDeliveryRecord,
  NewNotificationRecord,
} from '@/modules/notifications/typedefs/notification.typedefs';
import { runSteps } from '@/modules/runs/db/run-steps.table';
import { runs } from '@/modules/runs/db/runs.table';
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

  async countUnreadPlatform(workspaceId: string, userId: string): Promise<number> {
    const [row] = await this.txHost.tx
      .select({ total: count() })
      .from(notificationDeliveries)
      .innerJoin(
        notifications,
        and(
          eq(notifications.workspaceId, notificationDeliveries.workspaceId),
          eq(notifications.id, notificationDeliveries.notificationId),
        ),
      )
      .where(
        and(
          eq(notificationDeliveries.workspaceId, workspaceId),
          eq(notificationDeliveries.channel, NotificationChannel.Platform),
          ne(notificationDeliveries.status, NotificationDeliveryStatus.Read),
          eq(notifications.userId, userId),
        ),
      );
    return row?.total ?? 0;
  }

  async markPlatformReadForConversation(
    workspaceId: string,
    userId: string,
    conversationId: string,
    readAt: Date,
  ): Promise<number> {
    const notificationIds = await this.txHost.tx
      .select({ id: notifications.id })
      .from(notifications)
      .innerJoin(
        runSteps,
        and(
          eq(runSteps.workspaceId, notifications.workspaceId),
          eq(runSteps.id, notifications.runStepId),
        ),
      )
      .innerJoin(runs, and(eq(runs.workspaceId, runSteps.workspaceId), eq(runs.id, runSteps.runId)))
      .where(
        and(
          eq(notifications.workspaceId, workspaceId),
          eq(notifications.userId, userId),
          eq(runs.conversationId, conversationId),
        ),
      );
    if (notificationIds.length === 0) {
      return 0;
    }
    const updated = await this.txHost.tx
      .update(notificationDeliveries)
      .set({
        status: NotificationDeliveryStatus.Read,
        readAt,
        updatedAt: this.clock.now(),
      })
      .where(
        and(
          eq(notificationDeliveries.workspaceId, workspaceId),
          eq(notificationDeliveries.channel, NotificationChannel.Platform),
          ne(notificationDeliveries.status, NotificationDeliveryStatus.Read),
          inArray(
            notificationDeliveries.notificationId,
            notificationIds.map(({ id }) => id),
          ),
        ),
      )
      .returning({ id: notificationDeliveries.id });
    return updated.length;
  }
}
