import type { Locale } from '@contracts/index';

export interface LocaleSwitcherProps {
  compact?: boolean;
  onLocaleChange?: (locale: Locale) => Promise<void>;
}
