import type { Locale } from '@agent-ic/contracts';
import type { ProfileTheme } from '@/features/settings/typedefs/profile.typedefs';

export interface ProfilePreferencesFieldsProps {
  readonly locale: Locale;
  readonly theme: ProfileTheme;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly onThemeChange: (theme: ProfileTheme) => void;
}
