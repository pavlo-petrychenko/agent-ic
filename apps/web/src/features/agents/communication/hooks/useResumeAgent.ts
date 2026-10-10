import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ResumeAgentDocument } from '@/features/agents/communication/gql/mutation/resumeAgent.generated';
import type { UseResumeAgentResult } from '@/features/agents/typedefs/agentActions.typedefs';

export function useResumeAgent(): UseResumeAgentResult {
  const [resume, { loading }] = useMutation(ResumeAgentDocument);

  const resumeAgent = useCallback(
    async (id: string) => {
      await resume({ variables: { input: { id } } });
    },
    [resume],
  );

  return { resumeAgent, resuming: loading };
}
