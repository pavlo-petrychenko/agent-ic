import type { ThemePreference } from '@/shared/theme/constants/theme.constants';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { ThemeToggleVariant } from '@/shared/ui/ThemeToggle/ThemeToggle.constants';

export interface ThemeToggleOption {
  readonly value: ThemePreference;
  readonly icon: IconName;
}

export interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  variant: ThemeToggleVariant;
  labels: Readonly<Record<ThemePreference, string>>;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}
