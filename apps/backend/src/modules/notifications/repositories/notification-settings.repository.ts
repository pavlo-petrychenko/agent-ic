import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { emailNotificationChannels } from '@/modules/notifications/db/email-notification-channels.table';
import { notificationChannels } from '@/modules/notifications/db/notification-channels.table';
import { notificationSettings } from '@/modules/notifications/db/notification-settings.table';
import { telegramNotificationChannels } from '@/modules/notifications/db/telegram-notification-channels.table';
import type {
  NewNotificationChannelRecord,
  NotificationChannelSettingRecord,
  NotificationChannelValue,
  NotificationSettingsRecord,
} from '@/modules/notifications/typedefs/notification-settings.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class NotificationSettingsRepository {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly clock: ClockService,
  ) {}

  async findByUser(
    workspaceId: string,
    userId: string,
  ): Promise<NotificationSettingsRecord | null> {
    const [settings] = await this.txHost.tx
      .select({
        id: notificationSettings.id,
        workspaceId: notificationSettings.workspaceId,
        userId: notificationSettings.userId,
      })
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.workspaceId, workspaceId),
          eq(notificationSettings.userId, userId),
        ),
      );
    if (settings === undefined) {
      return null;
    }
    return { ...settings, channels: await this.listChannels(workspaceId, settings.id) };
  }

  async insertIfAbsent(workspaceId: string, userId: string, id: string): Promise<string | null> {
    const now = this.clock.now();
    const [inserted] = await this.txHost.tx
      .insert(notificationSettings)
      .values({ id, workspaceId, userId, createdAt: now, updatedAt: now })
      .onConflictDoNothing({
        target: [notificationSettings.workspaceId, notificationSettings.userId],
      })
      .returning({ id: notificationSettings.id });
    if (inserted !== undefined) {
      return inserted.id;
    }
    const [existing] = await this.txHost.tx
      .select({ id: notificationSettings.id })
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.workspaceId, workspaceId),
          eq(notificationSettings.userId, userId),
        ),
      );
    return existing?.id ?? null;
  }

  listChannels(
    workspaceId: string,
    settingsId: string,
  ): Promise<NotificationChannelSettingRecord[]> {
    return this.txHost.tx
      .select({
        channel: notificationChannels.channel,
        enabled: notificationChannels.enabled,
        email: emailNotificationChannels.email,
        verifiedAt: emailNotificationChannels.verifiedAt,
        chatId: telegramNotificationChannels.chatId,
        linkedAt: telegramNotificationChannels.linkedAt,
      })
      .from(notificationChannels)
      .leftJoin(
        emailNotificationChannels,
        and(
          eq(emailNotificationChannels.workspaceId, workspaceId),
          eq(emailNotificationChannels.channelId, notificationChannels.id),
        ),
      )
      .leftJoin(
        telegramNotificationChannels,
        and(
          eq(telegramNotificationChannels.workspaceId, workspaceId),
          eq(telegramNotificationChannels.channelId, notificationChannels.id),
        ),
      )
      .where(
        and(
          eq(notificationChannels.workspaceId, workspaceId),
          eq(notificationChannels.settingsId, settingsId),
        ),
      )
      .orderBy(asc(notificationChannels.channel));
  }

  async insertChannels(channels: readonly NewNotificationChannelRecord[]): Promise<void> {
    if (channels.length === 0) {
      return;
    }
    const now = this.clock.now();
    await this.txHost.tx
      .insert(notificationChannels)
      .values(channels.map((channel) => ({ ...channel, createdAt: now, updatedAt: now })))
      .onConflictDoNothing({
        target: [notificationChannels.settingsId, notificationChannels.channel],
      });
  }

  async updateChannel(
    workspaceId: string,
    settingsId: string,
    channel: NotificationChannelValue,
    enabled: boolean,
  ): Promise<boolean> {
    const updated = await this.txHost.tx
      .update(notificationChannels)
      .set({ enabled, updatedAt: this.clock.now() })
      .where(
        and(
          eq(notificationChannels.workspaceId, workspaceId),
          eq(notificationChannels.settingsId, settingsId),
          eq(notificationChannels.channel, channel),
        ),
      )
      .returning({ id: notificationChannels.id });
    return updated.length > 0;
  }

  async setEmail(workspaceId: string, channelId: string, email: string): Promise<void> {
    const now = this.clock.now();
    await this.txHost.tx
      .insert(emailNotificationChannels)
      .values({
        channelId,
        workspaceId,
        email,
        verifiedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: emailNotificationChannels.channelId,
        set: { email, verifiedAt: null, updatedAt: now },
      });
  }
}
