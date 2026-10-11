import type { Locale } from '@agent-ic/contracts';
import type { ProfileTheme } from '@/features/settings/typedefs/profile.typedefs';

export interface ProfileDetailsCardProps {
  readonly name: string;
  readonly email: string;
  readonly locale: Locale;
  readonly theme: ProfileTheme;
  readonly saving: boolean;
  readonly onNameChange: (name: string) => void;
  readonly onEmailChange: () => void;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly onThemeChange: (theme: ProfileTheme) => void;
  readonly onSave: () => void;
}
