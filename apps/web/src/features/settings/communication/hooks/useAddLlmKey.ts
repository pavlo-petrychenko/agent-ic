import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { AddLlmKeyDocument } from '@/features/settings/communication/gql/mutation/addLlmKey.generated';
import { LlmKeysDocument } from '@/features/settings/communication/gql/query/llmKeys.generated';
import type { AddLlmKeyInput } from '@/shared/api/generated/schema.generated';

export function useAddLlmKey(): (input: AddLlmKeyInput) => Promise<void> {
  const [addLlmKey] = useMutation(AddLlmKeyDocument, {
    refetchQueries: [LlmKeysDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (input) => {
      await addLlmKey({ variables: { input } });
    },
    [addLlmKey],
  );
}
