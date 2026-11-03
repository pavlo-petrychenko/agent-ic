import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RemoveSourceDocumentDocument } from '@/features/knowledge/communication/gql/mutation/removeSourceDocument.generated';
import { KnowledgeBasesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import { KnowledgeSourceDetailDocument } from '@/features/knowledge/communication/gql/query/knowledgeSourceDetail.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import type {
  RemoveSourceDocumentValues,
  UseRemoveSourceDocumentResult,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useRemoveSourceDocument(
  knowledgeBaseId: string,
  sourceId: string,
): UseRemoveSourceDocumentResult {
  const [remove, { loading }] = useMutation(RemoveSourceDocumentDocument, {
    refetchQueries: [
      { query: KnowledgeSourceDetailDocument, variables: { id: sourceId } },
      { query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } },
      KnowledgeBasesDocument,
    ],
    awaitRefetchQueries: true,
  });

  const removeSourceDocument = useCallback(
    async (values: RemoveSourceDocumentValues) => {
      await remove({ variables: { input: values } });
    },
    [remove],
  );

  return { removeSourceDocument, removing: loading };
}
