import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RenameKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/renameKnowledgeBase.generated';
import { KnowledgeBasesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import type {
  RenameKnowledgeBaseValues,
  UseRenameKnowledgeBaseResult,
} from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export function useRenameKnowledgeBase(): UseRenameKnowledgeBaseResult {
  const [rename, { loading }] = useMutation(RenameKnowledgeBaseDocument, {
    refetchQueries: [KnowledgeBasesDocument],
    awaitRefetchQueries: true,
  });

  const renameKnowledgeBase = useCallback(
    async (values: RenameKnowledgeBaseValues) => {
      await rename({ variables: { input: values } });
    },
    [rename],
  );

  return { renameKnowledgeBase, renaming: loading };
}
