import { IconName } from '@/shared/ui/Icon';

export enum ToastTone {
  Info = 'info',
  Ok = 'ok',
  Err = 'err',
}

export enum ToastRole {
  Status = 'status',
  Alert = 'alert',
}

export const TOAST_DURATION_MS = 5000;
export const TOAST_PERSISTENT_DURATION_MS = Number.POSITIVE_INFINITY;
export const TOAST_SWIPE_DIRECTION = 'down';
export const TOAST_ICON_SIZE = 14;
export const TOAST_CONTEXT_MISSING_MESSAGE = 'useToast must be used inside ToastProvider';

export const TOAST_TONE_ICONS: Readonly<Record<ToastTone, IconName>> = {
  [ToastTone.Info]: IconName.Info,
  [ToastTone.Ok]: IconName.Check,
  [ToastTone.Err]: IconName.Alert,
};

export const TOAST_TONE_ROLES: Readonly<Record<ToastTone, ToastRole>> = {
  [ToastTone.Info]: ToastRole.Status,
  [ToastTone.Ok]: ToastRole.Status,
  [ToastTone.Err]: ToastRole.Alert,
};
