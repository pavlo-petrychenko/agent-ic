import { useMutation } from '@apollo/client/react';
import { useCallback, useState } from 'react';
import { SyncSourceDocument } from '@/features/knowledge/communication/gql/mutation/syncSource.generated';
import { KnowledgeSourceDetailDocument } from '@/features/knowledge/communication/gql/query/knowledgeSourceDetail.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import type { UseSyncKnowledgeSourceResult } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useSyncKnowledgeSource(knowledgeBaseId: string): UseSyncKnowledgeSourceResult {
  const [syncSource] = useMutation(SyncSourceDocument);
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);

  const syncKnowledgeSource = useCallback(
    async (id: string) => {
      setSyncingSourceId(id);
      try {
        await syncSource({
          variables: { input: { id } },
          refetchQueries: [
            { query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } },
            { query: KnowledgeSourceDetailDocument, variables: { id } },
          ],
          awaitRefetchQueries: true,
        });
      } finally {
        setSyncingSourceId(null);
      }
    },
    [knowledgeBaseId, syncSource],
  );

  return { syncKnowledgeSource, syncingSourceId };
}
