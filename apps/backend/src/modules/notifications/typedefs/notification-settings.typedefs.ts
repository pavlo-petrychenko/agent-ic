import type { notificationChannels } from '@/modules/notifications/db/notification-channels.table';

export type NotificationChannelValue = (typeof notificationChannels.$inferSelect)['channel'];

export interface NotificationSettingsHeader {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
}

export interface NotificationChannelSettingRecord {
  readonly id: string;
  readonly channel: NotificationChannelValue;
  readonly enabled: boolean;
  readonly email: string | null;
  readonly verifiedAt: Date | null;
  readonly chatId: string | null;
  readonly linkedAt: Date | null;
}

export interface NotificationSettingsRecord extends NotificationSettingsHeader {
  readonly channels: readonly NotificationChannelSettingRecord[];
}

export interface NewNotificationChannelRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly settingsId: string;
  readonly channel: NotificationChannelValue;
  readonly enabled: boolean;
}

export interface PlatformNotificationSettingView {
  readonly enabled: boolean;
}

export interface EmailNotificationSettingView {
  readonly enabled: boolean;
  readonly email: string | null;
  readonly verifiedAt: Date | null;
}

export interface TelegramNotificationSettingView {
  readonly enabled: boolean;
  readonly linked: boolean;
  readonly linkedAt: Date | null;
}

export interface NotificationSettingsView {
  readonly platform: PlatformNotificationSettingView;
  readonly email: EmailNotificationSettingView;
  readonly telegram: TelegramNotificationSettingView;
}

export interface UpdateNotificationChannelInput {
  readonly channel: NotificationChannelValue;
  readonly enabled: boolean;
}

export interface UpdateNotificationEmailInput {
  readonly email: string;
}
