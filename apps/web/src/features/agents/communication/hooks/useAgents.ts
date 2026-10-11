import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { AgentsDocument } from '@/features/agents/communication/gql/query/agents.generated';
import { toAgentListPage } from '@/features/agents/communication/helpers/agent.helpers';
import { AGENTS_PAGE_SIZE } from '@/features/agents/constants/agentList.constants';

export function useAgents() {
  const { data, loading, error, networkStatus, fetchMore, refetch } = useQuery(AgentsDocument, {
    variables: { first: AGENTS_PAGE_SIZE, after: null },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  const page = useMemo(() => (data === undefined ? null : toAgentListPage(data)), [data]);

  const loadMore = useCallback(async () => {
    if (page === null || !page.hasNextPage) {
      return;
    }
    await fetchMore({
      variables: { first: AGENTS_PAGE_SIZE, after: page.endCursor },
      updateQuery: (previous, { fetchMoreResult }) => ({
        agents: {
          ...fetchMoreResult.agents,
          edges: [...previous.agents.edges, ...fetchMoreResult.agents.edges],
        },
      }),
    });
  }, [fetchMore, page]);

  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    agents: page?.agents ?? [],
    loading: loading && page === null,
    failed: error !== undefined && page === null,
    hasNextPage: page?.hasNextPage ?? false,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    loadMore,
    retry,
  };
}
