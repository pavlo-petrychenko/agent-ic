import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo } from 'react';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import { toKnowledgeSources } from '@/features/knowledge/communication/helpers/knowledgeSources.helpers';
import {
  KNOWLEDGE_SOURCE_POLL_INTERVAL_MS,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { UseKnowledgeSourcesResult } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

const isActive = (status: KnowledgeSourceStatus): boolean =>
  status === KnowledgeSourceStatus.Pending || status === KnowledgeSourceStatus.Indexing;

export function useKnowledgeSources(knowledgeBaseId: string): UseKnowledgeSourcesResult {
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    KnowledgeSourcesDocument,
    {
      variables: { knowledgeBaseId },
      fetchPolicy: 'cache-and-network',
    },
  );
  const sources = useMemo(() => (data === undefined ? [] : toKnowledgeSources(data)), [data]);
  const active = sources.some(({ status }) => isActive(status));

  useEffect(() => {
    if (!active) {
      stopPolling();
      return;
    }
    startPolling(KNOWLEDGE_SOURCE_POLL_INTERVAL_MS);
    return () => stopPolling();
  }, [active, startPolling, stopPolling]);

  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    sources,
    loading: loading && data === undefined,
    failed: error !== undefined && data === undefined,
    retry,
  };
}
