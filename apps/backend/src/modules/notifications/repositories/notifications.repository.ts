import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, count, eq, inArray, isNull, lt, lte, ne, or, sql } from 'drizzle-orm';
import { DELIVERY_MAX_ATTEMPTS } from '@/modules/notifications/constants/notification-delivery.constants';
import {
  NOTIFICATIONS_SCHEMA,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications/constants/notification.constants';
import { notificationDeliveries } from '@/modules/notifications/db/notification-deliveries.table';
import { notifications } from '@/modules/notifications/db/notifications.table';
import { NotificationUnavailableError } from '@/modules/notifications/errors/notification-unavailable.error';
import type {
  NewNotificationDeliveryRecord,
  NewNotificationRecord,
  NotificationAlertRecord,
  NotificationDeliveryRecord,
  NotificationRecord,
} from '@/modules/notifications/typedefs/notification.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

const RUNS_SCHEMA = 'runs';
const RUN_STEPS_TABLE = 'run_steps';
const RUNS_TABLE = 'runs';
const NOTIFICATIONS_TABLE = 'notifications';
const CONVERSATIONS_SCHEMA = 'conversations';
const CONVERSATIONS_TABLE = 'conversations';
const NEEDS_PERSON_CONVERSATION_FILTER = sql`c.mode = 'live' and c.state = 'waiting'`;

type LatestUnreadRow = Readonly<{
  id: string;
  conversation_id: string;
  kind: string;
  waiting_minutes: number | string;
  end_user_name: string | null;
  channel_kind: string | null;
  reason: string | null;
  created_at: Date | string;
}>;

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

  async existsForRunStepKind(
    workspaceId: string,
    runStepId: string,
    kind: NotificationKind,
  ): Promise<boolean> {
    const [notification] = await this.txHost.tx
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.workspaceId, workspaceId),
          eq(notifications.runStepId, runStepId),
          eq(notifications.kind, kind),
        ),
      )
      .limit(1);
    return notification !== undefined;
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

  async claimDelivery(
    workspaceId: string,
    notificationId: string,
    channel: NotificationChannel,
    now: Date,
    lockedUntil: Date,
  ): Promise<NotificationDeliveryRecord | null> {
    const [delivery] = await this.txHost.tx
      .update(notificationDeliveries)
      .set({
        attempts: sql`${notificationDeliveries.attempts} + 1`,
        lockedUntil,
        updatedAt: now,
      })
      .where(
        and(
          eq(notificationDeliveries.workspaceId, workspaceId),
          eq(notificationDeliveries.notificationId, notificationId),
          eq(notificationDeliveries.channel, channel),
          inArray(notificationDeliveries.status, [
            NotificationDeliveryStatus.Pending,
            NotificationDeliveryStatus.Failed,
          ]),
          lt(notificationDeliveries.attempts, DELIVERY_MAX_ATTEMPTS),
          or(
            isNull(notificationDeliveries.nextAttemptAt),
            lte(notificationDeliveries.nextAttemptAt, now),
          ),
          or(
            isNull(notificationDeliveries.lockedUntil),
            lte(notificationDeliveries.lockedUntil, now),
          ),
        ),
      )
      .returning();
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
        nextAttemptAt: null,
        lockedUntil: null,
        lastError: null,
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

  async markDeliveryFailed(
    workspaceId: string,
    deliveryId: string,
    failure: { readonly nextAttemptAt: Date | null; readonly lastError: string | null },
  ): Promise<void> {
    await this.txHost.tx
      .update(notificationDeliveries)
      .set({
        status: NotificationDeliveryStatus.Failed,
        nextAttemptAt: failure.nextAttemptAt,
        lockedUntil: null,
        lastError: failure.lastError,
        updatedAt: this.clock.now(),
      })
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

  async findLatestUnreadPlatform(
    workspaceId: string,
    userId: string,
  ): Promise<NotificationAlertRecord | null> {
    const { rows } = await this.txHost.tx.execute<LatestUnreadRow>(sql`
      select n.id,
             r.conversation_id,
             n.kind,
             case
               when c.last_escalated_at is null then 0
               else greatest(1, round(extract(epoch from (n.created_at - c.last_escalated_at)) / 60))
             end as waiting_minutes,
             c.end_user_name,
             c.channel_kind,
             coalesce(rs.output->>'reason', rs.output->>'outcome_reason', rs.error->>'message') as reason,
             n.created_at
      from ${sql.identifier(NOTIFICATIONS_SCHEMA)}.${sql.identifier(NOTIFICATIONS_TABLE)} n
      join ${sql.identifier(NOTIFICATIONS_SCHEMA)}.${sql.identifier('notification_deliveries')} d
        on d.notification_id = n.id and d.workspace_id = n.workspace_id
      join ${sql.identifier(RUNS_SCHEMA)}.${sql.identifier(RUN_STEPS_TABLE)} rs
        on rs.id = n.run_step_id and rs.workspace_id = n.workspace_id
      join ${sql.identifier(RUNS_SCHEMA)}.${sql.identifier(RUNS_TABLE)} r
        on r.id = rs.run_id and r.workspace_id = rs.workspace_id
      join ${sql.identifier(CONVERSATIONS_SCHEMA)}.${sql.identifier(CONVERSATIONS_TABLE)} c
        on c.id = r.conversation_id and c.workspace_id = r.workspace_id
      where n.workspace_id = ${workspaceId}
        and n.user_id = ${userId}
        and d.channel = ${NotificationChannel.Platform}
        and d.status <> ${NotificationDeliveryStatus.Read}
        and ${NEEDS_PERSON_CONVERSATION_FILTER}
      order by n.created_at desc
      limit 1
    `);
    const row = rows[0];
    return row === undefined
      ? null
      : {
          id: row.id,
          conversationId: row.conversation_id,
          kind:
            row.kind === NotificationKind.Reminder
              ? NotificationKind.Reminder
              : NotificationKind.Escalation,
          waitingMinutes: Number(row.waiting_minutes),
          customerName: row.end_user_name,
          channelKind: row.channel_kind,
          reason: row.reason,
          createdAt: new Date(row.created_at),
        };
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
