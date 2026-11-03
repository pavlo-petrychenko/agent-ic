import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateKnowledgeBaseToolDocument } from '@/features/knowledge/communication/gql/mutation/updateKnowledgeBaseTool.generated';
import { KnowledgeBasesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import type {
  UpdateKnowledgeBaseToolValues,
  UseUpdateKnowledgeBaseToolResult,
} from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export function useUpdateKnowledgeBaseTool(): UseUpdateKnowledgeBaseToolResult {
  const [update, { loading }] = useMutation(UpdateKnowledgeBaseToolDocument, {
    refetchQueries: [KnowledgeBasesDocument],
    awaitRefetchQueries: true,
  });

  const updateKnowledgeBaseTool = useCallback(
    async (values: UpdateKnowledgeBaseToolValues) => {
      const { data } = await update({ variables: { input: values } });
      if (data === undefined) {
        throw new Error('Knowledge base was not returned');
      }
      return { ...data.updateKnowledgeBaseTool };
    },
    [update],
  );

  return { updateKnowledgeBaseTool, updating: loading };
}
