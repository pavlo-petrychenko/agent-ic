import { ThemePreference } from '@/shared/theme/constants/theme.constants';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { ThemeToggleOption } from '@/shared/ui/ThemeToggle/ThemeToggle.typedefs';

export enum ThemeToggleSize {
  Sm = 'sm',
  Md = 'md',
}

export const THEME_TOGGLE_ICON_SIZE = 14;

export const THEME_TOGGLE_OPTIONS: readonly ThemeToggleOption[] = [
  { value: ThemePreference.Light, icon: IconName.Sun },
  { value: ThemePreference.Dark, icon: IconName.Moon },
  { value: ThemePreference.System, icon: IconName.Monitor },
];
