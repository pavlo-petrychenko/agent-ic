import { useQuery, useSubscription } from '@apollo/client/react';
import { InboxCountsDocument } from '@/features/inbox/communication/gql/query/inboxCounts.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { InboxTab } from '@/features/inbox/constants/inbox.constants';

export type InboxTabCounts = Readonly<Record<InboxTab, number>>;

export const EMPTY_INBOX_COUNTS: InboxTabCounts = {
  [InboxTab.NeedsYou]: 0,
  [InboxTab.Live]: 0,
  [InboxTab.Closed]: 0,
};

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
