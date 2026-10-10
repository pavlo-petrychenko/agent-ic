import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RenameAgentDocument } from '@/features/flow-builder/communication/gql/mutation/renameAgent.generated';

export function useRenameAgent(agentId: string): (name: string) => Promise<void> {
  const [renameAgent] = useMutation(RenameAgentDocument);

  return useCallback(
    async (name) => {
      await renameAgent({ variables: { input: { id: agentId, name } } });
    },
    [agentId, renameAgent],
  );
}
