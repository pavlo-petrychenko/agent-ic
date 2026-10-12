import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ChangeMyPasswordDocument } from '@/features/settings/communication/gql/mutation/changeMyPassword.generated';

export function useChangeMyPassword(): (
  currentPassword: string,
  newPassword: string,
) => Promise<void> {
  const [changeMyPassword] = useMutation(ChangeMyPasswordDocument);

  return useCallback(
    async (currentPassword, newPassword) => {
      await changeMyPassword({ variables: { input: { currentPassword, newPassword } } });
    },
    [changeMyPassword],
  );
}
