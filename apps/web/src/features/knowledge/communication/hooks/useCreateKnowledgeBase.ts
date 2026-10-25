import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateKnowledgeBaseDocument } from '@/features/knowledge/communication/gql/mutation/createKnowledgeBase.generated';
import { KnowledgeBasesDocument } from '@/features/knowledge/communication/gql/query/knowledgeBases.generated';
import { toCreatedKnowledgeBase } from '@/features/knowledge/communication/helpers/knowledgeBases.helpers';
import type {
  CreateKnowledgeBaseValues,
  UseCreateKnowledgeBaseResult,
} from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export function useCreateKnowledgeBase(): UseCreateKnowledgeBaseResult {
  const [create, { loading }] = useMutation(CreateKnowledgeBaseDocument, {
    refetchQueries: [KnowledgeBasesDocument],
    awaitRefetchQueries: true,
  });

  const createKnowledgeBase = useCallback(
    async (values: CreateKnowledgeBaseValues) => {
      const { data } = await create({
        variables: { input: { name: values.name, description: null } },
      });
      if (data === undefined) {
        throw new Error('Knowledge base was not returned');
      }
      return toCreatedKnowledgeBase(data);
    },
    [create],
  );

  return { createKnowledgeBase, creating: loading };
}
