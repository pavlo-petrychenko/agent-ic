import { Injectable } from '@nestjs/common';
import { and, eq, isNotNull, lt } from 'drizzle-orm';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import { notificationChannels } from '@/modules/notifications/db/notification-channels.table';
import { notificationSettings } from '@/modules/notifications/db/notification-settings.table';
import { telegramNotificationChannels } from '@/modules/notifications/db/telegram-notification-channels.table';
import type { TelegramLinkRecord } from '@/modules/notifications/typedefs/notification-settings.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class TelegramLinkRepository {
  constructor(
    private readonly systemDb: SystemDatabaseService,
    private readonly clock: ClockService,
  ) {}

  async clearExpired(): Promise<number> {
    const now = this.clock.now();
    const cleared = await this.systemDb.db
      .update(telegramNotificationChannels)
      .set({ linkCodeHash: null, linkCodeExpiresAt: null, updatedAt: now })
      .where(
        and(
          isNotNull(telegramNotificationChannels.linkCodeHash),
          lt(telegramNotificationChannels.linkCodeExpiresAt, now),
        ),
      )
      .returning({ channelId: telegramNotificationChannels.channelId });
    return cleared.length;
  }

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
