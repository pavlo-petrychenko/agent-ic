import type { ComponentProps, ReactNode } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface LinkedItemAnchorProps extends ComponentProps<'a'> {
  children: ReactNode;
  icon?: IconName;
  kind?: NodeKind;
  disabled?: boolean;
}
