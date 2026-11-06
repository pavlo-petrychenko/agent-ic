import type {
  NotificationDeliveryStatus,
  NotificationKind,
} from '@/modules/notifications/constants/notification.constants';
import type { NotificationChannelValue } from '@/modules/notifications/typedefs/notification-settings.typedefs';

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
