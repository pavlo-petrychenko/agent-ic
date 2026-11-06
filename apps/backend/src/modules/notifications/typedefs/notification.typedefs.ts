import type {
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications/constants/notification.constants';
import type { notificationDeliveries } from '@/modules/notifications/db/notification-deliveries.table';
import type { notifications } from '@/modules/notifications/db/notifications.table';
import type { NotificationChannelValue } from '@/modules/notifications/typedefs/notification-settings.typedefs';

export type NotificationRecord = typeof notifications.$inferSelect;

export type NotificationDeliveryRecord = typeof notificationDeliveries.$inferSelect;

export interface NewNotificationRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly runStepId: string;
  readonly kind: NotificationKind;
  readonly lastCustomerMessageId: string | null;
}

export interface NewNotificationDeliveryRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly notificationId: string;
  readonly channel: NotificationChannelValue;
  readonly status: NotificationDeliveryStatus;
  readonly sentAt: Date | null;
  readonly readAt: Date | null;
}

export interface MarkNotificationsReadInput {
  readonly conversationId: string;
}
