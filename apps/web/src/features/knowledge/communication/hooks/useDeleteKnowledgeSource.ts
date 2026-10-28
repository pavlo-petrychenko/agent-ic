import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeleteSourceDocument } from '@/features/knowledge/communication/gql/mutation/deleteSource.generated';
import { KnowledgeBasesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import type { UseDeleteKnowledgeSourceResult } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useDeleteKnowledgeSource(knowledgeBaseId: string): UseDeleteKnowledgeSourceResult {
  const [remove, { loading }] = useMutation(DeleteSourceDocument, {
    refetchQueries: [
      { query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } },
      KnowledgeBasesDocument,
    ],
    awaitRefetchQueries: true,
  });

  const deleteKnowledgeSource = useCallback(
    async (id: string) => {
      await remove({ variables: { input: { id } } });
    },
    [remove],
  );

  return { deleteKnowledgeSource, deleting: loading };
}
