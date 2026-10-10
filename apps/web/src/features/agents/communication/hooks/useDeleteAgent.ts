import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DeleteAgentDocument } from '@/features/agents/communication/gql/mutation/deleteAgent.generated';
import { AgentsDocument } from '@/features/agents/communication/gql/query/agents.generated';
import type { UseDeleteAgentResult } from '@/features/agents/typedefs/agentActions.typedefs';

export function useDeleteAgent(): UseDeleteAgentResult {
  const [remove, { loading }] = useMutation(DeleteAgentDocument, {
    refetchQueries: [AgentsDocument],
    awaitRefetchQueries: true,
  });

  const deleteAgent = useCallback(
    async (id: string) => {
      await remove({ variables: { input: { id } } });
    },
    [remove],
  );

  return { deleteAgent, deleting: loading };
}
