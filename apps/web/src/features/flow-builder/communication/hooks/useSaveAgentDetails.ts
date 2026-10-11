import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DescribeAgentDocument } from '@/features/flow-builder/communication/gql/mutation/describeAgent.generated';
import { RenameAgentDocument } from '@/features/flow-builder/communication/gql/mutation/renameAgent.generated';
import type { AgentDetails } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';

export function useSaveAgentDetails(
  agentId: string,
): (current: AgentDetails, next: AgentDetails) => Promise<void> {
  const [renameAgent] = useMutation(RenameAgentDocument);
  const [describeAgent] = useMutation(DescribeAgentDocument);

  return useCallback(
    async (current, next) => {
      if (next.name !== current.name) {
        await renameAgent({ variables: { input: { id: agentId, name: next.name } } });
      }
      if (next.description !== current.description) {
        await describeAgent({
          variables: { input: { id: agentId, description: next.description } },
        });
      }
    },
    [agentId, renameAgent, describeAgent],
  );
}
