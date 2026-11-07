import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import { notificationChannels } from '@/modules/notifications/db/notification-channels.table';
import { notificationSettings } from '@/modules/notifications/db/notification-settings.table';
import { telegramNotificationChannels } from '@/modules/notifications/db/telegram-notification-channels.table';
import type { TelegramLinkRecord } from '@/modules/notifications/typedefs/notification-settings.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class TelegramLinkRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  async findByCodeHash(linkCodeHash: string): Promise<TelegramLinkRecord | null> {
    const [row] = await this.systemDb.db
      .select({
        workspaceId: telegramNotificationChannels.workspaceId,
        channelId: telegramNotificationChannels.channelId,
        settingsId: notificationChannels.settingsId,
        userId: notificationSettings.userId,
        chatId: telegramNotificationChannels.chatId,
        linkCodeExpiresAt: telegramNotificationChannels.linkCodeExpiresAt,
      })
      .from(telegramNotificationChannels)
      .innerJoin(
        notificationChannels,
        and(
          eq(notificationChannels.workspaceId, telegramNotificationChannels.workspaceId),
          eq(notificationChannels.id, telegramNotificationChannels.channelId),
        ),
      )
      .innerJoin(
        notificationSettings,
        and(
          eq(notificationSettings.workspaceId, notificationChannels.workspaceId),
          eq(notificationSettings.id, notificationChannels.settingsId),
        ),
      )
      .where(
        and(
          eq(telegramNotificationChannels.linkCodeHash, linkCodeHash),
          eq(notificationChannels.channel, NotificationChannel.Telegram),
        ),
      );
    return row ?? null;
  }
}
