import { Injectable } from '@nestjs/common';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import type { MarkNotificationReadInput } from '@/modules/notifications/typedefs/notification.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
    private readonly clock: ClockService,
  ) {}

  execute(ctx: UseCaseCtx, input: MarkNotificationReadInput): Promise<number> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    return this.tenants.run(workspaceId, () =>
      this.notifications.markPlatformRead(
        workspaceId,
        userId,
        input.notificationId,
        this.clock.now(),
      ),
    );
  }
}
