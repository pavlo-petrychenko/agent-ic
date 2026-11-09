export const NOTIFICATIONS_SCHEMA = 'notifications';

export enum NotificationKind {
  Escalation = 'escalation',
  Reminder = 'reminder',
}

export enum NotificationChannel {
  Platform = 'platform',
  Email = 'email',
  Telegram = 'telegram',
}

export enum NotificationDeliveryStatus {
  Pending = 'pending',
  Delivered = 'delivered',
  Failed = 'failed',
  Read = 'read',
}

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  NotificationChannel.Platform,
  NotificationChannel.Email,
  NotificationChannel.Telegram,
];

export const NOTIFICATION_CHANNEL_ENABLED_BY_DEFAULT: Readonly<
  Record<NotificationChannel, boolean>
> = {
  [NotificationChannel.Platform]: true,
  [NotificationChannel.Email]: true,
  [NotificationChannel.Telegram]: false,
};

export const TELEGRAM_ALERTS_WEBHOOK_PATH = '/webhooks/telegram-alerts';
export const TELEGRAM_LINK_CODE_LENGTH = 6;
export const TELEGRAM_LINK_CODE_MAX_ATTEMPTS = 5;
export const TELEGRAM_LINK_CODE_TTL_MINUTES = 10;
