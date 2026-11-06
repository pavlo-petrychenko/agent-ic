import { Injectable } from '@nestjs/common';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type { NotificationSettingsView } from '@/modules/notifications/typedefs/notification-settings.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class GetNotificationSettingsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<NotificationSettingsView> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    return this.tenants.run(workspaceId, () => this.settings.describe(workspaceId, userId));
  }
}
