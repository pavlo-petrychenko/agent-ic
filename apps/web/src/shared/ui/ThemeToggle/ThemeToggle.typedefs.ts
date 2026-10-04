import type { ThemePreference } from '@/shared/theme/constants/theme.constants';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { ThemeToggleSize } from '@/shared/ui/ThemeToggle/ThemeToggle.constants';

export interface ThemeToggleOption {
  readonly value: ThemePreference;
  readonly icon: IconName;
}

export interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  label: string;
  optionLabels: Readonly<Record<ThemePreference, string>>;
  withLabels?: boolean;
  size?: ThemeToggleSize;
  disabled?: boolean;
  className?: string;
}
