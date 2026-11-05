import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateSourceScheduleDocument } from '@/features/knowledge/communication/gql/mutation/updateSourceSchedule.generated';
import { KnowledgeSourceDetailDocument } from '@/features/knowledge/communication/gql/query/knowledgeSourceDetail.generated';
import { KnowledgeSourcesDocument } from '@/features/knowledge/communication/gql/query/knowledgeSources.generated';
import { toGraphqlKnowledgeSyncInterval } from '@/features/knowledge/communication/helpers/knowledgeSources.helpers';
import type {
  UpdateKnowledgeSourceScheduleValues,
  UseUpdateKnowledgeSourceScheduleResult,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export function useUpdateKnowledgeSourceSchedule(
  knowledgeBaseId: string,
  sourceId: string,
): UseUpdateKnowledgeSourceScheduleResult {
  const [update, { loading }] = useMutation(UpdateSourceScheduleDocument, {
    refetchQueries: [
      { query: KnowledgeSourceDetailDocument, variables: { id: sourceId } },
      { query: KnowledgeSourcesDocument, variables: { knowledgeBaseId } },
    ],
    awaitRefetchQueries: true,
  });

  const updateKnowledgeSourceSchedule = useCallback(
    async (values: UpdateKnowledgeSourceScheduleValues) => {
      await update({
        variables: {
          input: {
            id: values.id,
            syncInterval: toGraphqlKnowledgeSyncInterval(values.syncInterval),
            syncTime: values.syncTime,
            syncWeekday: values.syncWeekday,
          },
        },
      });
    },
    [update],
  );

  return {
    updateKnowledgeSourceSchedule,
    updating: loading,
  };
}
