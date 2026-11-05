import { useQuery, useSubscription } from '@apollo/client/react';
import { InboxCountsDocument } from '@/features/inbox/communication/gql/query/inboxCounts.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { InboxTab, EMPTY_INBOX_COUNTS } from '@/features/inbox/constants/inbox.constants';
import type { InboxTabCounts } from '@/features/inbox/typedefs/counts.typedefs';

export function useInboxCounts(): InboxTabCounts {
  const { data, refetch } = useQuery(InboxCountsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  useSubscription(InboxActivityDocument, { onData: () => void refetch() });

  if (data === undefined) {
    return EMPTY_INBOX_COUNTS;
  }
  return {
    [InboxTab.NeedsYou]: data.inboxCounts.needsYou,
    [InboxTab.Live]: data.inboxCounts.live,
    [InboxTab.Closed]: data.inboxCounts.closed,
  };
}
