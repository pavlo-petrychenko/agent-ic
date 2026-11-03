import { useMutation } from '@apollo/client/react';
import { useCallback, useState } from 'react';
import { RetrySourceDocument } from '@/features/knowledge/communication/gql/mutation/retrySource.generated';
import { KnowledgeSourceDetailDocument } from '@/features/knowledge/communication/gql/query/knowledgeSourceDetail.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import type { UseRetryKnowledgeSourceResult } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useRetryKnowledgeSource(knowledgeBaseId: string): UseRetryKnowledgeSourceResult {
  const [retrySource] = useMutation(RetrySourceDocument);
  const [retryingSourceId, setRetryingSourceId] = useState<string | null>(null);

  const retryKnowledgeSource = useCallback(
    async (id: string) => {
      setRetryingSourceId(id);
      try {
        await retrySource({
          variables: { input: { id } },
          refetchQueries: [
            { query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } },
            { query: KnowledgeSourceDetailDocument, variables: { id } },
          ],
          awaitRefetchQueries: true,
        });
      } finally {
        setRetryingSourceId(null);
      }
    },
    [knowledgeBaseId, retrySource],
  );

  return { retryKnowledgeSource, retryingSourceId };
}
