import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { DuplicateAgentDocument } from '@/features/agents/communication/gql/mutation/duplicateAgent.generated';
import { AgentsDocument } from '@/features/agents/communication/gql/query/agents.generated';
import type { UseDuplicateAgentResult } from '@/features/agents/typedefs/agentActions.typedefs';

export function useDuplicateAgent(): UseDuplicateAgentResult {
  const [duplicate, { loading }] = useMutation(DuplicateAgentDocument, {
    refetchQueries: [AgentsDocument],
    awaitRefetchQueries: true,
  });

  const duplicateAgent = useCallback(
    async (id: string) => {
      const { data } = await duplicate({ variables: { input: { id } } });
      return data?.duplicateAgent.name ?? null;
    },
    [duplicate],
  );

  return { duplicateAgent, duplicating: loading };
}
