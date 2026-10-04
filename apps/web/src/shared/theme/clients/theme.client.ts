import {
  DARK_COLOR_SCHEME_QUERY,
  MEDIA_QUERY_CHANGE_EVENT,
  type ThemePreference,
} from '@/shared/theme/constants/theme.constants';
import {
  applyResolvedTheme,
  buildThemeSnapshot,
  readStoredPreference,
  storePreference,
} from '@/shared/theme/helpers/theme.helpers';
import type { ThemeClient, ThemeEnvironment } from '@/shared/theme/typedefs/theme.typedefs';

export const createThemeClient = (environment: ThemeEnvironment): ThemeClient => {
  const listeners = new Set<() => void>();
  let snapshot = buildThemeSnapshot(
    readStoredPreference(environment.getStorage),
    environment.colorSchemeQuery.matches,
  );

  const update = (preference: ThemePreference): void => {
    snapshot = buildThemeSnapshot(preference, environment.colorSchemeQuery.matches);
    applyResolvedTheme(environment.root, snapshot.resolvedTheme);
    listeners.forEach((listener) => listener());
  };

  environment.colorSchemeQuery.addEventListener(MEDIA_QUERY_CHANGE_EVENT, () =>
    update(snapshot.preference),
  );
  applyResolvedTheme(environment.root, snapshot.resolvedTheme);

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setPreference: (preference) => {
      storePreference(environment.getStorage, preference);
      update(preference);
    },
  };
};

let browserThemeClient: ThemeClient | null = null;

export const getThemeClient = (): ThemeClient => {
  browserThemeClient ??= createThemeClient({
    getStorage: () => window.localStorage,
    root: document.documentElement,
    colorSchemeQuery: window.matchMedia(DARK_COLOR_SCHEME_QUERY),
  });
  return browserThemeClient;
};
