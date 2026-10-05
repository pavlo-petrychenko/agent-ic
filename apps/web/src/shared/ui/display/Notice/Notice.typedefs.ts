import type { ComponentProps } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface NoticeAction {
  label: string;
  href?: string | null;
  onClick?: (() => void) | null;
}

export interface NoticeProps extends Omit<ComponentProps<'li'>, 'title' | 'children'> {
  icon: IconName;
  title: string;
  tone?: NodeKind;
  meta?: string | null;
  action?: NoticeAction | null;
}
