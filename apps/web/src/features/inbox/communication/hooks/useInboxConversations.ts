import { useQuery, useSubscription } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import type { InboxConversationsQuery } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { INBOX_CONVERSATIONS_PAGE_SIZE } from '@/features/inbox/constants/inbox.constants';
import type { InboxQueryFilters } from '@/features/inbox/typedefs/filters.typedefs';

type InboxSummary = InboxConversationsQuery['inboxConversations'][number];

const NO_SUMMARIES: readonly InboxSummary[] = [];

interface InboxPages {
  readonly key: string;
  readonly older: readonly InboxSummary[];
  readonly lastPageSize: number;
}

const filtersKey = (filters: InboxQueryFilters): string =>
  JSON.stringify([filters.queue, filters.channelIds, filters.agentIds, filters.search]);

const listVariables = (filters: InboxQueryFilters) => ({
  limit: INBOX_CONVERSATIONS_PAGE_SIZE,
  after: null,
  queue: filters.queue,
  channelIds: [...filters.channelIds],
  agentIds: [...filters.agentIds],
  search: filters.search === '' ? null : filters.search,
});

export function useInboxConversations(filters: InboxQueryFilters) {
  const key = filtersKey(filters);
  const [pages, setPages] = useState<InboxPages>({
    key,
    older: [],
    lastPageSize: INBOX_CONVERSATIONS_PAGE_SIZE,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const variables = useMemo(() => listVariables(filters), [filters]);
  const { data, loading, error, refetch, fetchMore } = useQuery(InboxConversationsDocument, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
  const firstPage = data?.inboxConversations ?? NO_SUMMARIES;
  const older = pages.key === key ? pages.older : NO_SUMMARIES;
  const lastPageSize = pages.key === key ? pages.lastPageSize : INBOX_CONVERSATIONS_PAGE_SIZE;
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
          ...variables,
          after: { lastMessageAt: last.lastMessageAt, id: last.id },
        },
        updateQuery: (previous) => previous,
      });
      const next = result.data?.inboxConversations ?? NO_SUMMARIES;
      setPages((current) => {
        const base = current.key === key ? current.older : NO_SUMMARIES;
        const seen = new Set([...firstPage, ...base].map((summary) => summary.id));
        return {
          key,
          older: [...base, ...next.filter((summary) => !seen.has(summary.id))],
          lastPageSize: next.length,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  }, [fetchMore, firstPage, hasMore, key, loadingMore, summaries, variables]);

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
