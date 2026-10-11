import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { TestingAgentsDocument } from '@/features/testing/communication/gql/query/testingAgents.generated';
import { TESTING_AGENTS_PAGE_SIZE } from '@/features/testing/constants/testing.constants';
import type { TestingAgentsResult } from '@/features/testing/typedefs/testing.typedefs';

export function useTestingAgents(): TestingAgentsResult {
  const { data, loading, error, refetch } = useQuery(TestingAgentsDocument, {
    variables: { first: TESTING_AGENTS_PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
  });
  const agents = useMemo(() => data?.agents.edges.map(({ node }) => node) ?? null, [data]);
  return {
    agents,
    loading,
    failed: !loading && error !== undefined && agents === null,
    retry: () => void refetch(),
  };
}
