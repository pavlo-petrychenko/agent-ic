import type { ComponentProps, ReactNode } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { CompactNodeShape } from '@/shared/ui/flow/CompactNode/CompactNode.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface CompactNodeProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
  label: string;
  kind: NodeKind;
  icon?: IconName | null;
  shape?: CompactNodeShape;
  selected?: boolean;
  faded?: boolean;
  disabled?: boolean;
  inPort?: ReactNode | null;
  outPorts?: ReactNode | null;
}
