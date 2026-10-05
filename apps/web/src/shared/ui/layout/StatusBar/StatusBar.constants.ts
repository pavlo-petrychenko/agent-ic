import { StatusKind } from '@/shared/ui/display/StatusDot';

export enum StatusTone {
  Ok = 'ok',
  Warn = 'warn',
  Err = 'err',
  Neutral = 'neutral',
}

export const STATUS_BAR_DOT_KIND: Readonly<Record<StatusTone, StatusKind>> = {
  [StatusTone.Ok]: StatusKind.Ok,
  [StatusTone.Warn]: StatusKind.Warn,
  [StatusTone.Err]: StatusKind.Err,
  [StatusTone.Neutral]: StatusKind.Idle,
};
