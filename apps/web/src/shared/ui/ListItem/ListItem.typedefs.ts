import type { ComponentProps, ReactNode } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { ListItemTitleStyle } from '@/shared/ui/ListItem/ListItem.constants';
import type { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';

export interface ListItemAnchorProps extends Omit<ComponentProps<'a'>, 'title' | 'children'> {
  title: string;
  subtitle?: string | null;
  icon?: IconName | null;
  tone?: NodeKind;
  selected?: boolean;
  titleStyle?: ListItemTitleStyle;
  trailing?: ReactNode | null;
  disabled?: boolean;
}
