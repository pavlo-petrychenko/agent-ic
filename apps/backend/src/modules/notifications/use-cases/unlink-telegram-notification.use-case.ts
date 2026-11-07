import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type { NotificationSettingsView } from '@/modules/notifications/typedefs/notification-settings.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class UnlinkTelegramNotificationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
    private readonly settingsRepository: NotificationSettingsRepository,
  ) {}

  execute(ctx: UseCaseCtx): Promise<NotificationSettingsView> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    return this.tenants.run(workspaceId, async () => {
      const channelId = await this.settings.channelIdFor(
        workspaceId,
        userId,
        NotificationChannel.Telegram,
      );
      await this.settingsRepository.unlinkTelegramChat(workspaceId, channelId);
      return this.settings.setChannelEnabled(
        workspaceId,
        userId,
        NotificationChannel.Telegram,
        false,
      );
    });
  }
}
