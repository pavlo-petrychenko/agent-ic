import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { PauseAgentDocument } from '@/features/agents/communication/gql/mutation/pauseAgent.generated';
import type { UsePauseAgentResult } from '@/features/agents/typedefs/agentActions.typedefs';
import type { PauseMode } from '@/shared/api/generated/schema.generated';

export function usePauseAgent(): UsePauseAgentResult {
  const [pause, { loading }] = useMutation(PauseAgentDocument);

  const pauseAgent = useCallback(
    async (id: string, mode: PauseMode, awayMessage: string | null) => {
      await pause({ variables: { input: { id, mode, awayMessage } } });
    },
    [pause],
  );

  return { pauseAgent, pausing: loading };
}
