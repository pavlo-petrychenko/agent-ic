import { useQuery, useSubscription } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import type { InboxConversationsQuery } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { INBOX_CONVERSATIONS_PAGE_SIZE } from '@/features/inbox/constants/inbox.constants';

type InboxSummary = InboxConversationsQuery['inboxConversations'][number];

const NO_SUMMARIES: readonly InboxSummary[] = [];

export function useInboxConversations() {
  const [older, setOlder] = useState<readonly InboxSummary[]>([]);
  const [lastPageSize, setLastPageSize] = useState(INBOX_CONVERSATIONS_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const { data, loading, error, refetch, fetchMore } = useQuery(InboxConversationsDocument, {
    variables: { limit: INBOX_CONVERSATIONS_PAGE_SIZE, after: null },
    fetchPolicy: 'cache-and-network',
  });
  const firstPage = data?.inboxConversations ?? NO_SUMMARIES;
  const summaries = useMemo(() => {
    const seen = new Set<string>();
    return [...firstPage, ...older].filter((summary) => {
      if (seen.has(summary.id)) {
        return false;
      }
      seen.add(summary.id);
      return true;
    });
  }, [firstPage, older]);
  const hasMore =
    older.length > 0
      ? lastPageSize === INBOX_CONVERSATIONS_PAGE_SIZE
      : firstPage.length === INBOX_CONVERSATIONS_PAGE_SIZE;

  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);
  useSubscription(InboxActivityDocument, { onData: () => void refetch() });

  const loadMore = useCallback(async () => {
    const last: InboxSummary | undefined = summaries.at(-1);
    if (loadingMore || !hasMore || last === undefined) {
      return;
    }
    setLoadingMore(true);
    try {
      const result = await fetchMore({
        variables: {
          limit: INBOX_CONVERSATIONS_PAGE_SIZE,
          after: { lastMessageAt: last.lastMessageAt, id: last.id },
        },
        updateQuery: (previous) => previous,
      });
      const next = result.data?.inboxConversations ?? NO_SUMMARIES;
      setOlder((current) => {
        const seen = new Set([...firstPage, ...current].map((summary) => summary.id));
        return [...current, ...next.filter((summary) => !seen.has(summary.id))];
      });
      setLastPageSize(next.length);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchMore, firstPage, hasMore, loadingMore, summaries]);

  return {
    summaries,
    loading,
    failed: error !== undefined,
    retry,
    loadMore,
    loadingMore,
    hasMore,
  };
}
