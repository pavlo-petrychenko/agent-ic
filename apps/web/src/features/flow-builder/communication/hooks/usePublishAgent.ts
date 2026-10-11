import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { PublishAgentDocument } from '@/features/flow-builder/communication/gql/mutation/publishAgent.generated';
import type { UsePublishAgentResult } from '@/features/flow-builder/typedefs/publish.typedefs';

export function usePublishAgent(agentId: string): UsePublishAgentResult {
  const [publishAgent, { loading }] = useMutation(PublishAgentDocument);

  const publish = useCallback(
    async (note: string) => {
      const trimmed = note.trim();
      const { data } = await publishAgent({
        variables: { input: { id: agentId, note: trimmed === '' ? null : trimmed } },
      });
      return data?.publishAgent.version.number ?? null;
    },
    [agentId, publishAgent],
  );

  return { publish, publishing: loading };
}
