import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ResendConfirmationDocument } from '@/features/auth/communication/gql/mutation/resendConfirmation.generated';
import { toResendInput } from '@/features/auth/communication/helpers/resendConfirmation.helpers';
import type { ResendTarget } from '@/features/auth/typedefs/confirmation.typedefs';

export function useResendConfirmation(): (target: ResendTarget) => Promise<void> {
  const [resendConfirmation] = useMutation(ResendConfirmationDocument);

  return useCallback(
    async (target) => {
      await resendConfirmation({ variables: { input: toResendInput(target) } });
    },
    [resendConfirmation],
  );
}
