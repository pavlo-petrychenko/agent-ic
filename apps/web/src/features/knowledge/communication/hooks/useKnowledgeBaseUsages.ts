import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { KnowledgeBaseUsagesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBaseUsages.generated';
import type { UseKnowledgeBaseUsagesResult } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export function useKnowledgeBaseUsages(knowledgeBaseId: string): UseKnowledgeBaseUsagesResult {
  const { data, loading, error, refetch } = useQuery(KnowledgeBaseUsagesDocument, {
    variables: { knowledgeBaseId },
    fetchPolicy: 'cache-and-network',
  });
  const usages = useMemo(
    () => (data === undefined ? [] : data.knowledgeBaseUsages.map((usage) => ({ ...usage }))),
    [data],
  );
  const retry = useCallback(() => refetch().then(() => undefined), [refetch]);

  return {
    usages,
    loading: loading && data === undefined,
    failed: error !== undefined && data === undefined,
    retry,
  };
}
