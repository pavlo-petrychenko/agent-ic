import { skipToken, useQuery, useSubscription } from '@apollo/client/react';
import { InboxNeedsYouCountDocument } from '@/features/inbox/communication/gql/query/inboxNeedsYouCount.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';

export function useInboxNeedsYouCount(enabled: boolean): number | null {
  const { data, refetch } = useQuery(InboxNeedsYouCountDocument, {
    skip: !enabled,
    errorPolicy: 'ignore',
  });
  useSubscription(InboxActivityDocument, enabled ? { onData: () => void refetch() } : skipToken);

  const count = data?.inboxNeedsYouCount ?? null;
  return count !== null && count > 0 ? count : null;
}
