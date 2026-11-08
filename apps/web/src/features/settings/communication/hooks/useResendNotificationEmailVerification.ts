import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ResendNotificationEmailVerificationDocument } from '@/features/settings/communication/gql/mutation/resendNotificationEmailVerification.generated';
import { NotificationSettingsDocument } from '@/features/settings/communication/gql/query/notificationSettings.generated';

export function useResendNotificationEmailVerification(): () => Promise<void> {
  const [resendNotificationEmailVerification] = useMutation(
    ResendNotificationEmailVerificationDocument,
    {
      refetchQueries: [NotificationSettingsDocument],
      awaitRefetchQueries: true,
    },
  );

  return useCallback(async () => {
    await resendNotificationEmailVerification();
  }, [resendNotificationEmailVerification]);
}
