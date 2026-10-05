import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';

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
