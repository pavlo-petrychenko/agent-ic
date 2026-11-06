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
