import type { ComponentProps, ReactNode } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';

export interface IconRowProps extends Omit<ComponentProps<'div'>, 'children'> {
  icon: IconName;
  label: string;
  tone?: NodeKind;
  trailing?: ReactNode | null;
}
