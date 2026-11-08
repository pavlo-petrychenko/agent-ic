import type { notificationChannels } from '@/modules/notifications/db/notification-channels.table';

export type NotificationChannelValue = (typeof notificationChannels.$inferSelect)['channel'];

interface NotificationSettingsHeader {
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
  readonly telegramUsername: string | null;
  readonly linkedAt: Date | null;
}

export interface NotificationSettingsRecord extends NotificationSettingsHeader {
  readonly channels: readonly NotificationChannelSettingRecord[];
}

export interface EmailVerificationRecord {
  readonly channelId: string;
  readonly email: string | null;
  readonly verificationExpiresAt: Date | null;
  readonly verifiedAt: Date | null;
}

export interface TelegramLinkRecord {
  readonly workspaceId: string;
  readonly channelId: string;
  readonly settingsId: string;
  readonly userId: string;
  readonly chatId: string | null;
  readonly linkCodeExpiresAt: Date | null;
}

export interface NewNotificationChannelRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly settingsId: string;
  readonly channel: NotificationChannelValue;
  readonly enabled: boolean;
}

interface PlatformNotificationSettingView {
  readonly enabled: boolean;
}

interface EmailNotificationSettingView {
  readonly enabled: boolean;
  readonly email: string | null;
  readonly verifiedAt: Date | null;
}

interface TelegramNotificationSettingView {
  readonly enabled: boolean;
  readonly linked: boolean;
  readonly username: string | null;
  readonly botUsername: string | null;
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

export interface VerifyNotificationEmailInput {
  readonly token: string;
}
