import { Injectable } from '@nestjs/common';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CountUnreadNotificationsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
  ) {}

  execute(ctx: UseCaseCtx): Promise<number> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    return this.tenants.run(workspaceId, () =>
      this.notifications.countUnreadPlatform(workspaceId, userId),
    );
  }
}
