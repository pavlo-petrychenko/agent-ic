import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RemoveLlmKeyDocument } from '@/features/settings/communication/gql/mutation/removeLlmKey.generated';
import { LlmKeysDocument } from '@/features/settings/communication/gql/query/llmKeys.generated';

export function useRemoveLlmKey(): (id: string) => Promise<void> {
  const [removeLlmKey] = useMutation(RemoveLlmKeyDocument, {
    refetchQueries: [LlmKeysDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (id) => {
      await removeLlmKey({ variables: { id } });
    },
    [removeLlmKey],
  );
}
