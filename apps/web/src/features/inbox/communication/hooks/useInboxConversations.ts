import { useQuery, useSubscription } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import type { InboxConversationsQuery } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { INBOX_CONVERSATIONS_PAGE_SIZE } from '@/features/inbox/constants/inbox.constants';
import type { InboxQueue } from '@/shared/api/generated/schema.generated';

type InboxSummary = InboxConversationsQuery['inboxConversations'][number];

const NO_SUMMARIES: readonly InboxSummary[] = [];

interface InboxPages {
  readonly key: InboxQueue;
  readonly older: readonly InboxSummary[];
  readonly lastPageSize: number;
}

export function useInboxConversations(queue: InboxQueue) {
  const [pages, setPages] = useState<InboxPages>({
    key: queue,
    older: [],
    lastPageSize: INBOX_CONVERSATIONS_PAGE_SIZE,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const { data, loading, error, refetch, fetchMore } = useQuery(InboxConversationsDocument, {
    variables: { limit: INBOX_CONVERSATIONS_PAGE_SIZE, after: null, queue },
    fetchPolicy: 'cache-and-network',
  });
  const firstPage = data?.inboxConversations ?? NO_SUMMARIES;
  const older = pages.key === queue ? pages.older : NO_SUMMARIES;
  const lastPageSize = pages.key === queue ? pages.lastPageSize : INBOX_CONVERSATIONS_PAGE_SIZE;
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
          queue,
        },
        updateQuery: (previous) => previous,
      });
      const next = result.data?.inboxConversations ?? NO_SUMMARIES;
      setPages((current) => {
        const base = current.key === queue ? current.older : NO_SUMMARIES;
        const seen = new Set([...firstPage, ...base].map((summary) => summary.id));
        return {
          key: queue,
          older: [...base, ...next.filter((summary) => !seen.has(summary.id))],
          lastPageSize: next.length,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  }, [fetchMore, firstPage, hasMore, loadingMore, queue, summaries]);

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
