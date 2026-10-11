import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { RequestMyEmailChangeDocument } from '@/features/settings/communication/gql/mutation/requestMyEmailChange.generated';

export function useRequestMyEmailChange(): (email: string) => Promise<void> {
  const [requestMyEmailChange] = useMutation(RequestMyEmailChangeDocument);

  return useCallback(
    async (email) => {
      await requestMyEmailChange({ variables: { input: { email } } });
    },
    [requestMyEmailChange],
  );
}
