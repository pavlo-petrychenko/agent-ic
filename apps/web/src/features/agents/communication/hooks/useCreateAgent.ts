import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateAgentDocument } from '@/features/agents/communication/gql/mutation/createAgent.generated';
import type { UseCreateAgentResult } from '@/features/agents/typedefs/agent.typedefs';

export function useCreateAgent(): UseCreateAgentResult {
  const [create, { loading }] = useMutation(CreateAgentDocument);

  const createAgent = useCallback(
    async (name: string) => {
      const { data } = await create({ variables: { input: { name } } });
      return data?.createAgent.id ?? null;
    },
    [create],
  );

  return { createAgent, creating: loading };
}
