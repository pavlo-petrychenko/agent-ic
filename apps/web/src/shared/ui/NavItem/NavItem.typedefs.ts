import type { ComponentProps, ReactNode } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NavItemLayout } from '@/shared/ui/NavItem/NavItem.constants';

export interface NavItemAnchorProps extends ComponentProps<'a'> {
  icon?: IconName | null;
  meta?: ReactNode | null;
  layout?: NavItemLayout;
  tooltip?: ReactNode | null;
  disabled?: boolean;
}

export interface NavItemData {
  id: string;
  to: string;
  label: string;
  icon: IconName;
  badgeCount: number | null;
  badgeLabel: string | null;
  disabled?: boolean;
}
