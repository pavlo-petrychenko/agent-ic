import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';

export interface LinkCardProps extends Omit<ComponentProps<'a'>, 'title' | 'children'> {
  href: string;
  title: string;
  icon?: IconName | null;
  kind?: NodeKind;
  description?: string | null;
  disabled?: boolean;
}
