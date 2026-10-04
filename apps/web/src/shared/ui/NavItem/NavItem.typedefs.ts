import type { ComponentProps, ReactNode } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';

export interface NavItemAnchorProps extends ComponentProps<'a'> {
  icon?: IconName | null;
  meta?: ReactNode | null;
}
