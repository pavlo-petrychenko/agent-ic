import { skipToken, useQuery, useSubscription } from '@apollo/client/react';
import { UnreadNotificationCountDocument } from '@/features/inbox/communication/gql/query/unreadNotificationCount.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { useRefetchOnFocus } from '@/features/inbox/communication/hooks/useRefetchOnFocus';

export interface UseUnreadNotificationCountResult {
  readonly count: number;
  readonly refetch: () => Promise<unknown>;
}

export function useUnreadNotificationCount(enabled: boolean): UseUnreadNotificationCountResult {
  const { data, refetch } = useQuery(UnreadNotificationCountDocument, {
    skip: !enabled,
    fetchPolicy: 'network-only',
  });
  useSubscription(InboxActivityDocument, enabled ? { onData: () => void refetch() } : skipToken);
  useRefetchOnFocus(refetch, enabled);

  return { count: data?.unreadNotificationCount ?? 0, refetch };
}
