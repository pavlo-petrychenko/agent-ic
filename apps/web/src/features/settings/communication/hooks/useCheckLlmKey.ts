import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CheckLlmKeyDocument } from '@/features/settings/communication/gql/mutation/checkLlmKey.generated';
import type { LlmKeyCheckInput } from '@/features/settings/typedefs/llmKey.typedefs';

export function useCheckLlmKey(): (input: LlmKeyCheckInput) => Promise<readonly string[]> {
  const [checkLlmKey] = useMutation(CheckLlmKeyDocument);

  return useCallback(
    async (input) => {
      const result = await checkLlmKey({ variables: { input } });
      return result.data?.checkLlmKey.models ?? [];
    },
    [checkLlmKey],
  );
}
