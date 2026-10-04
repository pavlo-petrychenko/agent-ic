import { ThemePreference } from '@/shared/theme/constants/theme.constants';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { ThemeToggleOption } from '@/shared/ui/ThemeToggle/ThemeToggle.typedefs';

export enum ThemeToggleVariant {
  Menu = 'menu',
  Settings = 'settings',
}

export const THEME_TOGGLE_MENU_ICON_SIZE = 11;
export const THEME_TOGGLE_MENU_ICON_STROKE_WIDTH = 1.5;

export const THEME_TOGGLE_HORIZONTAL_ARROW_KEYS: readonly string[] = ['ArrowLeft', 'ArrowRight'];

export const THEME_TOGGLE_ITEM_ROLE_RESET = {
  role: undefined,
  'aria-checked': undefined,
} as const;

export const THEME_TOGGLE_OPTIONS: readonly ThemeToggleOption[] = [
  { value: ThemePreference.Light, icon: IconName.Sun },
  { value: ThemePreference.Dark, icon: IconName.Moon },
  { value: ThemePreference.System, icon: IconName.Monitor },
];
