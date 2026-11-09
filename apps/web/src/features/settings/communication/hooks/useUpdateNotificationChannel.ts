import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateNotificationChannelDocument } from '@/features/settings/communication/gql/mutation/updateNotificationChannel.generated';
import { NotificationSettingsDocument } from '@/features/settings/communication/gql/query/notificationSettings.generated';
import type { NotificationChannel } from '@/shared/api/generated/schema.generated';

export function useUpdateNotificationChannel(): (
  channel: NotificationChannel,
  enabled: boolean,
) => Promise<void> {
  const [updateNotificationChannel] = useMutation(UpdateNotificationChannelDocument, {
    refetchQueries: [NotificationSettingsDocument],
    awaitRefetchQueries: true,
  });

  return useCallback(
    async (channel, enabled) => {
      await updateNotificationChannel({ variables: { input: { channel, enabled } } });
    },
    [updateNotificationChannel],
  );
}
