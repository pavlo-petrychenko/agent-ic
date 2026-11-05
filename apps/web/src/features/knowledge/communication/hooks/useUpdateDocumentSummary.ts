import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateDocumentSummaryDocument } from '@/features/knowledge/communication/gql/mutation/updateDocumentSummary.generated';
import { KnowledgeSourceDetailDocument } from '@/features/knowledge/communication/gql/query/knowledgeSourceDetail.generated';
import type {
  UpdateDocumentSummaryResult,
  UpdateDocumentSummaryValues,
  UseUpdateDocumentSummaryResult,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useUpdateDocumentSummary(sourceId: string): UseUpdateDocumentSummaryResult {
  const [update, { loading }] = useMutation(UpdateDocumentSummaryDocument);

  const updateDocumentSummary = useCallback(
    async (values: UpdateDocumentSummaryValues): Promise<UpdateDocumentSummaryResult> => {
      const result = await update({
        variables: { input: values },
        refetchQueries: [{ query: KnowledgeSourceDetailDocument, variables: { id: sourceId } }],
        awaitRefetchQueries: true,
      });
      const document = result.data?.updateDocumentSummary;
      if (document === undefined) {
        throw new Error('The summary was not saved');
      }
      return { document };
    },
    [sourceId, update],
  );

  return { updateDocumentSummary, updating: loading };
}
