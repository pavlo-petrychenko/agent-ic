import {
  NOTIFICATIONS_SCHEMA,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications/constants/notification.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const notificationsSchema = moduleSchema(NOTIFICATIONS_SCHEMA);

export const notificationKindEnum = notificationsSchema.enum('notification_kind', [
  NotificationKind.Escalation,
  NotificationKind.Reminder,
]);

export const notificationChannelEnum = notificationsSchema.enum('notification_channel', [
  NotificationChannel.Platform,
  NotificationChannel.Email,
  NotificationChannel.Telegram,
]);

export const notificationDeliveryStatusEnum = notificationsSchema.enum(
  'notification_delivery_status',
  [
    NotificationDeliveryStatus.Pending,
    NotificationDeliveryStatus.Delivered,
    NotificationDeliveryStatus.Failed,
    NotificationDeliveryStatus.Read,
  ],
);
