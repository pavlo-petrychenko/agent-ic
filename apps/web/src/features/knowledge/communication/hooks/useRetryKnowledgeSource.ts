import { useMutation } from '@apollo/client/react';
import { useCallback, useState } from 'react';
import { RetrySourceDocument } from '@/features/knowledge/communication/gql/mutation/retrySource.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import type { UseRetryKnowledgeSourceResult } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useRetryKnowledgeSource(knowledgeBaseId: string): UseRetryKnowledgeSourceResult {
  const [retrySource] = useMutation(RetrySourceDocument, {
    refetchQueries: [{ query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } }],
    awaitRefetchQueries: true,
  });
  const [retryingSourceId, setRetryingSourceId] = useState<string | null>(null);

  const retryKnowledgeSource = useCallback(
    async (id: string) => {
      setRetryingSourceId(id);
      try {
        await retrySource({ variables: { input: { id } } });
      } finally {
        setRetryingSourceId(null);
      }
    },
    [retrySource],
  );

  return { retryKnowledgeSource, retryingSourceId };
}
