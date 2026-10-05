import type { ComponentProps, ReactNode } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import type { ListItemTitleStyle } from '@/shared/ui/navigation/ListItem/ListItem.constants';

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
