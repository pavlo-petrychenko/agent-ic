import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo } from 'react';
import { KnowledgeSourceDetailDocument } from '@/features/knowledge/communication/gql/query/knowledgeSourceDetail.generated';
import { toKnowledgeSourceDetail } from '@/features/knowledge/communication/helpers/knowledgeSources.helpers';
import { KnowledgeDocumentStatus } from '@/features/knowledge/constants/knowledgeDocument.constants';
import {
  KNOWLEDGE_SOURCE_POLL_INTERVAL_MS,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { UseKnowledgeSourceDetailResult } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useKnowledgeSourceDetail(sourceId: string): UseKnowledgeSourceDetailResult {
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    KnowledgeSourceDetailDocument,
    {
      variables: { id: sourceId },
      fetchPolicy: 'cache-and-network',
    },
  );
  const detail = useMemo(() => (data === undefined ? null : toKnowledgeSourceDetail(data)), [data]);
  const active =
    detail !== null &&
    (detail.source.status === KnowledgeSourceStatus.Pending ||
      detail.source.status === KnowledgeSourceStatus.Indexing ||
      detail.documents.some(
        (document) =>
          document.status === KnowledgeDocumentStatus.Pending ||
          document.status === KnowledgeDocumentStatus.Indexing,
      ));

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
    detail,
    loading: loading && detail === null,
    failed: error !== undefined && detail === null,
    retry,
  };
}
