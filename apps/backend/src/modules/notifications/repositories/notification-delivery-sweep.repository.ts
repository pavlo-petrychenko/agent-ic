import { Injectable } from '@nestjs/common';
import { and, asc, inArray, isNotNull, isNull, lt, lte, or } from 'drizzle-orm';
import { DELIVERY_MAX_ATTEMPTS } from '@/modules/notifications/constants/notification-delivery.constants';
import { NotificationDeliveryStatus } from '@/modules/notifications/constants/notification.constants';
import { notificationDeliveries } from '@/modules/notifications/db/notification-deliveries.table';
import type { NotificationDeliverySweepRow } from '@/modules/notifications/typedefs/notification.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class NotificationDeliverySweepRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  findDue(now: Date, limit: number): Promise<NotificationDeliverySweepRow[]> {
    return this.systemDb.db
      .select({
        id: notificationDeliveries.id,
        workspaceId: notificationDeliveries.workspaceId,
        notificationId: notificationDeliveries.notificationId,
        channel: notificationDeliveries.channel,
      })
      .from(notificationDeliveries)
      .where(
        and(
          inArray(notificationDeliveries.status, [
            NotificationDeliveryStatus.Pending,
            NotificationDeliveryStatus.Failed,
          ]),
          lt(notificationDeliveries.attempts, DELIVERY_MAX_ATTEMPTS),
          isNotNull(notificationDeliveries.nextAttemptAt),
          lte(notificationDeliveries.nextAttemptAt, now),
          or(
            isNull(notificationDeliveries.lockedUntil),
            lte(notificationDeliveries.lockedUntil, now),
          ),
        ),
      )
      .orderBy(asc(notificationDeliveries.nextAttemptAt))
      .limit(limit);
  }
}
