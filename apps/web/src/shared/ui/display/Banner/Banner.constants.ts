import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export enum BannerTone {
  Info = 'info',
  Warn = 'warn',
  Err = 'err',
}

export const BANNER_ICON_SIZE = 14;

export const BANNER_DEFAULT_ICONS: Readonly<Record<BannerTone, IconName>> = {
  [BannerTone.Info]: IconName.Hand,
  [BannerTone.Warn]: IconName.Alert,
  [BannerTone.Err]: IconName.Alert,
};

export const BANNER_ROLES: Readonly<Record<BannerTone, 'status' | 'alert'>> = {
  [BannerTone.Info]: 'status',
  [BannerTone.Warn]: 'status',
  [BannerTone.Err]: 'alert',
};
