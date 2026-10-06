import type { ComponentProps, ReactNode } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface IconRowProps extends Omit<ComponentProps<'div'>, 'children'> {
  icon: IconName;
  label: string;
  tone?: NodeKind;
  trailing?: ReactNode | null;
}
