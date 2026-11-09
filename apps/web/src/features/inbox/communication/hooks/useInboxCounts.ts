import { useQuery, useSubscription } from '@apollo/client/react';
import { useMemo } from 'react';
import { InboxCountsDocument } from '@/features/inbox/communication/gql/query/inboxCounts.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { InboxTab, EMPTY_INBOX_COUNTS } from '@/features/inbox/constants/inbox.constants';
import type { InboxTabCounts } from '@/features/inbox/typedefs/counts.typedefs';
import type { InboxQueryFilters } from '@/features/inbox/typedefs/filters.typedefs';

export function useInboxCounts(filters: InboxQueryFilters): InboxTabCounts {
  const variables = useMemo(
    () => ({
      input: {
        channelIds: [...filters.channelIds],
        agentIds: [...filters.agentIds],
        search: filters.search === '' ? null : filters.search,
      },
    }),
    [filters],
  );
  const { data, refetch } = useQuery(InboxCountsDocument, {
    variables,
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
