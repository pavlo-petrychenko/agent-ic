import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import type { NotificationAlertView } from '@/modules/notifications/typedefs/notification.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetLatestUnreadNotificationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
    private readonly ids: IdService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<NotificationAlertView | null> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    return this.tenants.run(workspaceId, async () => {
      const alert = await this.notifications.findLatestUnreadPlatform(workspaceId, userId);
      if (alert === null) {
        return null;
      }
      return {
        ...alert,
        conversationId: this.ids.toPublic(IdPrefix.Conversation, alert.conversationId),
      };
    });
  }
}
