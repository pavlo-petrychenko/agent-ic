import { NotificationKind } from '@/modules/notifications/constants/notification.constants';
import type {
  NotificationListItemView,
  NotificationsPage,
} from '@/modules/notifications/typedefs/notification.typedefs';
import type {
  Notification as GraphqlNotification,
  NotificationConnection as GraphqlNotificationConnection,
} from '@/platform/graphql-server/generated/schema.generated';
import { NotificationKind as GraphqlNotificationKind } from '@/platform/graphql-server/generated/schema.generated';

const toGraphqlKind = (kind: NotificationKind): GraphqlNotificationKind =>
  kind === NotificationKind.Reminder
    ? GraphqlNotificationKind.Reminder
    : GraphqlNotificationKind.Escalation;

export const toGraphqlNotification = (
  notification: NotificationListItemView,
): GraphqlNotification => ({
  id: notification.id,
  conversationId: notification.conversationId,
  kind: toGraphqlKind(notification.kind),
  waitingMinutes: notification.waitingMinutes,
  customerName: notification.customerName,
  channelKind: notification.channelKind,
  reason: notification.reason,
  createdAt: notification.createdAt.toISOString(),
  read: notification.read,
  readAt: notification.readAt?.toISOString() ?? null,
});

export const toGraphqlNotificationConnection = (
  page: NotificationsPage,
): GraphqlNotificationConnection => ({
  edges: page.edges.map((edge) => ({
    cursor: edge.cursor,
    node: toGraphqlNotification(edge.node),
  })),
  pageInfo: page.pageInfo,
});
