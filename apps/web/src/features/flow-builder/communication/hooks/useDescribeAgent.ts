import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DescribeAgentDocument } from '@/features/flow-builder/communication/gql/mutation/describeAgent.generated';

export function useDescribeAgent(agentId: string): (description: string | null) => Promise<void> {
  const [describeAgent] = useMutation(DescribeAgentDocument);

  return useCallback(
    async (description) => {
      await describeAgent({ variables: { input: { id: agentId, description } } });
    },
    [agentId, describeAgent],
  );
}
