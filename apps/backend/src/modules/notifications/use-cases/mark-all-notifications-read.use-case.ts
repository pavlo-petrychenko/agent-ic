import { Injectable } from '@nestjs/common';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
    private readonly clock: ClockService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<number> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    return this.tenants.run(workspaceId, () =>
      this.notifications.markAllPlatformRead(workspaceId, userId, this.clock.now()),
    );
  }
}
