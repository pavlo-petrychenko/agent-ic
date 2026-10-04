import { IconName } from '@/shared/ui/Icon/Icon.constants';

export enum CalloutTone {
  Neutral = 'neutral',
  Info = 'info',
  Warn = 'warn',
  Err = 'err',
  Ok = 'ok',
}

export const CALLOUT_ICON_SIZE = 14;

export const CALLOUT_DEFAULT_ICONS: Readonly<Record<CalloutTone, IconName>> = {
  [CalloutTone.Neutral]: IconName.Info,
  [CalloutTone.Info]: IconName.Info,
  [CalloutTone.Warn]: IconName.Alert,
  [CalloutTone.Err]: IconName.Esc,
  [CalloutTone.Ok]: IconName.Check,
};

export const CALLOUT_ROLES: Readonly<Record<CalloutTone, 'status' | 'alert'>> = {
  [CalloutTone.Neutral]: 'status',
  [CalloutTone.Info]: 'status',
  [CalloutTone.Warn]: 'alert',
  [CalloutTone.Err]: 'alert',
  [CalloutTone.Ok]: 'status',
};
