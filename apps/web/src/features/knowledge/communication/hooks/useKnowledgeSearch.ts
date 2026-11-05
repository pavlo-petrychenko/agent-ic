import { useLazyQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { SearchKnowledgeDocument } from '@/features/knowledge/communication/gql/query/searchKnowledge.generated';
import { toKnowledgeSearchResults } from '@/features/knowledge/communication/helpers/knowledgeSearch.helpers';
import type { UseKnowledgeSearchResult } from '@/features/knowledge/typedefs/knowledgeSearch.typedefs';

export function useKnowledgeSearch(knowledgeBaseId: string): UseKnowledgeSearchResult {
  const [runSearch, { data, loading, error, called }] = useLazyQuery(SearchKnowledgeDocument, {
    fetchPolicy: 'no-cache',
  });
  const results = useMemo(() => (data === undefined ? [] : toKnowledgeSearchResults(data)), [data]);
  const search = useCallback(
    async (query: string, topK: number) => {
      await runSearch({
        variables: { input: { knowledgeBaseId, query, topK } },
      }).catch(() => undefined);
    },
    [knowledgeBaseId, runSearch],
  );

  return {
    results,
    loading,
    failed: error !== undefined,
    error: error ?? null,
    searched: called,
    search,
  };
}
