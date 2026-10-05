import type { ComponentProps } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface LinkCardProps extends Omit<ComponentProps<'a'>, 'title' | 'children'> {
  href: string;
  title: string;
  icon?: IconName | null;
  kind?: NodeKind;
  description?: string | null;
  disabled?: boolean;
}
