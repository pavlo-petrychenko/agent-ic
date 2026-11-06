import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { NotificationSettingsDocument } from '@/features/settings/communication/gql/query/notificationSettings.generated';
import { toNotificationSettingsView } from '@/features/settings/communication/helpers/notificationSettings.helpers';
import type { UseNotificationSettingsResult } from '@/features/settings/typedefs/notificationSettings.typedefs';

export function useNotificationSettings(): UseNotificationSettingsResult {
  const { data, loading } = useQuery(NotificationSettingsDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const settings = useMemo(() => toNotificationSettingsView(data), [data]);
  return { settings, loading };
}
