import type { ComponentProps } from 'react';
import type { BannerTone } from '@/shared/ui/display/Banner/Banner.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface BannerProps extends ComponentProps<'div'> {
  tone?: BannerTone;
  icon?: IconName | null;
}
