import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { SetLlmKeyFallbackDocument } from '@/features/settings/communication/gql/mutation/setLlmKeyFallback.generated';
import { LlmKeysDocument } from '@/features/settings/communication/gql/query/llmKeys.generated';

export function useSetLlmKeyFallback(): (id: string, enabled: boolean) => Promise<void> {
  const [setLlmKeyFallback] = useMutation(SetLlmKeyFallbackDocument, {
    refetchQueries: [LlmKeysDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (id, enabled) => {
      await setLlmKeyFallback({ variables: { id, enabled } });
    },
    [setLlmKeyFallback],
  );
}
