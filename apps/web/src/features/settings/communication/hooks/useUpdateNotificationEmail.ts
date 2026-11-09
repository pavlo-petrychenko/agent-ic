import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateNotificationEmailDocument } from '@/features/settings/communication/gql/mutation/updateNotificationEmail.generated';
import { NotificationSettingsDocument } from '@/features/settings/communication/gql/query/notificationSettings.generated';

export function useUpdateNotificationEmail(): (email: string) => Promise<void> {
  const [updateNotificationEmail] = useMutation(UpdateNotificationEmailDocument, {
    refetchQueries: [NotificationSettingsDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (email) => {
      await updateNotificationEmail({ variables: { input: { email } } });
    },
    [updateNotificationEmail],
  );
}
