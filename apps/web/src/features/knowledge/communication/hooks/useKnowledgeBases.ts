import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { KnowledgeBasesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import { toKnowledgeBases } from '@/features/knowledge/communication/helpers/knowledgeBases.helpers';
import type { UseKnowledgeBasesResult } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export function useKnowledgeBases(): UseKnowledgeBasesResult {
  const { data, loading, error, refetch } = useQuery(KnowledgeBasesDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const knowledgeBases = useMemo(() => (data === undefined ? [] : toKnowledgeBases(data)), [data]);
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    knowledgeBases,
    loading: loading && data === undefined,
    failed: error !== undefined && data === undefined,
    retry,
  };
}
