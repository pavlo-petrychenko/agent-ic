import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeleteKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/deleteKnowledgeBase.generated';
import { KnowledgeBasesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import type { UseDeleteKnowledgeBaseResult } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export function useDeleteKnowledgeBase(): UseDeleteKnowledgeBaseResult {
  const [remove, { loading }] = useMutation(DeleteKnowledgeBaseDocument, {
    refetchQueries: [KnowledgeBasesDocument],
    awaitRefetchQueries: true,
  });

  const deleteKnowledgeBase = useCallback(
    async (id: string) => {
      await remove({ variables: { input: { id } } });
    },
    [remove],
  );

  return { deleteKnowledgeBase, deleting: loading };
}
