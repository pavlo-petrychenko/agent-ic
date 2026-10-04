import type { ResolvedTheme, ThemePreference } from '@/shared/theme/constants/theme.constants';

export interface ThemeSnapshot {
  readonly preference: ThemePreference;
  readonly resolvedTheme: ResolvedTheme;
}

export interface ThemeEnvironment {
  readonly getStorage: () => Storage;
  readonly root: HTMLElement;
  readonly colorSchemeQuery: MediaQueryList;
}

export interface ThemeClient {
  readonly getSnapshot: () => ThemeSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly setPreference: (preference: ThemePreference) => void;
}

export interface ThemeState extends ThemeSnapshot {
  readonly setPreference: (preference: ThemePreference) => void;
}
