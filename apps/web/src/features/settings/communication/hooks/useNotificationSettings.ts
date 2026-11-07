import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo } from 'react';
import { NotificationSettingsDocument } from '@/features/settings/communication/gql/query/notificationSettings.generated';
import { toNotificationSettingsView } from '@/features/settings/communication/helpers/notificationSettings.helpers';
import type { UseNotificationSettingsResult } from '@/features/settings/typedefs/notificationSettings.typedefs';

export function useNotificationSettings(pollInterval = 0): UseNotificationSettingsResult {
  const { data, loading, refetch, stopPolling } = useQuery(NotificationSettingsDocument, {
    fetchPolicy: 'network-only',
    pollInterval,
  });
  const settings = useMemo(() => toNotificationSettingsView(data), [data]);
  useEffect(() => {
    if (settings.telegramLinked) {
      stopPolling();
    }
  }, [settings.telegramLinked, stopPolling]);
  return { settings, loading, refetch };
}
