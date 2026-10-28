import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { KnowledgeConnectionsDocument } from '@/features/knowledge/communication/gql/query/knowledgeConnections.generated';
import { toGoogleConnections } from '@/features/knowledge/communication/helpers/googleConnections.helpers';
import type { UseKnowledgeConnectionsResult } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export function useKnowledgeConnections(enabled: boolean): UseKnowledgeConnectionsResult {
  const { data, loading, error, refetch } = useQuery(KnowledgeConnectionsDocument, {
    skip: !enabled,
    fetchPolicy: 'cache-and-network',
  });
  const connections = useMemo(() => (data === undefined ? [] : toGoogleConnections(data)), [data]);
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    connections,
    loading: enabled && loading && data === undefined,
    failed: enabled && error !== undefined && data === undefined,
    retry,
  };
}
