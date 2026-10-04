import type { ComponentProps } from 'react';
import type { BannerTone } from '@/shared/ui/Banner/Banner.constants';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';

export interface BannerProps extends ComponentProps<'div'> {
  tone?: BannerTone;
  icon?: IconName | null;
}
