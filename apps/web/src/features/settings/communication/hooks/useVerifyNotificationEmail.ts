import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { VerifyNotificationEmailDocument } from '@/features/settings/communication/gql/mutation/verifyNotificationEmail.generated';
import { NotificationSettingsDocument } from '@/features/settings/communication/gql/query/notificationSettings.generated';

export function useVerifyNotificationEmail(): (token: string) => Promise<void> {
  const [verifyNotificationEmail] = useMutation(VerifyNotificationEmailDocument, {
    refetchQueries: [NotificationSettingsDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (token: string) => {
      await verifyNotificationEmail({ variables: { input: { token } } });
    },
    [verifyNotificationEmail],
  );
}
