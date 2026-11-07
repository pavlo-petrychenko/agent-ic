import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UnlinkTelegramNotificationDocument } from '@/features/settings/communication/gql/mutation/unlinkTelegramNotification.generated';
import { NotificationSettingsDocument } from '@/features/settings/communication/gql/query/notificationSettings.generated';

export function useUnlinkTelegramNotification(): () => Promise<void> {
  const [unlinkTelegramNotification] = useMutation(UnlinkTelegramNotificationDocument, {
    refetchQueries: [NotificationSettingsDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    () => unlinkTelegramNotification().then(() => undefined),
    [unlinkTelegramNotification],
  );
}
