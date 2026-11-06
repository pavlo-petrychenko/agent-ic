import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, count, eq, ne, sql } from 'drizzle-orm';
import {
  NOTIFICATIONS_SCHEMA,
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@/modules/notifications/constants/notification.constants';
import { notificationDeliveries } from '@/modules/notifications/db/notification-deliveries.table';
import { notifications } from '@/modules/notifications/db/notifications.table';
import { NotificationUnavailableError } from '@/modules/notifications/errors/notification-unavailable.error';
import type {
  NewNotificationDeliveryRecord,
  NewNotificationRecord,
  NotificationDeliveryRecord,
  NotificationRecord,
} from '@/modules/notifications/typedefs/notification.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

const RUNS_SCHEMA = 'runs';
const RUN_STEPS_TABLE = 'run_steps';
const RUNS_TABLE = 'runs';
const NOTIFICATIONS_TABLE = 'notifications';

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

  async findById(workspaceId: string, id: string): Promise<NotificationRecord | null> {
    const [notification] = await this.txHost.tx
      .select()
      .from(notifications)
      .where(and(eq(notifications.workspaceId, workspaceId), eq(notifications.id, id)));
    return notification ?? null;
  }

  async findDelivery(
    workspaceId: string,
    notificationId: string,
    channel: NotificationChannel,
  ): Promise<NotificationDeliveryRecord | null> {
    const [delivery] = await this.txHost.tx
      .select()
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.workspaceId, workspaceId),
          eq(notificationDeliveries.notificationId, notificationId),
          eq(notificationDeliveries.channel, channel),
        ),
      );
    return delivery ?? null;
  }

  async markDeliveryDelivered(
    workspaceId: string,
    deliveryId: string,
    sentAt: Date,
  ): Promise<void> {
    await this.txHost.tx
      .update(notificationDeliveries)
      .set({
        status: NotificationDeliveryStatus.Delivered,
        sentAt,
        updatedAt: this.clock.now(),
      })
      .where(
        and(
          eq(notificationDeliveries.workspaceId, workspaceId),
          eq(notificationDeliveries.id, deliveryId),
          ne(notificationDeliveries.status, NotificationDeliveryStatus.Read),
        ),
      );
  }

  async markDeliveryFailed(workspaceId: string, deliveryId: string): Promise<void> {
    await this.txHost.tx
      .update(notificationDeliveries)
      .set({ status: NotificationDeliveryStatus.Failed, updatedAt: this.clock.now() })
      .where(
        and(
          eq(notificationDeliveries.workspaceId, workspaceId),
          eq(notificationDeliveries.id, deliveryId),
          ne(notificationDeliveries.status, NotificationDeliveryStatus.Delivered),
          ne(notificationDeliveries.status, NotificationDeliveryStatus.Read),
        ),
      );
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
          sql`exists (
            select 1
            from ${sql.identifier(NOTIFICATIONS_SCHEMA)}.${sql.identifier(NOTIFICATIONS_TABLE)} n
            join ${sql.identifier(RUNS_SCHEMA)}.${sql.identifier(RUN_STEPS_TABLE)} rs
              on rs.id = n.run_step_id and rs.workspace_id = n.workspace_id
            join ${sql.identifier(RUNS_SCHEMA)}.${sql.identifier(RUNS_TABLE)} r
              on r.id = rs.run_id and r.workspace_id = rs.workspace_id
            where n.id = ${notificationDeliveries.notificationId}
              and n.workspace_id = ${workspaceId}
              and n.user_id = ${userId}
              and r.conversation_id = ${conversationId}
          )`,
        ),
      )
      .returning({ id: notificationDeliveries.id });
    return updated.length;
  }
}
