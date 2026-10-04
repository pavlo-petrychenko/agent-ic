import { useSyncExternalStore } from 'react';
import { getThemeClient } from '@/shared/theme/clients/theme.client';
import type { ThemeState } from '@/shared/theme/typedefs/theme.typedefs';

export const useTheme = (): ThemeState => {
  const client = getThemeClient();
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot);
  return { ...snapshot, setPreference: client.setPreference };
};
