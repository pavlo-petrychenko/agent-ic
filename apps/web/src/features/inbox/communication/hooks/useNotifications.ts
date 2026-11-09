import { skipToken, useQuery, useSubscription } from '@apollo/client/react';
import { NotificationsDocument } from '@/features/inbox/communication/gql/query/notifications.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { minutesAgo } from '@/features/inbox/communication/helpers/inboxFormat.helpers';
import { useRefetchOnFocus } from '@/features/inbox/communication/hooks/useRefetchOnFocus';
import { NOTIFICATION_LIST_SIZE } from '@/features/inbox/constants/notificationList.constants';
import type {
  NotificationListItem,
  NotificationListKind,
} from '@/features/inbox/typedefs/notificationList.typedefs';
import { NotificationKind } from '@/shared/api/generated/schema.generated';

const toKind = (kind: NotificationKind): NotificationListKind =>
  kind === NotificationKind.Reminder ? 'reminder' : 'escalation';

export interface UseNotificationsResult {
  readonly items: readonly NotificationListItem[];
  readonly loading: boolean;
  readonly refetch: () => Promise<unknown>;
}

export function useNotifications(enabled: boolean): UseNotificationsResult {
  const { data, loading, refetch } = useQuery(NotificationsDocument, {
    skip: !enabled,
    variables: { first: NOTIFICATION_LIST_SIZE, after: null, unreadOnly: false },
    fetchPolicy: 'network-only',
  });
  useSubscription(InboxActivityDocument, enabled ? { onData: () => void refetch() } : skipToken);
  useRefetchOnFocus(refetch, enabled);

  const items =
    data?.notifications?.edges?.map(({ node }) => ({
      id: node.id,
      conversationId: node.conversationId,
      kind: toKind(node.kind),
      waitingMinutes: node.waitingMinutes,
      minutesAgo: minutesAgo(node.createdAt),
      customerName: node.customerName,
      channelKind: node.channelKind,
      reason: node.reason,
      createdAt: node.createdAt,
      read: node.read,
      readAt: node.readAt,
    })) ?? [];

  return { items, loading, refetch };
}
