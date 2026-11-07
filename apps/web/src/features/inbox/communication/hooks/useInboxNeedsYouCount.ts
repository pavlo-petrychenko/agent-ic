import { skipToken, useQuery, useSubscription } from '@apollo/client/react';
import { InboxNeedsYouCountDocument } from '@/features/inbox/communication/gql/query/inboxNeedsYouCount.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { useRefetchOnFocus } from '@/features/inbox/communication/hooks/useRefetchOnFocus';
import { INBOX_BADGE_POLL_INTERVAL_MS } from '@/features/inbox/constants/inbox.constants';

export function useInboxNeedsYouCount(enabled: boolean): number | null {
  const { data, refetch } = useQuery(InboxNeedsYouCountDocument, {
    skip: !enabled,
    errorPolicy: 'ignore',
    fetchPolicy: 'network-only',
    pollInterval: enabled ? INBOX_BADGE_POLL_INTERVAL_MS : 0,
  });
  useSubscription(InboxActivityDocument, enabled ? { onData: () => void refetch() } : skipToken);
  useRefetchOnFocus(refetch, enabled);

  const count = data?.inboxNeedsYouCount ?? null;
  return count !== null && count > 0 ? count : null;
}
