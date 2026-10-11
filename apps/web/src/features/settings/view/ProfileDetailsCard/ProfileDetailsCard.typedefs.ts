import type { Locale } from '@agent-ic/contracts';
import type { ProfileTheme } from '@/features/settings/typedefs/profile.typedefs';

export interface ProfileDetailsCardProps {
  readonly name: string;
  readonly email: string;
  readonly emailDraft: string;
  readonly emailEditing: boolean;
  readonly emailSending: boolean;
  readonly locale: Locale;
  readonly theme: ProfileTheme;
  readonly saving: boolean;
  readonly onNameChange: (name: string) => void;
  readonly onEmailDraftChange: (email: string) => void;
  readonly onEmailEdit: () => void;
  readonly onEmailCancel: () => void;
  readonly onEmailSubmit: () => void;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly onThemeChange: (theme: ProfileTheme) => void;
  readonly onSave: () => void;
}
