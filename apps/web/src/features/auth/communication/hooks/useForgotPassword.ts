import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ForgotPasswordDocument } from '@/features/auth/communication/gql/mutation/forgotPassword.generated';

export function useForgotPassword(): (email: string) => Promise<void> {
  const [forgotPassword] = useMutation(ForgotPasswordDocument);

  return useCallback(
    async (email) => {
      await forgotPassword({ variables: { input: { email } } });
    },
    [forgotPassword],
  );
}
