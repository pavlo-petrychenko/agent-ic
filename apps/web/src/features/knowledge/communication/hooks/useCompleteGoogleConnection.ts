import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CompleteGoogleConnectionDocument } from '@/features/knowledge/communication/gql/mutation/completeGoogleConnection.generated';
import type { UseCompleteGoogleConnectionResult } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export function useCompleteGoogleConnection(): UseCompleteGoogleConnectionResult {
  const [complete] = useMutation(CompleteGoogleConnectionDocument);

  const completeGoogleConnection = useCallback(
    async (input: { readonly code: string; readonly state: string }): Promise<void> => {
      await complete({ variables: { input } });
    },
    [complete],
  );

  return { completeGoogleConnection };
}
