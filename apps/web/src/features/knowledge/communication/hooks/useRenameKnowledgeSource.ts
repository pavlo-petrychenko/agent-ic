import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RenameSourceDocument } from '@/features/knowledge/communication/gql/mutation/renameSource.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import type {
  RenameKnowledgeSourceValues,
  UseRenameKnowledgeSourceResult,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useRenameKnowledgeSource(knowledgeBaseId: string): UseRenameKnowledgeSourceResult {
  const [rename, { loading }] = useMutation(RenameSourceDocument, {
    refetchQueries: [{ query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } }],
    awaitRefetchQueries: true,
  });

  const renameKnowledgeSource = useCallback(
    async (values: RenameKnowledgeSourceValues) => {
      await rename({ variables: { input: values } });
    },
    [rename],
  );

  return { renameKnowledgeSource, renaming: loading };
}
